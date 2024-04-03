import {Fill, Stroke, Style, Circle as CircleStyle} from "ol/style";
import VectorSource from "ol/source/Vector";
import {Vector as VectorLayer} from "ol/layer";
// geolocation
import Geolocation from "ol/Geolocation";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { transform } from "ol/proj";


export class LayerController {
  constructor(option = {}) {
    /**
     *
     * @type {{VectorLayer}}
     */
    this.layers = {};
  }

  /**
   * @param layerId
   * @param layer {VectorLayer}
   */
  addLayer(layerId, layer) {
    if (!this.layers[layerId]) {
      this.layers[layerId] = layer;
    }
  }

  findFeatureByGPS(long, lat, fromProj = "EPSG:4326", desProj = "EPSG:5899") {
    let layerPolygon = this.getLayerPolygon();
    if (!layerPolygon) return;
    const point = new Point([lat,long]);
    point.transform(fromProj, desProj);
    layerPolygon.getSource().getFeatures().forEach((feature) => {
      if (feature.getGeometry().intersectsCoordinate(point.getCoordinates())) {
        return feature;
      }
    })
  }

  getLayerPolygon() {
    return this.layers["danang:polygon"];
  }

  /**
   *
   * @param id
   * @returns {VectorLayer}
   */
  getLayer(id) {
    return this.layers[id];
  }

  removeLayer(id) {
    this.layers[id] = null;
  }

  clearAll() {
    this.layers = {};
  }
}

export default LayerController
