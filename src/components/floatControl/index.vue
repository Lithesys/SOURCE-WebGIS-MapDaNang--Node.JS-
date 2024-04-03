<template>
  <div>
    <q-card class="my-card" flat bordered style="">
      <q-tabs v-model="tabModel" class="bg-secondary text-white" style="min-height: 56px;">
        <q-tab v-for="(tab, index) of tabList" 
          :key="index"
          :label="tab.label"
          :name="tab.component"
          @click="() => {
            expanded = true;
          }
          " />
        <q-btn flat dense :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'" style="height: 100%"
          @click="expanded = !expanded" />
      </q-tabs>
      <q-separator />
      <q-slide-transition>
        <div v-show="expanded">
          <q-tab-panels v-model="tabModel" animated :keep-alive="true" class="shadow-10 rounded-borders">
            <q-tab-panel
              v-for="(tab, index) of tabList"
              :key="index"
              :name="tab.component"
              class="panelClass"
            >
              <component :is="tab.component" v-bind="tab.props" />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-slide-transition>
    </q-card>
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
} from "vue";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
import TabAction from 'src/components/floatControl/tabAction.vue';
import TabLocation from 'src/components/floatControl/TabLocation.vue';
import TabUpload from 'src/components/floatControl/TabUpload.vue';

export default defineComponent({
  name: "FloatControl",
  components: {
    "tab-action": TabAction,
    "tab-location": TabLocation,
    "tab-upload": TabUpload,
  },
  props: {
    map: {
      type: Object,
      default: () => ({}),
    },
    view: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["closePopup"],
  setup(props, { emit }) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;

    const tabModel = ref('tab-action');
    const expanded = ref(false);
    const tabList = computed(() => [
      {
        label: $t('Tools'),
        component: 'tab-action',
        props: {
          tab: tabModel,
        },
      },
      {
        label: $t('Upload'),
        component: 'tab-upload',
        props: {
          tab: tabModel,
        },
      },
      {
        label: $t('Location'),
        component: 'tab-location',
        props: {
          tab: tabModel,
        },
      },
    ])

    return {
      vm, 
      tabModel,
      expanded,
      tabList,
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

.stickyClass {
  z-index: 1;
}

.panelClass {
  padding: 0; 
  display: grid;
}
</style>
