<template>
  <div class="q-pa-md">
    <q-table class="tableLayerClass" v-bind="{ ...tableProps, cardClass: 'bg-primary text-white' }" virtual-scroll
      style="max-height: 800px" :virtual-scroll-sticky-size-start="48" :columns="layerColumns"
      :rows="propsLocation.mapLayers" v-model:pagination="layerPagination">
      <!-- layer header -->
      <template v-slot:top>
        <div class="text-h6 text-white">{{ $t("Layers") }}</div>
        <!-- <q-btn class="bg-white text-primary" rounded icon="add" style="margin-left: 10px">
          <q-tooltip anchor="center right" self="center start">{{
            $t("Add layer")
          }}</q-tooltip>
          <popupLayer v-model:row="newLayer" :layer-rows="propsLocation?.mapLayers" :location="propsLocation" />
        </q-btn> -->
        <q-space />
        <q-input :label="$t('Search for layer')" debounce="300" class="bg-white" color="black" v-model="layerFilter" @update:model-value="getLayerRows">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:body="propsLayer">
        <q-tr :props="propsLayer">
          <q-td v-for="_key of ['id', 'name', 'description']" :key="_key" :props="propsLayer">
            {{ propsLayer.row[_key] }}
          </q-td>
          <q-td key="type" :props="propsLayer">
            <q-badge :class="`bg-white text-${propsLayer.row.type === LAYER_TYPE[0] ? 'green' : ' orange'}`">
              {{ propsLayer.row.type }}
            </q-badge>
          </q-td>
          <q-td key="url" :props="propsLayer" auto-width>
            <q-btn push color="white" text-color="primary" icon="link">
              <q-popup-proxy style="width: 500px; word-wrap: break-word" :ref="`popupRef${propsLayer.row.id}`"
                @show="showPopup(`popupRef${propsLayer.row.id}`)" @hide="showPopup(null)">
                <q-banner>
                  {{
                    geoServerUrl({
                      url: propsLayer.row.url,
                      workspace: propsLocation.workspace,
                    })
                  }}
                </q-banner>
              </q-popup-proxy>
            </q-btn>
          </q-td>
          <q-td key="feature" :props="propsLayer">
            <q-btn size="sm" class="bg-white text-primary" round dense @click="propsLayer.expand = !propsLayer.expand"
              :icon="propsLayer.expand ? 'expand_less' : 'expand_more'" />
          </q-td>
          <q-td key="action" :props="propsLayer">
            <q-btn v-bind="{
              ...actionButtonProps,
              color: 'white',
              textColor: 'primary',
              icon: 'edit',
            }" style="margin-right: 10px">
              <!-- popup layer edit -->
              <popupLayer v-model:row="propsLayer.row" :layer-rows="propsLocation?.mapLayers" />
            </q-btn>
            <q-btn v-bind="{
              ...actionButtonProps,
              color: 'white',
              textColor: 'red',
              icon: 'delete',
            }" @click="onDeleteLayer(propsLayer.row)">
            </q-btn>
          </q-td>
        </q-tr>
        <q-tr v-show="propsLayer.expand" :props="propsLayer">
          <q-td colspan="100%" v-if="propsLayer.expand">
            <!-- feature table -->
            <TableFeature :props-layer="propsLayer.row" />
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <!-- layer pagination -->
    <q-pagination input style="place-content: center" v-model="layerPagination.page" @update:model-value="getLayerRows"
      :max="layerPagination.rowsNumber" boundary-numbers direction-links flat color="grey" active-color="primary" />
  </div>
</template>

<script>
import {
  defineComponent,
  ref,
  unref,
  getCurrentInstance,
  onMounted,
  computed,
} from "vue";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
import { LAYER_TYPE } from "src/constants/enum";
import { getLayerByLocation, deleteMapLayer } from "src/api/mapLayer";
import { getFeaturesByLayer } from "src/api/feature";
import { getAllProjection } from "src/api/projection";
import PopupLayer from "src/pages/LocationManagementPage/components/popupLayer.vue";
import TableFeature from "src/pages/LocationManagementPage/components/tableFeature.vue";

export default defineComponent({
  name: "LocationManagementPage",
  components: {
    PopupLayer,
    TableFeature,
  },
  props: {
    propsLocation: Object,
  },
  setup(props) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const actionButtonProps = {
      size: "sm",
      color: "primary",
      round: true,
      dense: true,
    };
    const tableProps = {
      flat: true,
      bordered: true,
      "wrap-cells": true,
      "hide-pagination": true,
      "row-key": "name",
    };
    const layerFilter = ref("");
    const layerColumns = computed(() => [
      {
        name: "id",
        required: true,
        label: "Id",
        align: "left",
        field: (row) => row.id,
        format: (val) => `${val}`,
      },
      {
        name: "name",
        align: "center",
        label: $t("Name"),
        field: "name",
        sortable: true,
      },
      {
        name: "description",
        align: "center",
        label: $t("Description"),
        field: "description",
        sortable: true,
      },
      {
        name: "type",
        align: "center",
        label: $t("Layer type"),
        field: "type",
        sortable: true,
      },
      {
        name: "url",
        align: "center",
        style: "min-width: 160px; width: 160px",
        label: $t("Url"),
        field: "url",
      },
      {
        name: "feature",
        align: "center",
        label: $t("Features"),
      },
      {
        name: "action",
        align: "center",
        label: $t("Action"),
      },
    ]);
    const layerPagination = ref({
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0,
    });
    const getLayerRows = async () => {
      const response = await getLayerByLocation({
        locationId: props.propsLocation.id,
        per_page: unref(layerPagination).rowsPerPage,
        page: unref(layerPagination).page,
        search: unref(layerFilter),
      });
      if (response) {
        layerPagination.value.rowsNumber = parseInt(
          Math.ceil(response.count / response.per_page)
        );
        layerPagination.value.page = response.page;
        layerPagination.value.rowsPerPage = response.per_page;
        Object.assign(props.propsLocation, { ...props.propsLocation, mapLayers: response.data });
      }
    };
    const geoServerUrl = ({ url, workspace }) => {
      return `${process.env.GEO_SERVER_URL}/${workspace}/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=${url}&maxFeatures=52000&outputFormat=application%2Fjson`;
    };
    const onDeleteLayer = async (row) => {
      const resolve = () => {
        const index = props?.propsLocation?.mapLayers?.findIndex((f) => f.id === row.id)
        const _tempLayers = props?.propsLocation?.mapLayers || []
        _tempLayers.splice(index, 1)
        Object.assign(props.propsLocation, { ...props.propsLocation, mapLayers: _tempLayers });
      }
      await deleteMapLayer(row, resolve)
    };
    const scrollTable = ref(null);
    const currentPopupRef = ref(null);
    const showPopup = (ref) => {
      currentPopupRef.value = ref;
      if (unref(scrollTable)) {
        scrollTable.value.removeEventListener("scroll", () => {
          if (unref(currentPopupRef)) vm.$refs[unref(currentPopupRef)].hide();
        });
      }
      scrollTable.value = document.querySelector(
        "div.q-table__middle.q-virtual-scroll"
      );
      scrollTable.value.addEventListener("scroll", () => {
        if (unref(currentPopupRef)) vm.$refs[unref(currentPopupRef)].hide();
      });
    };

    const newLayer = ref({
      name: null,
      description: null,
      type: null,
      url: null,
      locationId: null,
    });

    onMounted(async () => {
      await getLayerRows()
    })

    return {
      tableProps,
      actionButtonProps,
      layerFilter,
      layerColumns,
      getLayerRows,
      layerPagination,
      geoServerUrl,
      newLayer,
      onDeleteLayer,
      currentPopupRef,
      showPopup,
      LAYER_TYPE: LAYER_TYPE,
    };
  },
});
</script>
<style lang="scss" scoped>
.tableLayerClass {
  ::-webkit-scrollbar {
    height: 12px;
    width: 14px;
    background: rgba(255, 255, 255, 0.25);
    z-index: 12;
    overflow: visible;
  }

  ::-webkit-scrollbar-thumb {
    width: 10px;
    background-color: white;
    border-radius: 10px;
    z-index: 12;
    border: 4px solid rgba(0, 0, 0, 0);
    background-clip: padding-box;
    transition: background-color 0.32s ease-in-out;
    margin: 4px;
    min-height: 32px;
    min-width: 32px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: white;
  }
}

.tableFeatureClass {
  ::-webkit-scrollbar {
    height: 12px;
    width: 14px;
    background: rgb(25, 118, 210, 0.25);

    z-index: 12;
    overflow: visible;
  }

  ::-webkit-scrollbar-thumb {
    width: 10px;
    background-color: $primary;
    border-radius: 10px;
    z-index: 12;
    border: 4px solid rgba(0, 0, 0, 0);
    background-clip: padding-box;
    transition: background-color 0.32s ease-in-out;
    margin: 4px;
    min-height: 32px;
    min-width: 32px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: $primary;
  }
}

.deleteWarningClass {
  .q-card__section.q-card__section--vert.q-dialog__title {
    color: orange !important;

    &::before {
      content: "\26A0" !important;
    }
  }
}

.popupEdit {
  color: #1976d2;
  width: 50%;
  right: 200px;
  left: 25% !important;
}
</style>
