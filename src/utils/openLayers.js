import { Map, Feature } from "ol";
import _isFunction from "lodash/isFunction";
import _isArray from "lodash/isArray";
import { Fill, Stroke, Text, Style, Circle as CircleStyle } from "ol/style";
import { ScaleLine } from "ol/control";
import { ImageWMS, TileWMS, Cluster } from "ol/source";
import VectorSource from "ol/source/Vector";
import {
  Vector as VectorLayer,
  VectorImage as VectorImageLayer,
  Image,
  Tile as TileLayer,
} from "ol/layer";
import GeoJSON from "ol/format/GeoJSON";
import { Draw, Modify, Snap } from "ol/interaction";
// geolocation
import Geolocation from "ol/Geolocation";
import Point from "ol/geom/Point";

// vue
import { ref, unref, computed } from "vue";
import { useMapStore } from "stores/map";

import { Loading } from "quasar";

import {
  CityLandDataFeature,
  BaseDataFeature,
  SOIL_TYPE_ID,
  ForestLandDataFeature,
  RoadDataFeature,
} from "src/feature/FeatureData.js";
import { getExternalFeaturesByLayer } from "src/api/feature";
import { getProjectionByName } from "src/api/projection";
const mapStore = useMapStore();
const projections = computed(() => mapStore.getProjections);
const hiddenStyle = new Style({
  fill: new Fill({
    color: "rgb(0,0,0,0)",
  }),
  stroke: new Stroke({
    color: "rgb(0,0,0,0)",
  }),
  image: null,
});

const defaultStyle = new Style({
  stroke: new Stroke({
    color: "RED",
    width: 0.25,
  }),
  fill: new Fill({
    color: "WHITE",
  }),
});

const getText = function (feature, resolution, dom) {
  const type = "wrap";
  const maxResolution = 600;
  let text = ""; //dom.label;

  if (resolution > maxResolution) {
    text = "";
  } else if (type == "hide") {
    text = "";
  } else if (type == "shorten") {
    text = text.trunc(12);
  }
  return text;
};

export const createTextStyle = function (feature, resolution, dom) {
  const size = "12px";
  const height = 1;
  const weight = "bold";
  const overflow = "true";
  const font = weight + " " + size + "/" + height + " " + "arial";
  const fillColor = dom.layer_color;
  const outlineColor = "#fffff";

  return new Text({
    textAlign: "center",
    textBaseline: "middle",
    font: font,
    text: getText(feature, resolution, dom),
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({ color: outlineColor, width: 3 }),
    offsetX: 0,
    offsetY: 0,
    placement: "point",
    // maxAngle: maxAngle,
    overflow: overflow,
    rotation: 0,
  });
};

// control
export const scaleControl = new ScaleLine({
  units: "metric",
  minWidth: 100,
});

export const zoomMapToLayer = function (map, vectorLayer) {
  let vectorSource = vectorLayer.getSource();
  vectorSource.once("change", () => {
    if (vectorSource.getState() === "ready") {
      const extent = vectorSource.getExtent();

      unref(map)
        .getView()
        .fit(extent, {
          padding: [250, 250, 250, 250],
          duration: 1000,
        });
    }
  });
};

export const FeatureUtils = {
  /**
   *
   * @param feature {Feature}
   */
  getNameOfFeature: function (feature) {
    let name = feature.get("name");
    if (!name) return null;
    return convertToCorrectFormat(name);
  },

  /**
   *
   * @param feature {Feature}
   * @param layer {VectorLayer}
   * @returns {BaseDataFeature}
   */
  getDataOfFeature: function (feature, layer) {
    /**
     *
     * @type {BaseDataFeature}
     */
    let featureData;
    switch (layer.get("name")) {
      case "Đất Đà Nẵng":
        {
          switch (feature.get("SoilTypeId")) {
            case SOIL_TYPE_ID.DAT_DON_VI_O:
              featureData = new CityLandDataFeature();
              break;
            case SOIL_TYPE_ID.RUNG_DAC_DUNG:
              featureData = new ForestLandDataFeature();
              break;
            default:
              featureData = new CityLandDataFeature();
          }
        }
        break;
      case "Giao Thông":
        featureData = new RoadDataFeature();
        break;
      case "": {
        break;
      }
      default:
        featureData = new BaseDataFeature();
        break;
    }
    featureData.setData(feature);
    return featureData;
  },
  /**
   *
   * @param style {}
   * @returns {Style}
   */
  getSelectedStyle: function (style) {
    return new Style({
      stroke: new Stroke({
        color: "BLUE",
        width: 3,
      }),
      fill: style?.getFill?.(),
    });
  },

  /**
   *
   * @param feature {Feature}
   * @param
   */
  setStyleBySoilType: function (feature) {
    let soilTypeId = feature.get("SoilTypeId");
    let color;
    switch (soilTypeId) {
      case SOIL_TYPE_ID.RUNG_DAC_DUNG:
        color = "#00AE46";
        break;
      case SOIL_TYPE_ID.DAT_DON_VI_O:
        color = "#C959D1";
        break;
      case SOIL_TYPE_ID.RUNG_PHONG_HO:
        color = "#71FF6F";
        break;
      case SOIL_TYPE_ID.DAT_DU_LICH:
        color = "#FF5A99";
        break;
      case SOIL_TYPE_ID.DAT_DICH_VU:
        color = "#F3A64B";
        break;
      case SOIL_TYPE_ID.DAT_CONG_NGHIEP:
        color = "#FFFF1D";
        break;
      case SOIL_TYPE_ID.RUNG_SAN_XUAT:
        color = "#85B66F";
        break;
      default:
        color = "WHITE";
    }
    return color;
  },

  // TODO: get other Properties of the feature here
};

// control
import { transform, transformExtent } from "ol/proj";
import proj4 from "proj4";
import { register, fromEPSGCode } from "ol/proj/proj4";
import { LineString, Polygon } from "ol/geom";

export const transformProjection = async (option) => {
  const {
    from = "EPSG:4326",
    to = "EPSG:4326",
    definition = "",
    coordinates = [0, 0],
  } = option;
  const projections = mapStore.getProjections;
  let response = null;
  if (from !== "EPSG:4326") {
    response = await fromEPSGCode(from)
    return transform(coordinates, response, to);
  } else if (to !== "EPSG:4326") {
    response = await fromEPSGCode(to)
    return transform(coordinates, from, response);
  }

};

export const getGeoJsonUrl = function (workspace, urlName) {
  return `${process.env.GEO_SERVER_URL}/${workspace}/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=${urlName}&maxFeatures=52000&outputFormat=application%2Fjson`;
};

const styleCache = {};
const style1 = new Style({
  image: new CircleStyle({
    radius: 20,
    fill: new Fill({
      color: "rgb(255,0,0, 0.1)",
    }),
  }),
});

const style2 = new Style({
  image: new CircleStyle({
    radius: 10,
    fill: new Fill({
      color: "#fff",
    }),
  }),
});

const styleDefault = new Style({
  stroke: new Stroke({
    color: "WHITE",
    width: 0.25,
  }),
  fill: new Fill({
    color: "WHITE",
  }),
});

const style3 = new Style({
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: "rgb(255,0,0, 0.5)",
    }),
    fill: new Fill({
      color: "#fff",
    }),
  }),
})

const clusterStyleFunction = function (feature, resolution) {
  const size = feature?.get?.("features")?.length || 2;
  let style = styleCache[size];
  if (size > 10 && resolution > 30) {
    style = [
      style1,
      style2,
    ];
    styleCache[size] = style;
  } else if (size > 20 && resolution > 11) {
    style = style3;
    styleCache[size] = style;
  } else {
    style = []
    const features = feature?.get?.("features") || [new Feature()]
    features.forEach((f) => {
      const colorFill = FeatureUtils.setStyleBySoilType(f)
      const colorStroke = f?.originStyle ? "BLUE" : "RED"
      let widthStroke = f?.originStyle ? 3 : 0.25
      if (f.getGeometry().getType() === 'MultiLineString' || f.getGeometry().getType() === 'LineString') widthStroke = 3
      const defaultStyle = new Style({
        stroke: new Stroke({
          color: colorStroke,
          width: widthStroke,
        }),
        fill: new Fill({
          color: colorFill,
        }),
        geometry: f.getGeometry()
      });
      style.push(defaultStyle)
    })
  }
  return style;
};

export const actionAddLayerGeoJSON = ({ layer, workspace, map}) => {
  const currentLayer = unref(map)
    .getLayers()
    .getArray()
    .find((ly) => ly.get("id") === layer.id && ly instanceof VectorImageLayer);
  if (currentLayer) {
    currentLayer.setVisible(true);
    return;
  }

  const source = new VectorSource({
    format: new GeoJSON(),
    url: getGeoJsonUrl(workspace, layer.url),
  });

  const clusterSource = new Cluster({
    distance: 20,
    minDistance: 10,
    source: source,
    geometryFunction: _geometryFunction,
  });

  const vectorLayer = new VectorImageLayer({
    id: `cluster_${layer.id}`,
    name: layer.name,
    source: clusterSource,
    style: clusterStyleFunction,
    zindex: 1,
  });
  let vectorSource = vectorLayer.getSource().getSource();
  unref(map).addLayer(vectorLayer);
  Loading.show({
    message: 'Some important process  is in progress. Hang on...'
  })
  getExternalFeaturesByLayer({ layerId: layer.id }).then((response) => {
    const defaultProjection = unref(map).getView().getProjection().getCode()
    const listExternalFeatures = []
    response.forEach(async (res) => {
      const jsonData = JSON.parse(res.properties);
      const crsName = jsonData?.crs?.properties?.name?.replace?.("::", ":") || null
      let dataProjection = "EPSG:3857"
      if (crsName) {
        dataProjection = crsName.match(/EPSG:\d+/)[0] || "EPSG:3857"
        await fromEPSGCode(dataProjection)
      }
      if (jsonData?.hasOwnProperty('features')) {
        const feature = new GeoJSON().readFeatures(jsonData);
        feature.forEach((f) => {
          f.getGeometry().transform(dataProjection, defaultProjection)
          f.setId(res.name);
        })
        listExternalFeatures.push([...feature]);
      } else {
        const feature = new GeoJSON().readFeature(jsonData);
        feature.set('id', res.name);
        listExternalFeatures.push(feature);
      }
    });
    vectorLayer.on("postrender", () => {
      source.addFeatures(listExternalFeatures.flat());
      Loading.hide()
    })
  });
  return vectorLayer;
};

/**
 *
 * @param {{ map: Map}} params
 * @returns {Style}
 */
export const actionAddLayerWMS = ({ layer, workspace, map }) => {
  const wmsSource = new ImageWMS({
    url: `${process.env.GEO_SERVER_URL}/${workspace}/wms`,
    params: {
      LAYERS: layer.url,
      FORMAT: "image/png",
    },
    crossOrigin: "anonymous",
    serverType: "geoserver",
    zIndex: 1,
    imageSize: [500, 500]
  });
  // Create a new Image layer
  const imageLayer = new Image({
    id: `${layer.url}`,
    source: wmsSource,
    zIndex: 1,
  });
  unref(map).addLayer(imageLayer);
  return imageLayer
};

export const writeGeoJSON = (option) => {
  const { feature, map } = option;
  const geoJsonFormat = new GeoJSON();
  const geometry = feature.getGeometry();
  const sourceProjection = unref(map).getView().getProjection();
  const targetProjection = "EPSG:3857";
  const transformedGeometry = geometry
    .clone()
    .transform(sourceProjection, targetProjection);
  const transformedFeature = new Feature(transformedGeometry);
  return JSON.stringify({
    ...geoJsonFormat.writeFeaturesObject([transformedFeature]),
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:EPSG::3857",
      },
    },
  });
};

export const distanceBetweenPoints = (latlng1, latlng2) => {
  const line = new LineString([latlng1, latlng2]);
  return Math.round(line.getLength() * 100) / 100;
};

const _geometryFunction = (feature) => {
  const geom = feature.getGeometry();
  const type = geom.getType();
  if (type === "Polygon") return geom.getInteriorPoint();
  else if (type === "MultiPolygon") return geom.getInteriorPoints().getPoint(0);
  else if (type === "LineString") return new Point(geom.getFirstCoordinate());
  else if (type === "MultiLineString") return new Point(geom.getLineString().getFirstCoordinate());
  else if (type === "MultiPoint") return geom.getPoints(0);
  else if (type === "Point") return geom;
};

export const geometryFunction = (feature) => _geometryFunction(feature);
