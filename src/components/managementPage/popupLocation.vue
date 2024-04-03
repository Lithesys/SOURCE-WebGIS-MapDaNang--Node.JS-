<!-- eslint-disable vue/no-mutating-props -->
<template>
  <q-popup-edit
    class="popupEdit shadow-10"
    square
    buttons
    persistent
    :title="title"
    :label-set="$t('Save')"
    :label-cancel="$t('Cancel')"
    v-model="computedRow"
    @update:model="updateModel"
    @save="saveEdit"
    v-slot="scope"
  >
    <q-input v-model="scope.value.name" dense autofocus :label="$t('Name')" />
    <q-input
      v-model="scope.value.description"
      dense
      autofocus
      :label="$t('Description')"
    />
    <q-input
      v-model="scope.value.view.longitude"
      type="number"
      dense
      autofocus
      :label="$t('Longitude')"
    />
    <q-input
      v-model="scope.value.view.latitude"
      type="number"
      dense
      autofocus
      :label="$t('Latitude')"
    />
    <q-input
      v-model="scope.value.workspace"
      dense
      autofocus
      :label="$t('Workspace')"
    />
    <q-select
      v-model="scope.value.view.projection"
      dense
      autofocus
      option-label="name"
      :options="projections"
      :label="$t('Projection')"
    />
  </q-popup-edit>
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
import { transformExtent, get as getProj } from "ol/proj";
import { getWidth } from 'ol/extent';

import proj4 from "proj4";
import { register } from "ol/proj/proj4";

import { transformProjection } from "src/utils/openLayers.js";
import { updateLocation, addLocaction } from "src/api/location";
export default defineComponent({
  name: "PopupLocation",
  props: {
    row: Object,
    locationRows: Array,
    projections: Array,
  },
  setup(props, { emit }) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const computedRow = ref(props.row);
    const title = computed(() => {
      return props.row.id
        ? `${$t("Update location")}: ${unref(computedRow).name}`
        : `${$t("Add location")}:`;
    });
    const saveEdit = async (value, _props) => {
      const updateParams = {
        id: value.id,
        view: {},
      };
      if (value.name !== _props.name) updateParams.name = value.name;
      if (value.description !== _props.description)
        updateParams.description = value.description;
      if (value.workspace !== _props.workspace)
        updateParams.workspace = value.workspace;
      if (value.view?.latitude !== _props.view.latitude) {
        Object.assign(updateParams, {
          ...updateParams,
          view: {
            ...updateParams.view,
            latitude: value.view?.latitude,
          },
        });
      }
      updateParams.view.latitude = value.view.latitude;
      if (value.view?.longitude !== _props.view.longitude) {
        Object.assign(updateParams, {
          ...updateParams,
          view: {
            ...updateParams.view,
            longitude: value.view?.longitude,
          },
        });
      }
      if (value.view?.projection !== _props.view.projection) {
        Object.assign(updateParams, {
          ...updateParams,
          view: {
            ...updateParams.view,
            projection: value.view.projection,
          },
        });
      }
      
      const longLat = transformProjection({
        to: _props.view?.projection?.name || "EPSG:4326",
        definition: _props.view?.projection?.definition || "",
        coordinates: [
          parseFloat(value.view?.longitude || _props.view.longitude),
          parseFloat(value.view?.latitude || _props.view.latitude),
        ],
      });

      Object.assign(updateParams, {
        ...updateParams,
        view: {
          ...updateParams.view,
          extent: JSON.stringify([
            longLat[0] - 54000, // min lat
            longLat[1] - 30000, // min long
            longLat[0] + 50000, // max lat
            longLat[1] + 30000, // min long
          ]),
        },
      });
      if (updateParams.id) {
        const response = await updateLocation(updateParams);
        const currentRow = props.locationRows.find(
          (row) => row.id === response.id
        );
        Object.assign(currentRow, { ...response });
        return;
      } else {
        delete updateParams.id;
        const response = await addLocaction(updateParams);
      }
    };
    const updateModel = (val) => {
      console.log(val);
    };
    return {
      computedRow,
      title,
      saveEdit,
      updateModel,
    };
  },
});
</script>
<style lang="scss">
.popupEdit {
  color: #1976d2;
  width: 50%;
  right: 200px;
  left: 25% !important;
}
</style>
