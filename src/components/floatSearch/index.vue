<template>
  <div style="display: flex; flex-direction: row; gap: 10px; max-height: 56px">
    <q-btn class="bg-secondary text-white" rounded icon="public" @click="backToWorldMap">
      <q-tooltip>{{ $t("Back to world map") }}</q-tooltip>
    </q-btn>
    <q-select class="searchClass shadow-10" ref="locationSearchRef" v-model="searchLocation" rounded outlined
      bg-color="white" color="secondary" use-input hide-dropdown-icon input-debounce="400" :label="$t('Select location')"
      option-label="name" option-value="name" :options="options" @filter="filterFn" @update:model-value="setModel">
      <template v-slot:append>
        <q-icon name="search" color="secondary" />
      </template>
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">
            {{ $t("No results") }}
          </q-item-section>
        </q-item>
      </template>
    </q-select>
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
import { useQuasar } from "quasar";
import { $bus } from "boot/bus.js";
import { i18n } from "boot/i18n.js";
import _difference from "lodash/difference";

import { Map, View } from "ol";
import proj4 from "proj4";
import { register, fromEPSGCode } from "ol/proj/proj4";
import { transformExtent } from "ol/proj";

import { transformProjection } from "src/utils/openLayers.js";
import {
  Vector as VectorLayer,
  VectorImage as VectorImageLayer,
} from "ol/layer";

import { useMapStore } from "stores/map";
import { getAllLocation, getLocation } from "src/api/location";
export default defineComponent({
  name: "FloatSearch",
  setup() {
    const $q = useQuasar();
    const $t = i18n.global.t;
    const map = inject("map", {});
    const mapStore = useMapStore();
    const projections = computed(() => mapStore.getProjections);
    const locationSearchRef = ref(null);
    const searchLocation = ref("");
    const options = ref([]);
    const defaultOptions = ref([]);
    const filterFn = (val, update, abort) => {
      if (val.length < 2) {
        // abort();
        update(async () => {
          options.value = unref(defaultOptions);
        });
      } else {
        update(async () => {
          const query = {
            search: val,
          };
          const response = await getAllLocation(query);
          options.value = response.data;
        });
      }
    };
    const location = ref(null);
    const onClearSearch = () => { };
    const setModel = async (val) => {
      if (val) {
        location.value = await getLocation({ id: val.id });
        mapStore.setLocation({
          location: unref(location),
          resolve: setView,
        });
      }
      unref(locationSearchRef).blur();
    };
    const setView =  async () => {
      if (unref(location).view) {
        const { longitude, latitude, extent, zoom, maxZoom } =
          unref(location).view;
        if (unref(location).view.projection) {
          const { name: projectionName, definition: projectionDef } =
            unref(location).view.projection;
          if (!unref(projections).hasOwnProperty(projectionName)) {
            await fromEPSGCode(projectionName)
            mapStore.setProjection({
              projection: {
                [projectionName]: projectionDef,
              }
            });
          }
          const center = await transformProjection({
            to: projectionName,
            definition: projectionDef,
            coordinates: [longitude, latitude],
          });
          const newExtent = transformExtent(JSON.parse(extent), 'EPSG:4326', projectionName)
          const newView = new View({
            projection: projectionName,
            center,
            extent: JSON.parse(extent),
            zoom,
            maxZoom,
          });
          mapRemoveLayer(newView);
          unref(map).setView(newView);
        }
      }
    };

    const backToWorldMap = () => {
      const newView = new View({
        zoom: 0,
        center: [0, 0],
      });
      mapRemoveLayer(newView);
      unref(map).setView(newView);
      mapStore.setLocation({
        location: {},
      });
      $bus.emit("on-update-geolocation");
      $bus.emit("on-delete-draw");
      $bus.emit("remove-all-files");
    }
    const mapRemoveLayer = (newView) => {
      const oldProjection = unref(map).getView().getProjection();
      unref(map)
        .getLayers()
        .getArray()
        .forEach((layer) => {
          if (layer instanceof VectorLayer) {
            layer
              .getSource()
              .getFeatures()
              .forEach(function (feature) {
                const geometry = feature.getGeometry();
                geometry.transform(oldProjection, newView.getProjection());
              });
          } else if (layer instanceof VectorImageLayer) {
            unref(map).removeLayer(layer);
          }
        });
    }
    onMounted(() => {
      const query = {
        page: 1,
        per_page: 10,
      };
      getAllLocation(query).then((response) => {
        defaultOptions.value = response.data;
      });
    });
    onUnmounted(() => {
      mapStore.setLocation({
        location: {},
      });
    });
    return {
      map,
      locationSearchRef,
      searchLocation,
      options,
      filterFn,
      setModel,
      backToWorldMap,
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

.stickyClass {
  z-index: 1;
}

.panelClass {
  max-height: 200px;
  padding: 10px 20px;
  display: grid;
}

.closeClass {
  cursor: pointer;
}

.searchClass {
  width: 400px;
  color: teal;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  border-radius: 28px;

  &:focus {
    color: teal;
  }
}

// .q-field__native .q-placeholder {
//   color: black;

//   &:focus {
//     color: black;
//   }
// }
</style>
