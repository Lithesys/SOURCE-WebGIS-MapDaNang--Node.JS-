<template>
  <div>
    <q-uploader ref="uploaderRef" label="Custom header" multiple color="secondary" style="max-width: 300px"
      :filter="checkFileType" max-file-size="50000000" accept=".json" @added="addEvent" @removed="removeEvent"
      @rejected="onRejected">
      <template v-slot:header="scope">
        <div class="row no-wrap items-center q-pa-sm q-gutter-xs">
          <q-btn v-if="scope.queuedFiles.length > 0" icon="clear_all" @click="scope.removeQueuedFiles" round dense flat>
            <q-tooltip>{{ $t("Clear all") }}</q-tooltip>
          </q-btn>
          <q-btn v-if="scope.uploadedFiles.length > 0" icon="done_all" @click="scope.removeUploadedFiles" round dense
            flat>
            <q-tooltip>{{ $t("Remove Uploaded Files") }}</q-tooltip>
          </q-btn>
          <q-spinner v-if="scope.isUploading" class="q-uploader__spinner" />
          <div class="col">
            <div class="q-uploader__title">{{ $t("Import file here") }}</div>
            <div class="q-uploader__subtitle">
              {{ scope.uploadSizeLabel }} / {{ scope.uploadProgressLabel }}
            </div>
          </div>
          <q-btn v-if="scope.canAddFiles" type="a" icon="add_box" @click="scope.pickFiles" round dense flat>
            <q-uploader-add-trigger />
            <q-tooltip>{{ $t("Pick Files") }}</q-tooltip>
          </q-btn>
          <q-btn v-if="scope.isUploading" icon="clear" @click="scope.abort" round dense flat>
            <q-tooltip>{{ $t("Abort Upload") }}</q-tooltip>
          </q-btn>
        </div>
      </template>
      <template v-slot:list="scope">
        <q-list separator>
          <q-item v-for="(file, index) of scope.files" :key="file.__key">
            <q-item-section>
              <q-item-label class="full-width ellipsis">
                {{ file.name }}
              </q-item-label>

              <q-item-label caption> {{ $t("Status") }}: {{ file.__status }} </q-item-label>

              <q-item-label caption>
                {{ file.__sizeLabel }} / {{ file.__progressLabel }}
              </q-item-label>
            </q-item-section>

            <q-item-section v-if="file.__img" thumbnail class="gt-xs">
              <img :src="file.__img.src" />
            </q-item-section>

            <q-item-section top side>
              <q-btn class="gt-xs" size="12px" flat dense round icon="more_vert">
                <q-menu>
                  <q-list dense>
                    <q-item clickable v-close-popup @click="detailFile(index)">
                      <q-item-section>{{ $t("Detail") }}</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="info" />
                      </q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="scope.removeFile(file)">
                      <q-item-section>{{ $t("Delete") }}</q-item-section>
                      <q-item-section avatar>
                        <q-icon name="delete" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </q-item-section>
          </q-item>
        </q-list>
      </template>
    </q-uploader>
  </div>
</template>

<script>
import {
  getCurrentInstance,
  defineComponent,
  ref,
  unref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  provide,
  inject,
} from "vue";
import _debounce from "lodash/debounce";
import _difference from "lodash/difference";
import _isEmpty from "lodash/isEmpty";
import { i18n } from "boot/i18n.js";
import { $bus } from "boot/bus.js";
import { Map, View } from "ol";
import { createEmpty, extend } from "ol/extent";
import { containsExtent } from "ol/extent";
import { transform } from "ol/proj";
import {
  Fill as Fill,
  Stroke as Stroke,
  Style as Style,
  Circle as CircleStyle,
  Text as Text,
} from "ol/style";

import { toStringHDMS } from "ol/coordinate";

import proj4 from "proj4";
import { register, fromEPSGCode } from "ol/proj/proj4";
import { Vector } from "ol/layer";
import {
  Vector as VectorLayer,
  VectorImage as VectorImageLayer,
  Image as ImageLayer,
} from "ol/layer";
import { transformExtent, get as getProj } from "ol/proj";
import Overlay from "ol/Overlay";
import VectorSource from "ol/source/Vector";
import { Cluster as VectorCluster } from "ol/source";
import GeoJSON from "ol/format/GeoJSON";
import { LineString, Polygon, Point, MultiPolygon } from "ol/geom";
import { fromExtent } from "ol/geom/Polygon";

import { writeGeoJSON, geometryFunction } from "src/utils/openLayers";
import { captureScreenshot } from "src/utils/html2Canvas";
import { MAP_LAYERS } from "src/constants/layer.js";
import {
  actionAddLayerGeoJSON,
  actionAddLayerWMS,
} from "src/utils/openLayers.js";
import { LAYER_TYPE } from "src/constants/enum";

import { useMapStore } from "stores/map";
import { useQuasar, Loading } from "quasar";
import { getProjectionByName } from "src/api/projection";

export default defineComponent({
  name: "TabUpload",
  components: {},
  setup() {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const uploaderRef = ref(null);
    const map = inject("map", {});
    const mapStore = useMapStore();
    const location = computed(() => mapStore.getLocation);
    const projections = computed(() => mapStore.getProjections);
    const uploadSource = ref(null);
    const uploadCluster = ref(null);
    const uploadVector = ref(null);
    const styleCache = {}
    const uploadList = ref([]);
    const checkboxList = ref([]);

    const checkFileType = (files) => {
      return files.filter((file) => file.type === "application/json");
    };

    const parseJsonFile = async (file) => {
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = (event) => resolve(JSON.parse(event.target.result || null));
        fileReader.onerror = (error) => reject(error);
        fileReader.readAsText(file);
      });
    };

    const addEvent = async (files) => {
      try {
        const mapProjection = unref(map).getView().getProjection().getCode();
        const mapExtent = unref(map).getView().calculateExtent();
        $q.loading.show({
          message: 'Some important process  is in progress. Hang on...'
        })
        files.forEach(async (file) => {
          const defaultProjection = unref(map).getView().getProjection().getCode()
          const obj = await parseJsonFile(file);
          if (obj) {
            const crsName = obj?.crs?.properties?.name?.replace?.("::", ":") || null
            let dataProjection = "EPSG:3857"
            if (crsName) {
              dataProjection = crsName.match(/EPSG:\d+/)[0] || "EPSG:3857"
              await fromEPSGCode(dataProjection)
            }
            const listGeojsonFormat = new GeoJSON().readFeatures(obj)
            // check if feature in bound extent of the map
            for (const geojsonFormat of listGeojsonFormat) {
              if (!geojsonFormat.getGeometry()) {
                $q.notify({
                  type: "negative",
                  message: $t("This file is not a valid data!"),
                });
                $q.loading.hide();
                return;
              }
              geojsonFormat.getGeometry().transform(dataProjection, defaultProjection)
              const geomExtent = geojsonFormat?.getGeometry?.()?.getExtent?.();
              if (geomExtent) {
                if (!containsExtent(mapExtent, geomExtent)) {
                  unref(uploaderRef)?.removeFile(file);
                  $q.notify({
                    type: "negative",
                    message: $t("This feature not in bound of current view!"),
                  });
                  $q.loading.hide();
                  return;
                }
              }
            }

            const time = new Date().toLocaleString();
            uploadList.value.push({
              id: time,
              file: file,
              projection: dataProjection,
            });
            if (!unref(uploadVector)) {
              if (!unref(uploadSource)) {
                uploadSource.value = new VectorSource({ wrapX: false, zIndex: 10 });
              }
              if (!unref(uploadCluster)) {
                uploadCluster.value = new VectorCluster({
                  distance: 30,
                  minDistance: 30,
                  source: unref(uploadSource),
                  geometryFunction: geometryFunction,
                })
              }
              uploadVector.value = new VectorImageLayer({
                source: unref(uploadCluster),
                style: clusterStyleFunction,
              });
              unref(uploadVector).set('id-upload', time);
              unref(map).addLayer(unref(uploadVector));
              unref(uploadVector).on('postrender', () => {
                $q.loading.hide()
              });

            }
            unref(uploadSource).addFeatures(listGeojsonFormat);
            uploadVector.value = null;
            uploadSource.value = null;
            uploadCluster.value = null;
          }
        });
      } catch (e) {
        console.log(e)
        $q.loading.hide()
      }
    };
    const style1 = new Style({
      image: new CircleStyle({
        radius: 10,
        stroke: new Stroke({
          color: "#008080",
        }),
        fill: new Fill({
          color: "#008080",
        }),
      }),
    });

    const style2 = new Style({
      image: new CircleStyle({
        radius: 10,
        stroke: new Stroke({
          color: "#008080",
        }),
        fill: new Fill({
          color: 'rgb(0,128,128, 0.4)',
        }),
      }),
    });

    const clusterStyleFunction = function (feature, resolution) {
      const size = feature?.get?.("features")?.length || 2;
      let style = styleCache[size];
      if (size > 10 && resolution > 30) {
        style = [
          style = style1, //cluster to nhat
        ];
        styleCache[size] = style;
      } else if (size > 20 && resolution > 11) {
        style = style2;
        styleCache[size] = style;
      } else {
        style = []
        const features = feature?.get?.("features") || [feature]
        features.forEach((f) => {
          const colorFill = 'rgb(0,128,128, 0.4)'
          const colorStroke = f?.originStyle ? "BLUE" : "#008080"
          let widthStroke = f?.originStyle ? 3 : 2
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

    const removeEvent = async (files) => {
      files.forEach(async (file) => {
        const layerIndex = unref(uploadList).findIndex(
          (u) => u.file.__key === file.__key
        );
        if (layerIndex !== -1) {
          const layer = unref(map).getLayers().getArray().find((l) => l.get('id-upload') === unref(uploadList)[layerIndex].id)
          unref(map).removeLayer(layer)
          unref(uploadList).splice(layerIndex, 1)
        }
      });
    };

    const removeAllFiles = () => {
      unref(uploaderRef)?.removeQueuedFiles();
    }
    $bus.on('remove-all-files', removeAllFiles)

    const onRejected = (rejectedEntries) => {
      switch (rejectedEntries[0].failedPropValidation) {
        case "duplicate":
          $q.notify({
            type: "negative",
            message: $t("This file already imported!"),
          });
          break;
        case "accept":
          $q.notify({
            type: "negative",
            message: $t("*.json file only!"),
          });
          break;
        default:
          break;
      }
    };

    const saveFile = async () => {
      const selectedFiles = unref(uploadList).filter((up) => unref(checkboxList).includes(up.file.__key))
    }

    const detailFile = async (index) => {
      const layer = unref(map).getLayers().getArray().find((l) => {
        if (l instanceof VectorImageLayer && l.get('id-upload') === unref(uploadList)[index].id)
          return l
      })
      if (layer) {
        let _extent = createEmpty();
        const features = layer.getSource().getSource().getFeatures()
        if (features.length > 1)
          _extent = layer.getSource().getExtent()
        else {
          features.forEach((f) => {
            extend(_extent, f.getGeometry().getExtent())
          });
          // _extent = transformExtent(_extent, unref(uploadList)[index].projection, unref(map).getView().getProjection().getCode())
        }
        unref(map).getView().fit(_extent, {
          duration: 1000,
          padding: [100, 100, 100, 100],
        })
      }
    };

    onUnmounted(() => {
      $bus.off('remove-all-files')
    })

    return {
      uploaderRef,
      uploadList,
      checkboxList,
      map,
      location,
      checkFileType,
      addEvent,
      removeEvent,
      onRejected,
      detailFile,
      saveFile,
    };
  },
});
</script>
<style lang="scss" scoped>
.circle {
  border-radius: 50% !important;
}

.ol-tooltip {
  position: relative;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
  opacity: 0.7;
  white-space: nowrap;
  font-size: 12px;
  cursor: default;
  user-select: none;
}

.ol-tooltip-upload {
  opacity: 1;
  font-weight: bold;
}

.ol-tooltip-static {
  background-color: #3366ff;
  color: black;
  border: 1px solid white;
}

.ol-tooltip-upload:before,
.ol-tooltip-static:before {
  border-top: 6px solid rgba(0, 0, 0, 0.5);
  border-right: 6px solid transparent;
  border-left: 6px solid transparent;
  content: "";
  position: absolute;
  bottom: -6px;
  margin-left: -7px;
  left: 50%;
}

.ol-tooltip-static:before {
  border-top-color: #3366ff;
}
</style>
