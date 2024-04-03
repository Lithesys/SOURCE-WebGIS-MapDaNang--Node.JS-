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
      v-model="scope.value.properties"
      dense
      autofocus
      :label="$t('Description')"
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
import { createFeature, updateFeature } from 'src/api/feature'
export default defineComponent({
  name: "PopupLocation",
  props: {
    row: Object,
    featureRows: Array,
    layer: Object,
  },
  setup(props, { emit }) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const computedRow = ref(props.row);
    const title = computed(() => {
      return props.row.id ? `${$t('Update feature')}: ${unref(computedRow).name}`: `${$t('Add feature')}:`
    })
    const saveEdit = async (value, _props) => {
      const updateParams = {
        id: value.id,
        layerId: props.layer?.id,
      };
      if (value.name !== _props.name) updateParams.name = value.name;
      if (value.properties !== _props.properties)
        updateParams.properties = value.properties;
      if (updateParams.id) {
        const response = await updateFeature(updateParams);
        const currentRow = props.featureRows.find(
          (row) => row.id === response.id
        );
        Object.assign(currentRow, { ...response });
        return;
      } else {
        delete updateParams.id
        const response = await createFeature({
          features: [updateParams],
          layerId: props.layer?.id,
        })
      }
    };
    const updateModel = (val) => {
    };

    return {
      title,
      computedRow,
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
