const fetch = require("node-fetch");
const dotenv = require("dotenv").config();

const username = dotenv.parsed.GEO_SERVER_ADMIN;
const password = dotenv.parsed.GEO_SERVER_PASSWORD;
const baseUrl = dotenv.parsed.GEO_SERVER_URL;
const relativeUrl = "/rest/workspaces.json";
const url = `${baseUrl}${relativeUrl}`;
const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
  "base64"
);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  getWorkspace: async (req, res) => {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${encodedCredentials}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      // Process the workspace data here
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  syncWorkspace: async (req, res) => {
    try {
      const { workspaces = ["danang"] } = req.body;
      const responseWorkspace = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${encodedCredentials}`,
        },
      });
      if (!responseWorkspace.ok) {
        throw new Error(`HTTP error! Status: ${responseWorkspace.status}`);
      }
      const workspaceJson= await responseWorkspace.json();
      const workspaceAPI = workspaceJson?.workspaces?.workspace || workspaceJson?.workspace 
      if (workspaces.length > 0) {
        for (const ws of workspaces) {
          const workspace = workspaceAPI.find((api) => api.name === ws);
          const _response = await fetch(
            `${baseUrl}/rest/workspaces/${workspace.name}/datastores.json`,
            {
              headers: {
                Accept: "application/json",
                Authorization: `Basic ${encodedCredentials}`,
              },
            }
          );
          if (!_response.ok) {
            throw new Error(`HTTP error! Status: ${_response.status}`);
          }
          const _responseJson = await _response.json();
          const dataStores =
            _responseJson?.dataStore || _responseJson?.dataStores?.dataStore || [];
          const mapLayers = await prisma.mapLayer.findMany({
            select: {
              url: true,
              id: true,
            },
            where: {
              location: {
                workspace: workspace.name,
              }
            }
          });
          for (const layer of dataStores) {
            try {
              const layerAPI = await fetch(
                `${baseUrl}/${workspace.name}/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=${layer.name}&maxFeatures=52000&outputFormat=application%2Fjson`,
                {
                  method: "GET",
                  headers: {
                    Accept: "application/json",
                    // Authorization: `Basic ${encodedCredentials}`,
                  },
                }
              )
              const layerJson = await layerAPI.json()
              await prisma.feature.createMany({
                data: layerJson.features.map((item) => ({
                  name: item.id || null,
                  properties: JSON.stringify(item.properties) || null,
                  layerId: mapLayers.find((e) => e.url === layer.name)?.id || undefined,
                })),
                skipDuplicates: true,
              });
            } catch {

            }
          }
        }
        res.status(200).json({message: "Done!"})
      } else {
        // Process the workspace data here
        res.json(data);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
