<template>
  <q-btn-toggle
    class="toogleClass"
    style="margin: 10px; place-self: center"
    no-caps
    clearable
    color="white"
    text-color="#666666"
    toggle-color="secondary"
    v-model="buttonModel"
    :options="options"
    @update:model-value="selectControl"
    @clear="clearControl"
  >
    <template v-slot:one>
      <q-badge
        v-if="lineStringCount > 0"
        color="yellow"
        text-color="white"
        floating
      >
        {{ lineStringCount }}
      </q-badge>
      <q-tooltip>{{ $t("Distance") }}</q-tooltip>
    </template>

    <template v-slot:two>
      <q-icon name="img:icons/area.png" />
      <q-tooltip>{{ $t("Area") }}</q-tooltip>
      <q-badge
        v-if="polygonCount > 0"
        color="yellow"
        text-color="white"
        floating
        dense
      >
        {{ polygonCount }}
      </q-badge>
    </template>

    <template v-slot:three>
      <q-tooltip>{{ $t("Current location") }}</q-tooltip>
    </template>
  </q-btn-toggle>
  <q-separator />
  <q-list overlay v-if="drawList.length > 0">
    <q-scroll-area
      class="drawListClass"
      :style="`height: ${drawList.length * 51}px;`"
    >
      <q-item
        v-for="(item, index) of drawList"
        :key="index"
        clickable
        @click="zoomToDraw(item.position)"
      >
        <q-item-section avatar>
          <q-icon :name="item.icon" />
        </q-item-section>

        <q-item-section>
          <q-item-label>
            <span v-html="item.text"></span>
          </q-item-label>
          <q-item-label caption>
            {{ item.time }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="text-grey-8 q-gutter-xs">
            <q-btn
              class="gt-xs"
              size="12px"
              flat
              dense
              round
              icon="more_vert"
              @click.stop=""
            >
              <q-menu>
                <q-list dense>
                  <q-item clickable v-close-popup @click="detailDraw(index)">
                    <q-item-section>{{ $t("Detail") }}</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="info" />
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="downloadDraw(index)">
                    <q-item-section>{{ $t("Download") }}</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="download" />
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    @click.stop="deleteDraw(index)"
                  >
                    <q-item-section>{{ $t("Delete") }}</q-item-section>
                    <q-item-section avatar>
                      <q-icon name="delete" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-item-section>
        <q-separator />
      </q-item>
    </q-scroll-area>
    <q-separator />
    <q-btn
      flat
      dense
      color="grey"
      icon="delete"
      style="float: right"
      @click="deleteDraw()"
    />
  </q-list>
</template>

<script>
import {
  ref,
  unref,
  onMounted,
  onUnmounted,
  defineComponent,
  getCurrentInstance,
  computed,
  inject,
  watch,
} from "vue";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
import { $bus } from "boot/bus.js";
import { Feature } from "ol";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Overlay from "ol/Overlay";
import { LineString, Polygon } from "ol/geom";
import { Draw } from "ol/interaction";
import { unByKey } from "ol/Observable";
import GeoJSON from "ol/format/GeoJSON";
import { toStringHDMS } from "ol/coordinate";
import { transform } from "ol/proj";
import GeoLocationController from "src/utils/geoLocationController";
import { writeGeoJSON } from "src/utils/openLayers";
import { captureScreenshot } from "src/utils/html2Canvas";
import { drawStyle, formatArea, formatLength } from "src/utils/measure";
import { LAYER_TYPE } from "src/constants/enum";
import { useMapStore } from "stores/map";

export default defineComponent({
  name: "TabAction",
  components: {},
  emits: ["closePopup"],
  props: {
    tab: {
      type: Object,
      default: null,
    },
  },
  setup(props, { emit }) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const map = inject("map", {});
    const mapStore = useMapStore(); 
    const continueLineMsg = computed(() =>
      $t("Click to continue drawing the line")
    );
    const continuePolygonMsg = computed(() =>
      $t("Click to continue drawing the polygon")
    );

    const buttonModel = ref();
    const options = [
      { icon: "straighten", value: "LineString", slot: "one" },
      { value: "Polygon", slot: "two" },
      { icon: "place", value: "place", slot: "three" },
    ];
    // geolocation
    const geoLocation = ref(null);
    // geolocation

    // measureToolTip
    const measureTooltipElement = ref(null);
    const measureTooltip = ref(null);
    const listener = ref(null);
    const helpTooltip = ref(null);
    const helpTooltipElement = ref(null);
    // measureToolTip

    // draw type
    const source = ref(new VectorSource({ wrapX: false }));
    const vector = ref(
      new VectorLayer({
        source: unref(source),
        style: {
          "fill-color": "rgba(255, 255, 255, 0.4)",
          "stroke-color": "#ffcc33",
          "stroke-width": 2,
          "circle-radius": 7,
          "circle-fill-color": "#ffcc33",
        },
        zIndex: 10,
      })
    );
    const sketch = ref(null);
    const draw = ref(null);
    const snap = ref(null);
    const drawList = ref([]);
    const lineStringCount = computed(
      () => unref(drawList).filter((draw) => draw.type === "LineString").length
    );
    const polygonCount = computed(
      () => unref(drawList).filter((draw) => draw.type === "Polygon").length
    );
    // draw type

    // draw event
    const drawStart = ref(null);
    const drawEnd = ref(null);
    const movePointer = ref(null);
    // draw event
    const pointerMoveHandler = function (evt) {
      if (evt.dragging) {
        return;
      }
      let helpMsg = $t("Click to start drawing");
      if (unref(sketch)) {
        const geom = unref(sketch).getGeometry();
        if (geom instanceof Polygon) {
          helpMsg = unref(continuePolygonMsg);
        } else if (geom instanceof LineString) {
          helpMsg = unref(continueLineMsg);
        }
      }
      helpTooltipElement.value.innerHTML = helpMsg;
      unref(helpTooltip).setPosition(evt.coordinate);
      unref(helpTooltipElement).classList.remove("hidden");
    };

    const selectControl = (val) => {
      if (!val) {
        $bus.emit("close-popup", false);
        unref(geoLocation).removeCurrentLocation();
        return;
      }
      if (val !== "place") {
        $bus.emit("close-popup", true);
        clearControl();
        addInteraction(val);
        unref(geoLocation).removeCurrentLocation();
      } else {
        $bus.emit("close-popup", true);
        unref(geoLocation).getCurrentLocation();
        clearControl();
      }
    };
    const updateGeolocation = () => {
      unref(geoLocation).updateGeolocation();
    }
    $bus.on("on-update-geolocation", updateGeolocation)
    const clearControl = () => {
      // unbind event movePointer
      unByKey(unref(movePointer));
      // sketch clear
      sketch.value = null;
      unref(map).removeInteraction(unref(draw));
      unref(map).removeInteraction(unref(snap));
      draw.value = null;
      snap.value = null;
      if (unref(measureTooltipElement)) {
        unref(measureTooltipElement)?.parentNode?.removeChild?.(
          unref(measureTooltipElement)
        );
      }
    };
    const addInteraction = (type) => {
      if (unref(draw)) {
        unref(map).addInteraction(unref(draw));
        return;
      }
      if (!unref(vector)) {
        vector.value = new VectorLayer({
          source: unref(source),
          style: {
            "fill-color": "rgba(255, 255, 255, 0.4)",
            "stroke-color": "#ffcc33",
            "stroke-width": 2,
            "circle-radius": 7,
            "circle-fill-color": "#ffcc33",
          },
          zIndex: 10,
        });
      }
      if (!unref(map).getLayers().getArray().includes(unref(vector))) {
        unref(map).addLayer(unref(vector));
      }
      draw.value = new Draw({
        source: unref(source),
        type,
        style: drawStyle(),
      });
      drawStart.value = unref(draw).on("drawstart", function (evt) {
        // set sketch
        sketch.value = evt.feature;
        let tooltipCoord = evt.coordinate;
        listener.value = unref(sketch)
          .getGeometry()
          .on("change", function (evt) {
            const geom = evt.target;
            let output;
            let type;
            if (geom instanceof Polygon) {
              type = "Polygon";
              output = formatArea(geom);
              tooltipCoord = geom.getInteriorPoint().getCoordinates();
            } else if (geom instanceof LineString) {
              output = formatLength(geom);
              type = "LineString";
              tooltipCoord = geom.getLastCoordinate();
            }
            measureTooltipElement.value.innerHTML = output;
            unref(measureTooltip).setPosition(tooltipCoord);
          });
      });
      drawEnd.value = unref(draw).on("drawend", function (evt) {
        const time = new Date().toLocaleString();
        evt.feature.setId(time);
        const currentDocument = document.querySelectorAll(
          "div.ol-tooltip-static"
        );
        measureTooltipElement.value.className = `ol-tooltip ol-tooltip-static ${currentDocument.length}`;
        const geometryType = unref(sketch).getGeometry();
        drawList.value[unref(drawList).length] = {
          text: measureTooltipElement.value.innerHTML,
          type: geometryType instanceof LineString ? "LineString" : "Polygon",
          icon:
            geometryType instanceof LineString
              ? "straighten"
              : "img:icons/area.png",
          time,
          id: time,
          position: evt.feature.getGeometry().getExtent(),
        };
        unref(measureTooltip).setOffset([0, -7]);
        // unset sketch
        sketch.value = null;
        // unset tooltip so that a new one can be created
        measureTooltipElement.value = null;
        createMeasureTooltip();
        unByKey(unref(listener));
      });

      unref(map).addInteraction(unref(draw));
      createMeasureTooltip();
      createHelpTooltip();
      movePointer.value = unref(map).on("pointermove", pointerMoveHandler);
      unref(map)
        .getViewport()
        .addEventListener("mouseout", function () {
          unref(helpTooltipElement).classList.add("hidden");
        });
    };
    const zoomToDraw = (
      position,
      duration = 1000,
      padding = [100, 100, 100, 100]
    ) => {
      unref(map).getView().fit(position, {
        padding,
        duration,
      });
    };
    const deleteDraw = (index = -1) => {
      if (index !== -1) {
        const feature = unref(source).getFeatureById(unref(drawList)[index].id);
        if (feature) {
          unref(source).removeFeature(feature);
        }
        drawList.value.splice(index, 1);
        document.querySelectorAll("div.ol-tooltip-static")[index].remove();
      } else {
        unref(source).clear();
        document
          .querySelectorAll("div.ol-tooltip-static")
          .forEach((d, idex) => {
            d.remove();
          });
        drawList.value = [];
      }
    };
    $bus.on("on-delete-draw", deleteDraw);
    const detailDraw = async (index = -1) => {
      if (index !== -1) {
        const feature = unref(source).getFeatureById(unref(drawList)[index].id);
        if (feature) {
          mapStore.setSelectedFeature({
            feature: feature,
            layer: null,
          })
          const geoJsonData = await writeGeoJSON({ feature, map: unref(map) });
          zoomToDraw(
            unref(drawList)[index].position,
            100,
            [100, 100, 200, 300]
          );
          setTimeout(() => {
            const coordinate = toStringHDMS(
              transform(
                unref(drawList)[index].position,
                unref(map).getView().getProjection().getCode(),
                "EPSG:4326"
              )
            );
            captureScreenshot().then((response) => {
              $bus.emit("on-show-detail", {
                title: unref(drawList)[index].text,
                type: LAYER_TYPE[1],
                content: geoJsonData,
                image: response,
                coordinate: coordinate,
              });
            });
            $bus.emit("on-show-detail", { content: geoJsonData });
          }, 500);
        }
      }
    };
    const downloadDraw = async (index = -1) => {
      if (index !== -1) {
        const feature = unref(source).getFeatureById(unref(drawList)[index].id);
        if (feature) {
          const geoJsonData = await writeGeoJSON({ feature, map: unref(map) });
          const downloadLink = document.createElement("a");
          downloadLink.href =
            "data:text/json;charset=utf-8," + encodeURIComponent(geoJsonData);
          downloadLink.download = "drawn_features.json";
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      }
    };
    const createMeasureTooltip = () => {
      if (unref(measureTooltipElement)) {
        unref(measureTooltipElement)?.parentNode?.removeChild?.(
          unref(measureTooltipElement)
        );
      }
      measureTooltipElement.value = document.createElement("div");
      measureTooltipElement.value.className = "ol-tooltip ol-tooltip-measure";
      measureTooltipElement.value.setAttribute(
        "data-html2canvas-ignore",
        "true"
      );
      measureTooltip.value = new Overlay({
        element: unref(measureTooltipElement),
        offset: [0, -15],
        positioning: "bottom-center",
        stopEvent: false,
        insertFirst: false,
      });
      unref(map).addOverlay(unref(measureTooltip));
    };
    const createHelpTooltip = () => {
      if (unref(helpTooltipElement)) {
        unref(helpTooltipElement)?.parentNode?.removeChild?.(
          unref(helpTooltipElement)
        );
      }
      helpTooltipElement.value = document.createElement("div");
      helpTooltipElement.value.className = "ol-tooltip hidden";
      helpTooltipElement.value.setAttribute("data-html2canvas-ignore", "true");
      helpTooltip.value = new Overlay({
        element: unref(helpTooltipElement),
        offset: [15, 0],
        positioning: "center-left",
      });
      unref(map).addOverlay(unref(helpTooltip));
    };

    onMounted(() => {
      watch(
        () => unref(props.tab),
        (val) => {
          if (val !== "tab-action") {
            clearControl();
            $bus.emit("close-popup", false);
            buttonModel.value = null;
          }
        }
      );
      vm.$nextTick(() => {
        geoLocation.value = new GeoLocationController({
          map: unref(map),
          view: unref(map).getView(),
        });
      });
    });

    onUnmounted(() => {
      $bus.off("on-delete-draw");
    })
    return {
      vm,
      map,
      buttonModel,
      options,
      drawList,
      expanded: ref(false),
      lineStringCount,
      polygonCount,
      selectControl,
      clearControl,
      zoomToDraw,
      deleteDraw,
      downloadDraw,
      detailDraw,
    };
  },
});
</script>
<style lang="scss">
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

.ol-tooltip-measure {
  opacity: 1;
  font-weight: bold;
}

.ol-tooltip-static {
  background-color: #ffcc33;
  color: black;
  border: 1px solid white;
}

.ol-tooltip-measure:before,
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
  border-top-color: #ffcc33;
}

.drawListClass {
  max-height: 60vh;
  max-width: 300px;

  .q-scrollarea__content.absolute {
    display: flex;
    flex-direction: column-reverse;
  }
}
.q-item__section--avatar {
  min-width: 30px;
}
</style>
