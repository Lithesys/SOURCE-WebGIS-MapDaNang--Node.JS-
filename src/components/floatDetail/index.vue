<template>
  <q-page-sticky class="stickyClass" position="top-right" :offset="[10, 10]">
    <q-card class="my-card" flat bordered style="width: 400px">
      <q-carousel swipeable animated v-model="slideImage" control-color="secondary" navigation infinite
        ref="carousel" style="height: 200px">
        <q-carousel-slide :name="1" :img-src="image" />
        <template v-slot:control>
          <q-carousel-control position="top-left" class="text-white rounded-borders">
            <q-btn class="absolute shadow-2 closeClass" round color="white" text-color="black" icon="close" size="sm"
              @click="closeCard" />
          </q-carousel-control>
        </template>
      </q-carousel>
      <q-card-section>
        <q-btn fab color="primary" icon="place" class="absolute"
          style="top: 0; right: 12px; transform: translateY(-50%)" />

        <div class="row no-wrap items-center">
          <span class="col text-h6 ellipsis" v-html="title"></span>
          <div class="col-auto text-grey text-caption q-pt-md row no-wrap items-center">
            <q-icon name="place" />
            {{ distanceToMyLocation }}
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="coordinate" class="q-pt-none">
        <div class="text-subtitle1">
          <q-icon name="place" /> {{ coordinate }}
        </div>
      </q-card-section>
      <q-separator />
      <q-tabs v-model="detailTab" class="bg-secondary text-white">
        <q-tab v-for="(tab, index) of detailTabList" :key="index" :label="tab.label" :name="tab.component" @click="() => {
          tabExpanded = true;
        }
          " />
        <q-btn flat dense :icon="tabExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'" style="height: 100%"
          @click="tabExpanded = !tabExpanded" />
      </q-tabs>
      <q-separator />
      <q-slide-transition>
        <div v-show="tabExpanded">
          <q-tab-panels v-model="detailTab" animated :keep-alive="true" class="shadow-10 rounded-borders">
            <q-tab-panel name="tab-fields" class="panelClass">
                <detail-table :type="typeComputed" :id="id" :feature_type="feature_type" :content="content" @update:model-content="updateContent($event)" ></detail-table>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-slide-transition>
    </q-card>
  </q-page-sticky>
</template>

<script>
import {
  ref,
  unref,
  onMounted,
  defineComponent,
  getCurrentInstance,
  computed,
  createApp,
  h,
  inject,
} from "vue";
import html2canvas from "html2canvas";
import { QBtn } from "quasar";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
import { Map, View, Overlay } from "ol";
import { $bus } from "boot/bus.js";
import _isEqual from 'lodash/isEqual'
import { updateFeature } from "src/api/feature";

import DetailTable from 'src/components/floatDetail/detailTable.vue'
import { LAYER_TYPE, FEATURE_TYPE } from "src/constants/enum";
import { useMapStore } from "stores/map";
import { updateXML } from "src/utils/transactionXML";

export default defineComponent({
  name: "FloatDetail",
  components: {
    'detail-table': DetailTable,
  },
  props: {
    id: String,
    value: Boolean,
    title: String,
    content: Object,
    type: {
      type: String,
      default: LAYER_TYPE[0],
    },
    feature_type: {
      type: String,
      default: FEATURE_TYPE[0],
    },
    image: {
      type: String,
      default: "https://cdn.quasar.dev/img/chicken-salad.jpg",
    },
    distance: {
      type: Number,
      default: 0,
    },
    coordinate: {
      type: String,
      default: null,
    },
  },
  setup(props, { emit }) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const mapStore = useMapStore();
    const workspace = computed(() => mapStore.getLocation.workspace);
    const $t = i18n.global.t;
    const slideImage = ref(1);
    const styleImage = computed(() => ({
      backgroundImage: `url(${props.image})`,
      backgroundSize: "400px 200px",
      height: "200px",
    }));
    const map = inject("map", {});
    const detailTab = ref("tab-fields");
    const tabExpanded = ref(true);
    const detailTabList = computed(() => [
      {
        label: $t("Fields"),
        component: "tab-fields",
        content: props.content,
      },
    ]);
    const closeCard = () => {
      $bus.emit("close-float-detail", true);
      emit("update:model-value", false);
    };
    const distanceToMyLocation = computed(() => {
      return props.distance;
    });
    const updateContent = async (content) => {
      if (!_isEqual(content, props.content)) {
        let _tempContent = content
        // if (typeof _tempContent !== 'string') {
        //   _tempContent = JSON.stringify(content)
        // }
        if (props.id) {
          try {
            const feature = mapStore.getSelectedFeature.feature
            const layer = mapStore.getSelectedFeature.layer.get("id").replace(`${unref(workspace)}:`, '')
            feature.setProperties(_tempContent)
            updateXML({ workspace: unref(workspace), layer, feature })
            // const response = await updateFeature({
            //   id: props.id,
            //   feature: {
            //     properties: _tempContent,
            //   }
            // })
          } catch (e) {
            console.log(e)
          }
        }
        emit("update:model-content", content)
      }
    }

    return {
      vm,
      map,
      slideImage,
      styleImage,
      detailTab,
      detailTabList,
      tabExpanded,
      distanceToMyLocation,
      closeCard,
      updateContent,
      typeComputed: computed(() => props.type)
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
  max-height: 230px;
  max-width: 400px;
}

.closeClass {
  cursor: pointer;
}

::-webkit-scrollbar {
  height: 12px;
  width: 14px;
  background: transparent;
  z-index: 12;
  overflow: visible;
  cursor: auto !important;
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
  cursor: auto !important;
}

::-webkit-scrollbar-thumb:hover {
  background: $secondary;
  cursor: auto !important;
}

.my-card {
  .q-carousel__navigation-inner{
    display: none !important;
  }
}
  
</style>
