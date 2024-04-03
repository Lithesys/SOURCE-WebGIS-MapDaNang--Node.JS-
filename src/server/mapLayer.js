const { PrismaClient } = require("@prisma/client");
const { update } = require("lodash");

const prisma = new PrismaClient();

module.exports = {
  /**
   * @swagger
   * /api/mapLayers:
   *   post:
   *     tags:
   *       - MapLayers
   *     summary: Create a map layer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MapLayer'
   *     responses:
   *       200:
   *         description: Map layer created successfully
   *       400:
   *         description: Invalid request
   */
  create: async (req, res) => {
    const { name, description, url, type, locationId } = req.body;
    try {
      const upsertMapLayer = await prisma.mapLayer.create({
        data: {
          name: name || "",
          description: description || "",
          url: url || "",
          type: type || LayerType.VECTOR_LAYER,
          locationId: locationId ? parseInt(locationId) : null,
        },
      });
      res.json(upsertMapLayer);
    } catch {
      res.status(400).json({message: "Layer create attempt failed!"})
    }
  },
  /**
   * @swagger
   * /api/mapLayers:
   *   post:
   *     tags:
   *       - MapLayers
   *     summary: Create a map layer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MapLayer'
   *     responses:
   *       200:
   *         description: Map layer created successfully
   *       400:
   *         description: Invalid request
   */
  updateOrCreate: async (req, res) => {
    const { id, title, description, url, location, locationId } = req.body;
    try {
      const upsertMapLayer = await prisma.mapLayer.upsert({
        where: {
          id: id,
        },
        update: {
          title: title,
          description: description,
          url: url,
          location: location,
          locationId: locationId,
        },
        create: {
          id,
          title,
          description,
          url,
          location,
          locationId,
        },
      });
      res.json(upsertMapLayer);
    } catch {
      res.status(400).json({message: "Layer update attempt failed!"})
    }
  },
  /**
   * @swagger
   * /api/mapLayers:
   *   get:
   *     tags:
   *       - MapLayers
   *     summary: Get map layers by location
   *     responses:
   *       200:
   *         description: Successful operation
   */
  find: async (req, res) => {
    const { id } = req.query;
    try {
      const mapLayer = await prisma.mapLayer.findUnique({
        where: {
          id: id,
        },
      });
      res.json(mapLayer);
    } catch {
      res.status(400).json({message: "Cannot find the layer!"})
     }
  },

  /**
   * @swagger
   * /api/mapLayers/getByLocation/{locationId}:
   *   get:
   *     tags:
   *       - MapLayers
   *     summary: Get mapLayers by location ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MapLayer'
   *     responses:
   *       200:
   *         description: Map layer updated successfully
   *       400:
   *         description: Invalid request
   */
  getbyLocation: async (req, res) => {
    const { locationId: _locationId } = req.params;
    const locationId = parseInt(_locationId);
    const { page = 1, per_page = 10, search = "" } = req.query;
    try {
      const [count, data] = await prisma.$transaction([
        prisma.mapLayer.count({
          where: {
            AND: [
              {
                locationId,
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
        }),
        prisma.mapLayer.findMany({
          skip: (parseInt(page) - 1) * parseInt(per_page),
          take: parseInt(per_page),
          where: {
            AND: [
              {
                locationId,
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
        }),
      ]);
      res.json({
        count,
        data,
        per_page: parseInt(per_page),
        page: parseInt(page),
      });
    } catch {
      res.status(400).json({message: "Cannot find get the layer by given location!"})
    }
  },

  /**
   * @swagger
   * /api/mapLayers:
   *   put:
   *     tags:
   *       - MapLayers
   *     summary: Update a map layer by ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MapLayer'
   *     responses:
   *       200:
   *         description: Map layer updated successfully
   *       400:
   *         description: Invalid request
   */
  update: async (req, res) => {
    const { title, description, url, location, locationId } = req.body;
    const { id } = req.query;
    try {
      const updateMapLayer = await prisma.mapLayer.update({
        where: {
          id: id,
        },
        data: {
          title: title,
          description: description,
          url: url,
          location: location,
          locationId: locationId,
        },
      });
      res.json(updateMapLayer);
    } catch {
      res.status(400).json({message: "Layer update attempt failed!"})
    }
  },
  /**
   * @swagger
   * /api/mapLayers/{id}:
   *   delete:
   *     tags:
   *       - MapLayers
   *     summary: Delete a map layer by ID
   *     responses:
   *       200:
   *         description: Map layer deleted successfully
   *       404:
   *         description: Map layer not found
   *   get:
   *     tags:
   *       - MapLayers
   *     summary: get a map layer by ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/MapLayer'
   *     responses:
   *       200:
   *         description: Map layer updated successfully
   *       400:
   *         description: Invalid request

   */
  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const deleteMapLayer = await prisma.mapLayer.delete({
        where: {
          id: parseInt(id),
        },
      });
      res.json(deleteMapLayer);
    } catch (e) {
      console.log(e)
      res.status(400).json({message: "Layer delete attempt failed!"})
    }
  },
};
