const dotenv = require('dotenv').config();
// server.js
const workspaceAPI = require('./src/server/services/workspace');
const projectionAPI = require('./src/server/projection');
const featureAPI = require('./src/server/feature');
const userAPI = require('./src/server/user');
const profileAPI = require('./src/server/profile');
const mapLayerAPI = require('./src/server/mapLayer');
const locationAPI = require('./src/server/location');
const express = require('express');
const cors = require('cors');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WebGIS API',
      version: '1.0.0',
      description: 'API documentation for WebGIS'
    },
    servers: [
      {
        url: `${dotenv.parsed.BASE_HOST}:${dotenv.parsed.API_PORT}` // Update with your server URL
      }
    ]
  },
  apis: ['./src/server/*.js'] // Update with the path to your API files
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// user
app.get('/api/users/:id', userAPI.findUser);
app.get('/api/users/findByEmail/:email', userAPI.findUserByEmail);
app.delete('/api/users', userAPI.delete);
app.get('/api/users', userAPI.getAll);
app.post('/api/users', userAPI.updateOrCreateUser);
app.put('/api/users/:id', userAPI.activateUser);
app.post('/api/login', userAPI.login);
app.post('/api/login-google', userAPI.loginGoogle);
app.post('/api/register', userAPI.register);
// profile
app.get('/api/profile', userAPI.getAll);
app.put('/api/profile/:id', profileAPI.update);

// mapLayer
app.post('/api/mapLayers', mapLayerAPI.create);
app.put('/api/mapLayers/:id', mapLayerAPI.updateOrCreate);
app.get('/api/mapLayers/:id', mapLayerAPI.find);
app.get('/api/mapLayers/getByLocation/:locationId', mapLayerAPI.getbyLocation);
app.delete('/api/mapLayers/:id', mapLayerAPI.delete);
// feature
app.post('/api/features', featureAPI.create);
app.get('/api/features/:name', featureAPI.get);
app.delete('/api/features/:id', featureAPI.delete);
app.put('/api/features/:id', featureAPI.update);
app.get('/api/mapLayers/:layerId/features', featureAPI.getByLayer);
app.get('/api/mapLayers/:layerId/features/external', featureAPI.getByLayerExternal);

//location
app.post('/api/locations', locationAPI.create);
app.put('/api/locations/:id', locationAPI.update);
app.get('/api/locations/:id', locationAPI.get);
app.get('/api/locations', locationAPI.getAll);
app.delete('/api/locations/:id', locationAPI.delete);
// projection
app.get('/api/projections', projectionAPI.getAll);
app.get('/api/projections/:id', projectionAPI.get);
app.get('/api/projections/name/:name', projectionAPI.getbyName);
app.post('/api/projections', projectionAPI.create);
app.put('/api/projections/:id', projectionAPI.update);
// workspace
app.get('/api/workspaces', workspaceAPI.getWorkspace);
app.post('/api/workspaces/sync', workspaceAPI.syncWorkspace);
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});
