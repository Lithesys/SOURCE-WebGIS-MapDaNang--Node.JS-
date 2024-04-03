const { PrismaClient, Role } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = {
  /**
   * @swagger
   * /api/register:
   *   post:
   *     tags:
   *       - Users
   *     summary: Register User
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Register'
   *     responses:
   *       200:
   *         description: User registered successfully
   *       401:
   *         description: Unauthorized
   */
  register: async (req, res) => {
    const { email, password, profile } = req.body;
    try {
    const user = await prisma.user.create({
      data: {
        email,
        password: password || undefined,
        profile: {
          create: {
            sub: profile.sub || undefined,
            email: email || profile.email || undefined,
            name: profile.name || undefined,
            given_name: profile.given_name || undefined,
            family_name: profile.family_name || undefined,
            picture: profile.picture || undefined,
          },
        },
      },
      include: {
        profile: true,
      },
    })
    res.json(user);
    } catch (e) {
      res.status(404);
      res.json({ error: "There is some errors!" });
    }
  },
  /**
   * @swagger
   * /api/login:
   *   post:
   *     tags:
   *       - Users
   *     summary: User login
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginCredentials'
   *     responses:
   *       200:
   *         description: User logged in successfully
   *       401:
   *         description: Unauthorized
   */
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
        include: {
          profile: true,
        },
      });
      if (user?.password === password) {
        delete user["password"];
        res.json(user);
      } else {
        res.status(404);
        res.json({ error: "Wrong email or password!" });
      }
    } catch {
      res.status(404);
      res.json({ error: "There is some errors!" });
    }
  },
  /**
   * @swagger
   * /api/login-google:
   *   post:
   *     tags:
   *       - Users
   *     summary: User login with Google
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GoogleLoginCredentials'
   *     responses:
   *       200:
   *         description: User logged in with Google successfully
   *       401:
   *         description: Unauthorized
   */
  loginGoogle: async (req, res) => {
    const { email, password, role, profile } = req.body;
    try {
      const user = await prisma.user.upsert({
        where: {
          email,
        },
        update: {
          password: password || undefined,
          profile: {
            update: {
              sub: profile.sub || undefined,
              email: email || profile.email || undefined,
              name: profile.name || undefined,
              given_name: profile.given_name || undefined,
              family_name: profile.family_name || undefined,
              picture: profile.picture || undefined,
            },
          },
        },
        create: {
          email,
          password: password || undefined,
          profile: {
            create: {
              sub: profile.sub || undefined,
              email: email || profile.email || undefined,
              name: profile.name || undefined,
              given_name: profile.given_name || undefined,
              family_name: profile.family_name || undefined,
              picture: profile.picture || undefined,
            },
          },
        },
        include: {
          profile: true,
        },
      });
      delete user["password"];
      if (!user["activate"]) {
        res.status(400).json({ error: 'This account has been deactivated!' })
      }
      res.json(user);
    } catch (e) {
      res.status(400).json({message: "Cannot login with google!"})
    }
  },
  /**
   * @swagger
   * /api/users:
   *   post:
   *     tags:
   *       - Users
   *     summary: Create a user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/User'
   *     responses:
   *       200:
   *         description: User created successfully
   *       400:
   *         description: Invalid request
   *   put:
   *     tags:
   *       - Users
   *     summary: Update a user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/User'
   *     responses:
   *       200:
   *         description: User updated successfully
   *       400:
   *         description: Invalid request
   */
  updateOrCreateUser: async (req, res) => {
    const { email, password, role, profile } = req.body;
    try {
      const upsertUser = await prisma.user.upsert({
        where: {
          email,
        },
        update: {
          password,
          role: role || Role.USER,
          profile: {
            update: {
              sub: profile.sub || undefined,
              email: email || profile.email || undefined,
              name: profile.name || undefined,
              given_name: profile.given_name || undefined,
              family_name: profile.family_name || undefined,
              picture: profile.picture || undefined,
              gender: profile.gender || undefined,
              address: profile.address || undefined,
              birthday: profile.birthday || undefined,
            },
          },
        },
        create: {
          email,
          profile: {
            create: {
              sub: profile.sub || undefined,
              email: email || profile.email || undefined,
              name: profile.name || undefined,
              given_name: profile.given_name || undefined,
              family_name: profile.family_name || undefined,
              picture: profile.picture || undefined,
              gender: profile.gender || undefined,
              address: profile.address || undefined,
              birthday: profile.birthday || undefined,
            },
          },
        },
      });
      res.json(upsertUser);
    } catch (e) {
      res.status(400).json({message: "Unxepected errors!"})
    }
  },
  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     tags:
   *        - Users
   *     summary: Get a user by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: OK
   *       404:
   *         description: User not found
   */
  findUser: async (req, res) => {
    const id = req.params.id;
    try {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });
      res.json(user);
    } catch {
      res.status(400).json({message: "Cannot find the user!"})
    }
  },

  findUserByEmail: async (req, res) => {
    const email = req.params.email;
    try {
      const user = await prisma.user.findUnique({
        where: {
          email : email,
        },
      });
      res.json(user);
    } catch {
      res.status(400).json({message: "Cannot find the user!"})
    }
  },

  /**
   * @swagger
   * /api/users:
   *   get:
   *     tags:
   *       - Users
   *     summary: Get all users
   *     responses:
   *       200:
   *         description: Successful operation
   */
  getAll: async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        include: {
          profile: true,
        },
      });
      res.json(users);
    } catch {
      res.status(400).json({message: "Cannot find any users!"})
    }
  },
  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     tags:
   *       - Users
   *     summary: Update a user by ID
   *     parameters:
   *       - name: id
   *         in: path
   *         description: User ID
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: User activated successfully
   *       404:
   *         description: User not found
   */
  activateUser: async (req, res) => {
    const id = req.params.id;
    const { activate } = req.body;
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          activate,
        },
      });
      res.json(user);
    } catch {
      res.status(400).json({message: "Cannot deactivate the user!"})
    }
  },
  /**
   * @swagger
   * /api/users:
   *   delete:
   *     tags:
   *       - Users
   *     summary: Delete a user
   *     responses:
   *       200:
   *         description: User deleted successfully
   *       404:
   *         description: User not found
   */
  delete: async (req, res) => {
    const { id } = req.query;
    try {
      const deleteUser = await prisma.user.delete({
        where: {
          id: id,
        },
      });
      res.json(deleteUser);
    } catch {
      res.status(400).json({message: "User delete attempt failed!"})
    }
  },
};
