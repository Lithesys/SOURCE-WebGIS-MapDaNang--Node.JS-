<template>
  <div>
    <q-input v-if="defaultOptions.length > 0" debounce="300" class="searchClass" :label="$t('Search layer')"
      v-model="searchLayer" @update:model-value="onSearch" />
    <q-checkbox v-if="dataLayers.length > 0" v-model="layerCheckAll" :val="true" color="secondary" :label="$t('Select All')"
      @update:model-value="selectAll" />
    <q-list overlay>
      <q-scroll-area class="layerClass" v-bind="SCROLL_STYLE.SECONDARY" id="scroll-area-with-virtual-scroll-1">
        <q-virtual-scroll :items="dataLayers" separator v-slot="{ item, index }" @virtual-scroll="onScroll"
          scroll-target="#scroll-area-with-virtual-scroll-1 > .scroll">
          <q-expansion-item :key="item.id + index" expand-icon-toggle expand-separator @before-show="beforeShow(item.id)">
            <template v-slot:header>
              <q-item-section avatar>
                <q-checkbox v-model="layerCheckbox" :val="item" color="secondary" />
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
            </template>
            <q-card style="margin:0 10px">
              <div ref="imageRef"><img :id="`legend_${item.id}`" /></div>
              <q-select v-model="item.propertiesCQL" :options="item.listPropertiesCQL" clearable  :label="$t('Properties filter')" color="secondary"/>
              <q-select v-model="item.operator" :options="CQL_OPERATORS" clearable :label="$t('Select operator')" option-label="name" option-value="function" color="secondary"/>
              <q-input  v-model="item.search" clearable bottom-slots :label="$t('Feature filter')" color="secondary" @clear="searchCQL(index)">
                <template v-slot:after>
                  <q-btn round dense flat icon="search" @click="searchCQL(index)"/>
                </template>
              </q-input>
            </q-card>
          </q-expansion-item>
          <!-- </q-scroll-area> -->
        </q-virtual-scroll>
      </q-scroll-area>
    </q-list>
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
import { useRoute, useRouter } from "vue-router";
import { i18n } from "boot/i18n.js";
import { useMapStore } from "stores/map";

import { Map, View } from "ol";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { ImageWMS } from "ol/source";
import { Image } from "ol/layer";
import _difference from "lodash/difference";
import _debounce from "lodash/debounce";
import _isEmpty from "lodash/isEmpty";
import _isFunction from "lodash/isFunction";
import { MAP_LAYERS, CQL_OPERATORS } from "src/constants/layer.js";
import { SCROLL_STYLE } from "src/constants/virtual-scroll.js";
import {
  actionAddLayerGeoJSON,
  actionAddLayerWMS,
} from "src/utils/openLayers.js";
import { $bus } from "boot/bus.js";
import { getLayerByLocation } from "src/api/mapLayer";
export default defineComponent({
  name: "TabLocation",
  components: {},
  setup() {
    const vm = getCurrentInstance().proxy;
    const $t = i18n.global.t;
    const mapStore = useMapStore();
    const map = inject("map", {});
    const searchLayer = ref('');
    const layerPagination = ref({
      page: 1,
      rowsPerPage: 20,
      rowsNumber: 21,
      count: 21,
    })
    const onSearch = async (val) => {
      if (!val) {
        dataLayers.value = unref(defaultOptions)
        layerPagination.value = {
          page: 1,
          rowsPerPage: 20,
          rowsNumber: 21,
          count: 21,
        }
        return
      }
      const _val = val.toLowerCase()
      const _tempData = unref(defaultOptions).filter(
        (opt) => opt.name.toLowerCase().includes(_val))
      if (_tempData.length) {
        dataLayers.value = _tempData
      } else {
        const response = await getLayerByLocation({
          locationId: unref(location).id,
          per_page: unref(layerPagination).rowsPerPage,
          page: 1,
          search: unref(searchLayer),
        })
        if (response) {
          dataLayers.value = response.data;
          layerPagination.value.rowsNumber = 21;
          layerPagination.value.page = 1;
          layerPagination.value.rowsPerPage = response.per_page;
        }
      }
    }
    const onScroll = _debounce(
      async (detail) => {
        const layersLength = unref(dataLayers).length
        if (
          detail.direction === 'increase' &&
          detail.index >= layersLength - 5 &&
          layersLength < layerPagination.value.rowsNumber &&
          (detail.to + 1) % layersLength === 0
        ) {
          layerPagination.value.page = unref(layerPagination).page + 1
          const response = await getLayerByLocation({
            locationId: unref(location).id,
            per_page: unref(layerPagination).rowsPerPage,
            page: unref(layerPagination).page,
            search: unref(searchLayer),
          })
          if (response) {
            dataLayers.value.push(...response.data);
            layerPagination.value.rowsNumber = parseInt(Math.ceil(response.count / response.per_page));
            layerPagination.value.rowsPerPage = response.per_page;
          }
        }
      }
      , 300)
    const defaultOptions = ref([]);
    const location = computed(() => mapStore.getLocation);
    const dataLayers = ref([]);
    const layerCheckbox = ref([]);
    const layerCheckAll = ref([]);
    const selectAll = (value, event) => {
      if (value[0]) {
        layerCheckbox.value = unref(dataLayers);
      } else {
        layerCheckbox.value = [];
      }
    };
    const onClearSearch = () => {
      dataLayers.value = [];
      layerCheckbox.value = [];
      layerCheckAll.value = [];
    };
    const setModel = async (val) => {
      if (val) {
        onClearSearch();
        dataLayers.value = unref(location)?.mapLayers || [];
        defaultOptions.value = unref(dataLayers)
      } else {
      }
    };
    const actionFocusLayer = (vectorLayer) => {
      const extent = vectorLayer?.getSource?.()?.getExtent?.();
      unref(map)
        .getView()
        .fit(extent, {
          padding: [250, 250, 250, 250],
          duration: 1000,
        });
    };

    const updateCQL = (val, index) => {
      dataLayers.value[index].search = val
    }
    const searchCQL = (index) => {
      const a = unref(dataLayers)[index]
      if (_isFunction(a?.operator?.function) && a?.propertiesCQL && !(a.search === '' || a.search === null)) {
        a.vectorLayer.getSource().updateParams({
          "CQL_FILTER": a.operator.function(a.propertiesCQL, a.search)
        })
      } else {
        a.vectorLayer.getSource().updateParams({
          "CQL_FILTER": null,
        })
      } 
    }
    const beforeShow = (id) => {
      const currentLayer = unref(dataLayers).find((l) => l.id === id);
      if (_isEmpty(currentLayer.listPropertiesCQL))
        fetch(
          `${process.env.GEO_SERVER_URL}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=${currentLayer.url}&outputFormat=json&propertyName=*&count=1`
        ).then((response) => response.json()).then((response) => {
          const fetchColumn = response?.features?.[0]?.properties || {}
          currentLayer.listPropertiesCQL = Object.keys(fetchColumn)
        })
      const img = document.getElementById(`legend_${id}`);
      if (img) {
        img.src = `${process.env.GEO_SERVER_URL}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image%2Fpng&WIDTH=10&HEIGHT=10&LAYER=${currentLayer.url}`;
      }
    }

    onMounted(() => {
      if (!_isEmpty(unref(location))) {
        setModel(unref(location))
      }
      watch(
        () => layerCheckbox.value,
        (newVal, oldVal) => {
          if (newVal.length > oldVal.length) {
            const diff = _difference(newVal, oldVal);
            const { workspace } = unref(location);
            diff.forEach((layer) => {
              const currentLayer = unref(dataLayers).find(
                (l) => layer.id === l.id
              );
              currentLayer.vectorLayer = actionAddLayerWMS({
                layer,
                workspace,
                map,
              });
              // fetch(
              //   `${process.env.GEO_SERVER_URL}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=${layer.url}&outputFormat=json&propertyName=*&count=1`
              // ).then((response) => response.json()).then((response) => {
              //   const fetchColumn = response?.features?.[0]?.properties || {}
              //   currentLayer.listPropertiesCQL = Object.keys(fetchColumn)
              // })
            });
          } else {
            const diff = _difference(oldVal, newVal);
            const { workspace } = unref(location);
            diff.forEach((layer) => {
              if (layer.vectorLayer) {
                unref(map).removeLayer(layer.vectorLayer);
                $bus.emit("remove-layer",layer.url);
              }
            });
          }
        }
      );
      watch(
        () => location.value,
        (newVal, oldVal) => {
          setModel(newVal)
        }
      );
    });
    onUnmounted(() => {
    });
    return {
      map,
      location,
      searchLayer,
      layerPagination,
      onSearch,
      setModel,
      defaultOptions,
      dataLayers,
      layerCheckbox,
      layerCheckAll,
      selectAll,
      actionFocusLayer,
      onScroll,
      updateCQL,
      searchCQL,
      SCROLL_STYLE,
      CQL_OPERATORS: CQL_OPERATORS,
      beforeShow,
    };
  },
});
</script>
<style lang="scss" scoped>
.searchClass {}

.layerClass {
  border-top-left-radius: 1px;
  border-top-right-radius: 1px;
  min-height: 0;
  height: 100vh;
  max-height: 55vh;
  max-width: 300px;

  // .q-scrollarea__content.absolute {
  // }
}

::-webkit-scrollbar {
  height: 12px;
  width: 14px;
  background: transparent;
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
</style>
