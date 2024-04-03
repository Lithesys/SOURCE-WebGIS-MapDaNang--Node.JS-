<template>
  <q-table class="tableFeatureClass" v-bind="tableProps" virtual-scroll hide-pagination style="max-height: 500px"
    :virtual-scroll-sticky-size-start="48" :columns="featureColumns" :rows="propsLayer.features"
    v-model:pagination="featurePagination">
    <template v-slot:top>
      <div class="text-h6">{{ $t("Features") }}</div>
      <!-- <q-btn class="bg-primary text-white" rounded icon="add" style="margin-left: 10px">
        <q-tooltip anchor="center right" self="center start">{{
          $t("Add feature")
        }}</q-tooltip>
        <popupFeature v-model:row="newFeature" :feature-rows="propsLayer.features" :layer="propsLayer" />
      </q-btn> -->
      <q-space />
      <q-input :label="$t('Search for feature')" debounce="300" class="bg-white" color="black" v-model="featureFilter" @update:model-value="getFeatureRows">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>
    <template v-slot:body="propsFeature">
      <q-tr :props="propsFeature">
        <q-td v-for="_key of ['id', 'name']" :key="_key" :props="propsFeature">
          {{ propsFeature.row[_key] }}
        </q-td>
        <q-td key="properties" :props="propsFeature">
          {{ propsFeature.row.properties }}
        </q-td>
        <q-td key="action" :props="propsFeature">
          <q-btn v-bind="actionButtonProps" icon="edit" style="margin-right: 10px">
            <!-- popup feature edit -->
            <popupFeature v-model:row="propsFeature.row" :feature-rows="propsLayer.features" />
          </q-btn>
          <q-btn v-bind="{ ...actionButtonProps, color: 'red' }" icon="delete" @click="onDeleteFeature(propsFeature.row)">
          </q-btn>
        </q-td>
      </q-tr>
    </template>
  </q-table>
  <!-- feature pagination -->
  <q-pagination input style="place-content: center" v-model="featurePagination.page" @update:model-value="getFeatureRows"
    :max="featurePagination.rowsNumber" boundary-numbers direction-links flat color="grey" active-color="primary" />
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
import { getFeaturesByLayer, deleteFeature } from "src/api/feature";
import PopupFeature from "src/pages/LocationManagementPage/components/popupFeature.vue";
export default defineComponent({
  name: "LocationManagementPage",
  components: {
    PopupFeature,
  },
  props: {
    propsLayer: Object,
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
    const featureFilter = ref("");
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
      {
        name: "properties",
        align: "center",
        label: $t("Properties"),
        style: "min-width: 500px; width: 500px;",
      },
      { name: "action", align: "center", label: $t("Action") },
    ]);
    const featurePagination = ref({
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0,
    });
    const getFeatureRows = async () => {
      const response = await getFeaturesByLayer({
        layerId: props.propsLayer.id,
        per_page: unref(featurePagination).rowsPerPage,
        page: unref(featurePagination).page,
        search: unref(featureFilter),
      });
      if (response) {
        featurePagination.value.rowsNumber = parseInt(
          Math.ceil(response.count / response.per_page)
        );
        featurePagination.value.page = response.page;
        featurePagination.value.rowsPerPage = response.per_page;
        Object.assign(props.propsLayer, { ...props.propsLayer, features: response.data });
      }
    };
    const onDeleteFeature = async (row) => {
      const resolve= () => {
        const index = props?.propsLayer?.features?.findIndex((f) => f.id === row.id)
        const _tempFeatures = props?.propsLayer?.features || []
        _tempFeatures.splice(index, 1)
        Object.assign(props.propsLayer, { ...props.propsLayer, features: _tempFeatures });
      }
      await deleteFeature(row, resolve)
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

    const newFeature = ref({
      name: null,
      properties: null,
    });

    onMounted(async () => {
      await getFeatureRows()
    });

    return {
      tableProps,
      actionButtonProps,
      featureFilter,
      featureColumns,
      getFeatureRows,
      featurePagination,
      newFeature,
      onDeleteFeature,
      currentPopupRef,
      showPopup,
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
