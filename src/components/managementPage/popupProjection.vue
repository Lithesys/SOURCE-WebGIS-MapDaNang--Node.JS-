<!-- eslint-disable vue/no-mutating-props -->
<template>
  <q-popup-edit
    class="popupEdit text-black shadow-10"
    text-color="black"
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
      v-model="scope.value.definition"
      dense
      autofocus
      type="textarea"
      :label="$t('Definition')"
      style="min-height: 50px;"
    />
  </q-popup-edit>
</template>

<script>
import {
  defineComponent,
  ref,
  unref,
  getCurrentInstance,
  computed,
} from "vue";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
import {
  createProjection,
  updateProjection,
} from "src/api/projection";

export default defineComponent({
  name: "PopupLocation",
  props: {
    row: Object,
    list: Array,
  },
  setup(props, { emit }) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const computedRow = ref(props.row);
    const title = computed(() => {
      return props.row.id ? `${$t('Update projection')}: ${unref(computedRow).name}`: `${$t('Add projection')}:`
    })
    const saveEdit = async (value, _props) => {
      const updateParams = {
        id: value.id,
      };
      if (value.name !== _props.name) updateParams.name = value.name;
      if (value.definition !== _props.definition)
        updateParams.definition = value.definition;
      
      if (updateParams.id) {
        const response = await updateProjection(updateParams);
        const currentRow = props.list.find(
          (row) => row.id === response.id
        );
        Object.assign(currentRow, { ...response });
        return
      } else {
        delete updateParams.id
        const response = await createProjection(updateParams)
      }
    };
    const updateModel = (val) => {
      console.log(val)
    }
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
