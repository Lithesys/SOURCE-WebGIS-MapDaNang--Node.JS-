<!-- eslint-disable vue/no-mutating-props -->
<template>
  <q-popup-edit
    class="popupEdit shadow-10"
    persistent
    v-model="computedRow"
    :title="title"
    buttons
    :label-set="$t('Save')"
    :label-cancel="$t('Cancel')"
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
      v-model="scope.value.url"
      dense
      autofocus
      label="Url"
    />
    <q-select
      v-model="scope.value.type"
      dense
      autofocus
      :options="types"
      :label="$t('Type')"
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
import { LAYER_TYPE } from "src/constants/enum";
import { getLayerByLocation, updateLayer, createLayer } from "src/api/mapLayer";

export default defineComponent({
  name: "PopupLocation",
  props: {
    row: Object,
    layerRows: Array,
    location: Object,
  },
  setup(props, { emit }) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const computedRow = ref(props.row);
    const title = computed(() => {
      return props.row.id ? `${$t('Update layer')}: ${unref(computedRow).name}`: `${$t('Add layer')}:`
    })
    if (!unref(computedRow).id) {
      computedRow.value.type = LAYER_TYPE[1]
    }
    const saveEdit = async (value, _props) => {
      const updateParams = {
        id: value.id,
        locationId: props.location?.id,
      };
      if (value.name !== _props.name) updateParams.name = value.name;
      if (value.description !== _props.description)
        updateParams.description = value.description;
      if (value.url !== _props.url)
        updateParams.url = value.url;
      if (value.type !== _props.type)
        updateParams.type = value.type;
      if (updateParams.id) {
        const response = await updateLayer(updateParams);
        const currentRow = props.layerRows.find(
          (row) => row.id === response.id
        );
        Object.assign(currentRow, { ...response });
        return;
      } else {
        delete updateParams.id
        const response = await createLayer(updateParams)
      }
    };
    const updateModel = (val) => {
      console.log(val);
    };

    return {
      title,
      computedRow,
      saveEdit,
      updateModel,
      types: LAYER_TYPE,
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
