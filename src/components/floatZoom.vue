<template>
  <div style="display: flex; flex-direction: row; gap: 10px; max-height: 56px;">
    <q-btn-group
      outline
      color="white"
      style="flex-direction: column; gap: 2px"
    >
      <q-btn
        color="secondary"
        text-color="white"
        round
        icon="add"
        size="sm"
        class="circle shadow-3"
        @click="zoom('in')"
      >
        <q-tooltip anchor="center right" self="center start">{{
          $t("Zoom in")
        }}</q-tooltip>
      </q-btn>
      <q-space />
      <q-btn
        color="secondary"
        text-color="white"
        round
        icon="remove"
        size="sm"
        class="circle shadow-3"
        @click="zoom('out')"
      >
        <q-tooltip anchor="center right" self="center start">{{
          $t("Zoom out")
        }}</q-tooltip>
      </q-btn>
    </q-btn-group>
    <div style="align-items: center; display: flex">
      <q-fab
        square
        color="secondary"
        icon="layers"
        active-icon="layers"
        direction="down"
        style="width: 56px; height: 56px"
        padding="0"
      >
        <q-fab-action
          v-for="(group, index) of layerGroups"
          :key="index"
          square
          color="white"
          text-color="black"
          :icon="group.icon"
          @click="setTile(group.type)"
        >
        <q-tooltip>{{ group.tooltip }}</q-tooltip>
      </q-fab-action>
      </q-fab>
    </div>
  </div>
</template>

<script>
import {
  ref,
  unref,
  onMounted,
  defineComponent,
  getCurrentInstance,
  computed,
  inject,
} from "vue";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
import { OSM, ImageWMS, XYZ } from "ol/source";
import { Tile as TileLayer, Image, Vector as VectorLayer, Group } from "ol/layer";

export default defineComponent({
  name: "FloatZoom",
  components: {},
  setup() {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const map = inject("map", {});
    const zoom = (direction) => {
      unref(map)
        .getView()
        .animate({
          zoom:
            unref(map).getView().getZoom() + (direction === "in" ? 0.5 : -0.5),
          duration: 250,
        });
    };
    const layerGroups = ref([
      {
        icon: "img:icons/Maps-Street.png",
        type: "groupOSM",
        tooltip: $t("Street map"),
      },
      {
        icon: "img:icons/Maps-Satellite.png",
        type: "groupImagery",
        tooltip: $t("Imagery map"),
      },
    ])
    const wmsSource = new ImageWMS({
      url: `${process.env.GEO_SERVER_URL}/ne/wms`,
      params: {
        LAYERS: "ne:world",
        FORMAT: "image/png", // Specify the desired image format
      },
      serverType: "geoserver",
    });
    const worldImagery = new TileLayer({
      source: new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        crossOrigin: 'Anonymous',
        maxZoom: 19,
      }),
    });
    // Create a new Image layer
    const imageLayer = new Image({
      source: wmsSource,
    });
    
    const groupOSM = (list) => new Group({
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        ...list,
      ],
    });

    const groupImagery = (list) => new Group({
      layers: [
        worldImagery,
        ...list,
      ],
    });

    const setTile = (type) => {
      const list = unref(map)?.getLayers()?.getArray?.()?.slice?.(1) || []
      switch (type) {
        case "groupOSM":
          unref(map).setLayerGroup(groupOSM(list))
          break;
        case "groupImagery":
          unref(map).setLayerGroup(groupImagery(list))
        default:
          break;
      }
    };
    return {
      vm,
      zoom,
      layerGroups,
      setTile,
    };
  },
});
</script>
<style lang="scss">
html,
body {
  width: 100%;
  height: 100%;
}

.sticky {
  z-index: 1;
}

.circle {
  border-radius: 50% !important;
}
</style>
