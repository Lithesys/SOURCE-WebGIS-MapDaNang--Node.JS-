<template>
  <div ref="mapRoot" class="mapView">
    <q-page-sticky class="stickyClass" position="top-left" :offset="[10, 10]">
      <FloatControl data-html2canvas-ignore v-bind="{ map: map, view: view }" @closePopup="closePopup" />
    </q-page-sticky>
    <q-page-sticky class="stickyClass" position="top-left" :offset="[stickCenterX, 10]">
      <div style="display: flex; flex-direction: row; gap: 10px">
        <FloatSearch data-html2canvas-ignore />
        <FloatZoom data-html2canvas-ignore />
      </div>
    </q-page-sticky>
    <q-page-sticky class="stickyClass" position="bottom" :offset="[10, 10]">
      <div v-html="imageHTML" />
    </q-page-sticky>
    <FloatDetail v-if="showDetail" data-html2canvas-ignore v-model="showDetail" v-bind="floatDetailProps"
      @update:model-content="floatDetailProps.content = $event" />
  </div>
  <div ref="popupRef" class="ol-popup">
    <q-btn ref="popupCloser" class="ol-popup-closer" flat round icon="close" @click="actionClosePopup"></q-btn>
    <div ref="popupContent"></div>
  </div>
</template>

<script>
import "ol/ol.css";
import { Map, View, Overlay } from "ol";
import { createEmpty, extend } from "ol/extent";
import { toStringHDMS } from "ol/coordinate";
import { Fill, Stroke, Style } from "ol/style";
import { writeGeoJSON } from "src/utils/openLayers";
import GeoJSON from "ol/format/GeoJSON";
import { OSM } from "ol/source";
import {
  Tile as TileLayer,
  Vector as VectorLayer,
  Image as ImageLayer,
  VectorImage as VectorImageLayer
} from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Point } from "ol/geom";
import { unByKey } from "ol/Observable";
import { scaleControl } from "src/utils/openLayers";
import { transform, Projection } from "ol/proj";
import { register } from "ol/proj/proj4";
import { useLocationStore } from "stores/location";
import { useMapStore } from "stores/map";

import proj4 from "proj4";
register(proj4);

import {
  defineComponent,
  computed,
  ref,
  unref,
  onMounted,
  onUnmounted,
  onUpdated,
  getCurrentInstance,
  provide,
} from "vue";
import _debounce from "lodash/debounce";
import _isEmpty from "lodash/isEmpty";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
import { $bus } from "boot/bus.js";
import FloatSearch from "src/components/floatSearch/index.vue";
import FloatDetail from "src/components/floatDetail/index.vue";
import FloatControl from "src/components/floatControl/index.vue";
import FloatZoom from "src/components/floatZoom.vue";
import { FeatureUtils, distanceBetweenPoints } from "src/utils/openLayers";
import { getFeature } from "src/api/feature";
import { captureScreenshot } from "src/utils/html2Canvas";
import { LAYER_TYPE, FEATURE_TYPE } from "src/constants/enum";

export default defineComponent({
  name: "IndexPage",
  components: {
    FloatSearch,
    FloatDetail,
    FloatControl,
    FloatZoom,
  },
  props: {},
  setup(props) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const locationStore = useLocationStore();
    const mapStore = useMapStore();
    const showDetail = ref(false);
    const floatDetailProps = ref({
      title: null,
      image: "images/No-image-available.png",
      content: {},
      type: LAYER_TYPE[0],
      id: null,
      coordinate: null,
    });
    const imageHTML = ref(null);
    const layerForImage = ref(new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        stroke: new Stroke({
          color: "BLUE",
          width: 3,
        }),
      }),
      zIndex: 2,
    }
    ));
    unref(layerForImage).set("id", "selected-layer")
    const onShowDetail = (option) => {
      const {
        content,
        image,
        title,
        type = LAYER_TYPE[0],
        coordinate,
        feature_type = FEATURE_TYPE[0]
      } = option;
      showDetail.value = true;
      if (title) {
        floatDetailProps.value.title = title;
      }
      if (image) {
        floatDetailProps.value.image = image;
      }
      if (content) {
        floatDetailProps.value.content =
          typeof content === "string" ? JSON.parse(content) : content;
        if (floatDetailProps.value?.content?.RefName || floatDetailProps.value?.content?.tendat || floatDetailProps.value?.content?.name) {
          const _title = floatDetailProps.value?.content?.RefName || floatDetailProps.value?.content?.tendat || floatDetailProps.value?.content?.name;
          try {
            floatDetailProps.value.title = decodeURIComponent(escape(_title));
          } catch {
            floatDetailProps.value.title = _title;
          }
        }
      }
      if (coordinate) {
        floatDetailProps.value.coordinate = coordinate;
      }
      if (type !== LAYER_TYPE[0]) {
        floatDetailProps.value.type = type;
      }
      if (feature_type !== FEATURE_TYPE[0]) {
        floatDetailProps.value.feature_type = feature_type;
      }
    };
    $bus.on("on-show-detail", onShowDetail);
    // popup
    const popupRef = ref(null);
    const popupContent = ref(null);
    const popupCloser = ref(null);
    const popupEvent = ref(null);
    const pointermoveEvent = ref(null);
    const selectedObject = ref({});
    const overlay = ref(null);
    const addOverlay = () => {
      overlay.value = new Overlay({
        element: unref(popupRef),
        autoPan: {
          animation: {
            duration: 250,
          },
        },
      });
    };

    const closePopup = (state) => {
      if (state === true) {
        unref(layerForImage).getSource().clear();
        const lastFeature = unref(selectedObject).lastFeature;
        const lastLayer = unref(selectedObject).lastLayer;
        if (lastFeature) lastFeature.originStyle = false;
        if (lastLayer) lastLayer?.changed?.();
        unref(selectedObject).lastFeature = null;
        unByKey(unref(popupEvent));
        popupEvent.value = false;
        unref(overlay).setPosition(undefined); //obsolete
      } else if (_isEmpty(unref(popupEvent))) {
        initPopupEvent()
      }
    };
    $bus.on("close-popup", closePopup);
    const actionClosePopup = () => {
      // when close popup, clear the vectorforImage
      unref(layerForImage).getSource().clear();
      showDetail.value = false;
      floatDetailProps.value = {
        title: null,
        image: "images/No-image-available.png",
        content: {},
        type: LAYER_TYPE[0],
        feature_type: FEATURE_TYPE[0],
        id: null,
        coordinate: null,
      };
      const lastFeature = unref(selectedObject).lastFeature;
      const lastLayer = unref(selectedObject).lastLayer;
      if (lastFeature) lastFeature.originStyle = false;
      if (lastLayer) lastLayer?.changed?.();
      unref(selectedObject).lastFeature = null;
      unref(layerForImage).getSource().clear();
      unref(overlay).setPosition(undefined);
    };
    $bus.on("close-float-detail", actionClosePopup);
    const onRemoveLayer = (layerUrl) => {
        if (unref(layerForImage).url === layerUrl) actionClosePopup();
    };

    $bus.on("remove-layer", onRemoveLayer);

    const getFeatureAPI = _debounce((feature) => {
      const properties = feature.getProperties()
      delete properties.geometry
      floatDetailProps.value.id = feature.getId();
      floatDetailProps.value.title = feature.getId();
       onShowDetail({
        content: properties || {},
      });
      // getFeature({ name: featureId })
      //   .then((response) => {
      //     if (FEATURE_TYPE[1] === response.type) {
      //       floatDetailProps.value.feature_type = response.type;
      //     }
      //     floatDetailProps.value.id = response.id;
      //     onShowDetail({
      //       content: JSON.parse(response?.properties || false),
      //     });
      //   })
      //   .catch((e) => console.log(e));
    }, 200);

    const getFeatureUpload = (feature) => {
      const objData = writeGeoJSON({ feature, map: unref(map) })
      onShowDetail({
        content: objData,
      });
    }

    const styleChangeListener = function (feature) {
      feature.on("change", function (event) {
        setTimeout(() => {
          captureScreenshot().then((response) => {
            floatDetailProps.value.image = response;
          });
        }, 1000);
      });
    };

    const initPopupEvent = () => {
      const highLightFeature = function (feature, layer) {
        let lastFeature = unref(selectedObject).lastFeature;
        let lastLayer = unref(selectedObject).lastLayer;
        if (lastFeature !== feature) {
          if (lastFeature) lastFeature.originStyle = false;
          feature.originStyle = true;
          unref(selectedObject).lastFeature = feature;
          lastLayer?.changed?.();
          unref(selectedObject).lastLayer = layer;
          return true;
        } else {
          feature.originStyle = false;
          unref(selectedObject).lastFeature = null;
          return false;
        }
      };

      popupEvent.value = unref(map).on("singleclick", function (evt) {
        let location = locationStore.getStartLocation;
        location = transform(
          location,
          "EPSG:3857",
          unref(map).getView().getProjection()
        );
        floatDetailProps.value.distance = distanceBetweenPoints(
          location,
          evt.coordinate
        );
        unref(map).forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
          if (!layer || layer instanceof VectorLayer) return feature;
          if (layer.get("id-upload")) {
            floatDetailProps.value.type = LAYER_TYPE[1]
          }
          layer.getFeatures(evt.pixel).then((response) => {
            const _extent = createEmpty();
            extend(_extent, feature);
            response.forEach((r) => {
              const f = r
                .get("features")
                .find((f) => {
                  extend(_extent, f.getGeometry().getExtent())
                  return f.getGeometry().intersectsCoordinate(evt.coordinate)
                }
                );
              if (!f) {
                unref(map)
                  .getView()
                  .fit(_extent, {
                    duration: 1000,
                    padding: [2000, 2000, 2000, 2000],
                    maxZoom: 15,
                  });
                return
              }
              const isHighLight = highLightFeature(f, layer);
              layer.changed();
              if (isHighLight) {
                extend(_extent, f.getGeometry().getExtent());
                unref(map)
                  .getView()
                  .fit(f.getGeometry().getExtent(), {
                    duration: 500,
                    padding: [50, 50, 50, 50],
                  });
                const featureId = f.getId();
                const dataFeature = FeatureUtils.getDataOfFeature(
                  f,
                  layer
                );
                const coordinate = evt.coordinate;
                dataFeature.setLocation(coordinate);
                // set float detail
                if (featureId) getFeatureAPI(featureId);
                else getFeatureUpload(f);
                // screenshot
                floatDetailProps.value.title = dataFeature.name;
                floatDetailProps.value.coordinate = toStringHDMS(
                  transform(
                    coordinate,
                    unref(map).getView().getProjection().getCode(),
                    "EPSG:4326"
                  )
                ).replace("N ", "N\n");
                setTimeout(() => {
                  captureScreenshot().then((response) => {
                    floatDetailProps.value.image = response;
                  });
                }, 800);
                // set float detail
              } else {
                actionClosePopup();
              }
            });
          });
        });
        unref(map).getLayers().getArray().forEach((layer) => {
          if (layer instanceof ImageLayer) {
            const url = layer.getSource().getFeatureInfoUrl(
              evt.coordinate,
              unref(map).getView().getResolution(),
              'EPSG:5899',
              { 'INFO_FORMAT': 'application/json' }
            )
            if (url) {
              fetch(url)
                .then((response) => response.text())
                .then((html) => {
                  const features = new GeoJSON().readFeatures(html)
                  if (features.length) {
                    const isSelected = unref(layerForImage).getSource().getFeatures()
                    if (isSelected.some((f) => f?.getId?.() === features[0].getId?.())) {
                      actionClosePopup();
                      return;
                    }
                    unref(layerForImage).url = layer.url;
                    unref(layerForImage).getSource().clear();
                    unref(layerForImage).getSource().addFeatures(features)
                    mapStore.setSelectedFeature({
                      layer,
                      feature: features[0]
                    })
                    unref(map).getView().fit(
                      features[0].getGeometry().getExtent(),
                      {
                        duration: 600,
                        padding: [100, 100, 100, 100],
                      }
                    )
                    if (features[0].getId?.()) getFeatureAPI(features[0]);
                    setTimeout(() => {
                      captureScreenshot().then((response) => {
                        floatDetailProps.value.image = response;
                      });
                    }, 1500);
                  } else {
                    actionClosePopup();
                  }
                });
            }
          }
        })
      });
    };
    // popup

    /**
     *
     * @type {Map}
     */
    const map = ref(null);
    provide("map", map);
    const view = ref(
      new View({
        zoom: 0,
        center: [0, 0],
        extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
      })
    );
    onMounted(() => {
      addOverlay();
      map.value = new Map({
        target: vm.$refs["mapRoot"],
        controls: [scaleControl],
        overlays: [unref(overlay)],
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: unref(view),
      });
      initPopupEvent();
      unref(map).addLayer(unref(layerForImage))
    });
    onUnmounted(() => {
      $bus.off("close-popup");
      $bus.off("close-float-detail");
      $bus.off("on-show-detail");
    });
    const stickCenterX = ref(window.outerWidth / 10 * 2.2)

    return {
      map,
      view,
      showDetail,
      floatDetailProps,
      imageHTML,
      popupRef,
      popupCloser,
      popupEvent,
      actionClosePopup,
      popupContent,
      closePopup,
      stickCenterX,
    };
  },
});
</script>
<style lang="scss" scoped>
html,
body {
  width: 100%;
  height: 100%;
}

.mapView {
  height: 93vh;
  width: 100%;
  min-height: inherit;

  :global(.ol-scale-bar.ol-unselectable) {
    margin-left: 50px !important;
  }
}

.stickyClass {
  z-index: 1;
}

.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
}

.ol-popup:after,
.ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}

.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}

.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}

.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
}
</style>
