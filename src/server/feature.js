const { PrismaClient, FeatureType } = require("@prisma/client");
const prisma = new PrismaClient();
module.exports = {
  /**
   * @swagger
   * /api/features:
   *   post:
   *     tags:
   *       - Features
   *     summary: Create a feature
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Feature'
   *     responses:
   *       200:
   *         description: Feature created successfully
   *       400:
   *         description: Invalid request
   */
  create: async (req, res) => {
    const { features, layerId } = req.body;
    try {
      let count =
        await prisma.$queryRaw`SELECT SUBSTRING_INDEX(f.name, '.', 1) as name , SUBSTRING_INDEX(f.name, '.', -1) as largest FROM Feature AS f
          WHERE f.layerId = ${parseInt(layerId)}
          ORDER BY CAST(SUBSTRING_INDEX(f.name, '.', -1) AS UNSIGNED) DESC LIMIT ${1}`;
      count = count[0];
      const featuresData = await prisma.feature.createMany({
        data: features.map((item) => ({
          name: `${count.name}.${++count.largest}`,
          type: FeatureType.EXTERNAL,
          ...item,
          layerId: layerId,
        })),
        skipDuplicates: true, // Skip 'Bobo'
      });
      res.json(featuresData);
    } catch (e) {
      res.status(400).json({message: "Feature create attempt failed!"})
    }
  },
  /**
   * @swagger
   * /api/features/{id}:
   *   put:
   *     tags:
   *       - Features
   *     summary: Update a feature by ID
   *     parameters:
   *       - name: id
   *         in: path
   *         description: Feature ID
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Feature'
   *     responses:
   *       200:
   *         description: Feature updated successfully
   *       404:
   *         description: Feature not found
   */
  update: async (req, res) => {
    const id = req.params.id;
    const { feature } = req.body;
    try {
      const data = await prisma.feature.update({
        where: {
          id,
        },
        data: {
          ...feature,
        },
      });
      res.json(data);
    } catch {
      res.status(400).json({message: "Feature update attempt failed!"})
    }
  },
  /**
   * @swagger
   * /api/features/{name}:
   *   get:
   *     tags:
   *       - Features
   *     summary: Get a feature by name
   *     parameters:
   *       - name: name
   *         in: path
   *         description: Feature name
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Successful operation
   *       404:
   *         description: Feature not found
   */
  get: async (req, res) => {
    const { name } = req.params;
    const data = await prisma.feature.findUnique({
      where: {
        name,
      },
    });
    res.json(data);
  },
  /**
   * @swagger
   * /api/features/{name}:
   *   get:
   *     tags:
   *       - Features
   *     summary: Get a feature by Layer
   *     parameters:
   *       - name: layerId
   *         in: path
   *         description: Feature name
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Successful operation
   *       404:
   *         description: Feature not found
   */
  getByLayer: async (req, res) => {
    const { layerId } = req.params;
    const { page = 1, per_page = 50, search = "" } = req.query;
    const query = "%" + search + "%";
    const data =
      await prisma.$queryRaw`SELECT * FROM feature  WHERE feature.layerId = ${parseInt(
        layerId
      )} AND name LIKE ${query} ORDER BY CAST(SUBSTRING_INDEX(name, '.', -1) AS UNSIGNED) ASC LIMIT ${per_page} OFFSET ${
        (page - 1) * per_page
      };`;
    const count = await prisma.feature.count({
      where: {
        AND: [
          {
            layerId: parseInt(layerId),
          },
          {
            OR: [
              {
                name: {
                  contains: search,
                },
              },
              {
                name: {
                  in: search || undefined,
                },
              },
              {
                name: {
                  equals: search || undefined,
                },
              },
            ],
          },
        ],
      },
    });
    res.json({
      data,
      per_page: parseInt(per_page),
      page: parseInt(page),
      count,
    });
  },

  getByLayerExternal: async (req, res) => {
    const { layerId } = req.params;
    try {
      const data = await prisma.feature.findMany({
        where: {
          AND: [
            {
              layerId: parseInt(layerId),
            },
            {
              type: FeatureType.EXTERNAL,
            },
          ]
        },
        select: {
          name: true,
          properties: true,
          type: true,
        }
      });
      res.json(data);
    } catch (e) {
      res.status(400).json({message: "Cannot get features by given layerId!"})
    }
  },

  /**
   * @swagger
   * /api/features/{name}:
   *   delete:
   *     tags:
   *       - Features
   *     summary: Get a feature by Layer
   *     parameters:
   *       - name: featureId
   *         in: path
   *         description: Feature id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Successful operation
   *       404:
   *         description: Feature not found
   */
  delete: async (req, res) => {
    const id = req.params.id;
    try {
      const response = await prisma.feature.delete({
        where: {
          id,
        },
      });
      res.json(response);
    } catch (e) {
      res.status(400).json({message: "Feature delete attempt failed!"})
    }
  },
};
