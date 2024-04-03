<template>
  <q-card class="bg-secondary shadow-2 popupCardClass">
    <q-card-section style="padding-bottom: 0; margin: 0">
      <div class="text-h6 text-white">{{$t("Add feature")}}</div>
    </q-card-section>
    <q-card-section>
      <q-select class="searchClass" ref="locationSearchRef" v-model="locationSearch" outlined bg-color="white"
        color="secondary" use-input hide-dropdown-icon input-debounce="400" :label="$t('Select location')" option-label="name"
        option-value="name" :options="LocationOptions" @filter="filterFn" @update:model-value="locationSetModel">
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
    </q-card-section>
    <q-card-section class="bg-white" horizontal>
      <q-card-section style="width: 100%; max-height: 65vh">
        <q-input :label="$t('Search for layer')" debounce="300" class="bg-white" color="black" v-model="layerFilter"
          @update:model-value="fetchLayers()">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
          <!-- <template v-slot:after>
            <q-btn round dense flat icon="add">
              <q-tooltip>{{ $t("Create new layer") }}</q-tooltip>
            </q-btn>
          </template> -->
        </q-input>
        <q-scroll-area class="layerClass" v-bind="SCROLL_STYLE.SECONDARY" id="scroll-area-with-virtual-scroll-1">
          <q-virtual-scroll :items="dataLayers" separator v-slot="{ item, index }" @virtual-scroll="onScroll"
            scroll-target="#scroll-area-with-virtual-scroll-1 > .scroll">
            <q-item :key="item.id + index">
              <q-item-section avatar>
                <q-radio v-model="layerRadio" :val="item" color="secondary" @update:model-value="(val) => {
                  layerRadio = val;
                  fetchFeatures();
                }
                  " />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  <span v-html="item.name"></span>
                </q-item-label>
                <q-item-label caption>
                  {{ item.description }}
                </q-item-label>
              </q-item-section>
              <q-separator />
            </q-item>
          </q-virtual-scroll>
        </q-scroll-area>
      </q-card-section>
      <q-separator v-if="layerRadio" vertical />
      <q-card-section v-if="layerRadio" style="padding: 0 0 0 0">
        <q-table flat bordered wrap-cells hide-pagination row-key="name" class="tableClass" :title="$t('Feature')"
          :rows="featureRows" :columns="featureColumns" :virtual-scroll-sticky-size-start="48"
          v-model:pagination="featurePagination" @update:selected="fetchFeatures">
          <template v-slot:top>
            <div class="text-h6">{{ $t("Features") }}</div>
            <q-input :label="$t('Search for feature')" debounce="300" class="bg-white" color="black"
              v-model="featureFilter" @update:model-value="fetchFeatures()">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="id" :props="props">
                {{ props.row.id }}
              </q-td>
              <q-td key="name" :props="props">
                {{ props.row.name }}
              </q-td>
            </q-tr>
            <q-tr v-show="props.expand" :props="props"> </q-tr>
          </template>
        </q-table>
        <q-pagination input style="place-content: center" v-model="featurePagination.page"
          @update:model-value="fetchFeatures" :max="featurePagination.rowsNumber" boundary-numbers direction-links flat
          color="grey" active-color="primary" />
      </q-card-section>
    </q-card-section>
    <q-separator />
    <q-card-section class="row items-start justify-center q-gutter-sm">
      <q-btn :disable="!layerRadio?.id" :label="$t('Save')" class="bg-secondary text-white" @click="onSave" />
      <q-btn v-close-popup :label="$t('Cancel')" class="bg-secondary text-white" />
    </q-card-section>
  </q-card>
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
  createApp,
  h,
  inject,
  watch,
} from "vue";
import _isEqual from "lodash/isEqual";
import _debounce from "lodash/debounce";
import _isEmpty from "lodash/isEmpty";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
import { useUserStore } from "src/stores/user";
import { useMapStore } from "stores/map";
import { getAllLocation, getLocation } from "src/api/location";
import { getLayerByLocation } from "src/api/mapLayer";
import { getFeaturesByLayer } from "src/api/feature";
import { createFeature, updateFeature } from "src/api/feature";
import { SCROLL_STYLE } from "src/constants/virtual-scroll.js";
import { addXML } from "src/utils/transactionXML";

export default defineComponent({
  name: "detailPopupSave",
  props: {
    content: Object,
  },
  setup(props, { emit }) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const mapStore = useMapStore();
    const userStore = useUserStore();
    const { role } = userStore.getUser;
    const locationSearchRef = ref(null);
    const locationSearch = ref(
      _isEmpty(mapStore.getLocation) ? "" : mapStore.getLocation.name
    );
    const LocationOptions = ref([]);
    const defaultOptions = ref([]);
    const filterFn = (val, update, abort) => {
      if (val.length < 2) {
        update(async () => {
          LocationOptions.value = unref(defaultOptions);
        });
      } else {
        update(async () => {
          const query = {
            search: val,
          };
          const response = await getAllLocation(query);
          LocationOptions.value = response.data;
        });
      }
    };
    const location = ref(
      _isEmpty(mapStore.getLocation) ? null : mapStore.getLocation
    );
    const onClearSearch = () => { };
    const locationSetModel = async (val) => {
      if (val) {
        location.value = await getLocation({ id: val.id });
        dataLayers.value = unref(location)?.mapLayers || [];
        layerRadio.value = null;
      }
      unref(locationSearchRef).blur();
    };

    const dataLayers = ref(
      _isEmpty(mapStore.getLocation) ? [] : mapStore.getLocation.mapLayers
    );
    const layerRadio = ref(null);
    const fetchLayers = async (val = 1) => {
      const response = await getLayerByLocation({
        locationId: unref(location).id,
        per_page: unref(layerPagination).rowsPerPage,
        page: val,
        search: unref(layerFilter),
      });
      if (response) {
        dataLayers.value = response.data;
        layerPagination.value.rowsNumber = parseInt(
          Math.ceil(response.count / response.per_page)
        );
        layerPagination.value.page = response.page;
        layerPagination.value.rowsPerPage = response.per_page;
      }
    };

    const fetchFeatures = _debounce(async (val = 1) => {
      const response = await getFeaturesByLayer({
        layerId: unref(layerRadio).id,
        per_page: unref(featurePagination).rowsPerPage,
        page: val,
        search: unref(featureFilter),
      });
      if (response) {
        featureRows.value = response.data;
        featurePagination.value.rowsNumber = parseInt(
          Math.ceil(response.count / response.per_page)
        );
        featurePagination.value.page = response.page;
        featurePagination.value.rowsPerPage = response.per_page;
      }
    }, 10);
    onMounted(() => {
      const query = {};
      getAllLocation(query).then((response) => {
        defaultOptions.value = response.data;
        LocationOptions.value = response.data;
      });
    });
    // table
    const featureFilter = ref("");
    const layerFilter = ref("");
    const featureColumns = computed(() => [
      {
        required: true,
        name: "id",
        label: "Id",
        field: "id",
        align: "center",
        style: "min-width: 90px; width: 90px;",
      },
      {
        name: "name",
        align: "center",
        label: $t("Feature name"),
        field: "name",
      },
      { name: "action", align: "center", label: "" },
    ]);
    const featureRows = ref([]);
    const layerPagination = ref({
      page: 1,
      rowsPerPage: 20,
      rowsNumber: 21,
      count: 21,
    });
    const featurePagination = ref({
      page: 1,
      rowsPerPage: 20,
      rowsNumber: 0,
    });
    const setPagination = (val) => {
      console.log(val);
    };
    const scrollable = ref(true);
    const onScroll = _debounce(async (detail) => {
      const layersLength = unref(dataLayers).length;
      if (
        detail.direction === "increase" &&
        detail.index >= layersLength - 5 &&
        layersLength < layerPagination.value.rowsNumber &&
        (detail.to + 1) % layersLength === 0
      ) {
        layerPagination.value.page = unref(layerPagination).page + 1;
        const response = await getLayerByLocation({
          locationId: unref(location).id,
          per_page: unref(layerPagination).rowsPerPage,
          page: unref(layerPagination).page,
          search: unref(layerFilter),
        });
        if (response) {
          dataLayers.value.push(...response.data);
          layerPagination.value.rowsNumber = parseInt(
            Math.ceil(response.count / response.per_page)
          );
          layerPagination.value.rowsPerPage = response.per_page;
        }
      }
    }, 300);

    // table
    const onSave = async () => {
      // const feature = {
      //   properties: JSON.stringify(props.content || null),
      // };
      const feature = mapStore.getSelectedFeature.feature
      const workspace = unref(LocationOptions).find((e) => e.name === unref(locationSearch)).workspace
      const layerName = unref(layerRadio).url.replace(`${workspace}:`,'')
      const resolve = () => {
        layer?.getSource().updateParams()
      }
      await addXML({ feature, workspace, layer: layerName, resolve })
      // const response = await createFeature({
      //   features: [feature],
      //   layerId: unref(layerRadio).id,
      // });
    };
    return {
      vm,
      role,
      //location
      locationSearchRef,
      locationSearch,
      LocationOptions,
      filterFn,
      locationSetModel,
      //location
      //layer
      dataLayers,
      layerRadio,
      fetchLayers,
      onScroll,
      layerFilter,
      layerPagination,
      //layer
      //table
      fetchFeatures,
      featureFilter,
      featureColumns,
      featureRows,
      featurePagination,
      setPagination,
      //table
      onSave,
      SCROLL_STYLE,
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

.adminClass {
  display: flex;
  justify-self: right;
}

.popupCardClass {
  min-width: 50vh;
  max-width: fit-content;
}

.tableClass {
  max-height: 406px;
}

.captionClass {
  font-weight: 600;
}

.layerClass {
  border-top-left-radius: 1px;
  border-top-right-radius: 1px;
  height: 390px;
  max-height: 390px;
  max-width: 400px;

  // .q-scrollarea__content.absolute {  }
}

::-webkit-scrollbar {
  border-radius: 5px;
  height: 12px;
  width: 14px;
  background: rgba(0, 128, 128, 0.25);
  z-index: 12;
  overflow: visible;
  cursor: pointer !important;
}

::-webkit-scrollbar-thumb {
  width: 10px;
  background-color: $secondary;
  border-radius: 10px;
  z-index: 12;
  border: 4px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
  transition: background-color 0.32s ease-in-out;
  margin: 4px;
  min-height: 32px;
  min-width: 32px;
  cursor: pointer !important;
}

::-webkit-scrollbar-thumb:hover {
  background: $secondary;
  cursor: pointer !important;
}

.q-card__section .q-card__section--vert {
  padding: 0;
}
</style>
