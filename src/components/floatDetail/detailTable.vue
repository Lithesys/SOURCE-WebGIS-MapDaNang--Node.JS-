<template>
  <div v-if="role === 'ADMIN'" class="adminClass">
    <q-btn v-if="ableToSave" class="gt-xs" size="12px" flat dense round icon="save" @click="dialog = true">
      <q-tooltip anchor="top middle" self="center middle">{{
        $t("Save to database")
      }}</q-tooltip>
      <q-dialog v-model="dialog">
        <detail-popup-save :content="content" />
      </q-dialog>
    </q-btn>
    <q-btn v-if="isEditting" class="gt-xs" size="12px" flat dense round icon="done" @click="saveEdit">
      <q-tooltip anchor="top middle" self="center middle">{{
        $t("Save")
      }}</q-tooltip>
    </q-btn>
    <q-btn v-else class="gt-xs" size="12px" flat dense round icon="edit" @click="isEditting = !isEditting">
      <q-tooltip anchor="top middle" self="center middle">{{
        $t("Edit")
      }}</q-tooltip>
    </q-btn>
    <q-btn v-if="isEditting && ableToDelete" class="gt-xs" size="12px" flat dense round icon="delete"
      @click="onDeleteFeature">
      <q-tooltip anchor="top left" self="center middle">{{
        $t("Delete feature")
      }}</q-tooltip>
    </q-btn>
  </div>
  <q-scroll-area class="panelClass" v-bind="SCROLL_STYLE.SECONDARY">
    <q-table class="tableClass" :rows="rows" :columns="columns" separator="cell" row-key="name" virtual-scroll hide-header
      hide-bottom flat bordered wrap-cells :rows-per-page-options="[0]">
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" :props="props" class="captionClass" style="padding: 0">
            <span>
              {{ props.row.name }}
            </span>
          </q-td>
          <q-td key="value" :props="props" style="padding: 0">
            <q-input v-if="isEditting" filled autogrow color="secondary" v-model="props.row.value" />
            <span v-else>
              {{ props.row.value }}
            </span>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </q-scroll-area>
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
  watch,
} from "vue";
import _isEqual from "lodash/isEqual";
import { useQuasar, Dialog } from "quasar";
import { i18n } from "boot/i18n.js";
import { useUserStore } from "src/stores/user";
import { useMapStore } from "stores/map";
import detailPopupSave from "src/components/floatDetail/detailPopupSave.vue";
import { LAYER_TYPE, FEATURE_TYPE } from "src/constants/enum";
import { SCROLL_STYLE } from "src/constants/virtual-scroll.js";
import { getFeaturesByLayer, deleteFeature } from "src/api/feature";
import { deleteXML } from "src/utils/transactionXML";

export default defineComponent({
  name: "detailTable",
  props: {
    id: String,
    content: Object,
    type: String,
    feature_type: String,
  },
  components: {
    "detail-popup-save": detailPopupSave,
  },
  setup(props, { emit }) {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    const userStore = useUserStore();
    const mapStore = useMapStore();
    const location = computed(() => mapStore.getLocation);
    const workspace = computed(() => mapStore.getLocation.workspace);
    const layer = computed(() => mapStore.getSelectedFeature.layer);
    const { role } = userStore.getUser;

    const isEditting = ref(false);
    const ableToSave = computed(
      () => unref(isEditting) && props.type !== LAYER_TYPE[0]
    );
    const ableToDelete = computed(
      () => unref(isEditting) && unref(layer)?.get("id")?.includes?.(unref(workspace))
    );

    const decodeStringGeoServer = (string) => {
      try {
        return decodeURIComponent(escape(string));
      } catch (e) {
        return string;
      }
    };

    const rows = ref(
      Object.entries(props.content).map((i) => {
        let value = "";
        if (i[1] !== undefined && i[1]!== null) {
          if (typeof i[1] === "string") {
            value = i[1];
          } else {
            value = JSON.stringify(i[1]);
          }
        }
        return {
          name: i[0],
          value: decodeStringGeoServer(value),
        };
      })
    );
    const columns = [
      {
        name: "name",
        align: "center",
        label: "Name",
        field: "name",
        style: "min-width: 90px; width: 90px",
      },
      {
        name: "value",
        align: "center",
        label: "Value",
        field: "value",
        style: "min-width: 300px; width: 300px",
      },
    ];
    const saveEdit = () => {
      isEditting.value = false;
      const content = unref(rows).reduce((acc, item) => {
        if (!item.name) return acc;
        try {
          acc[item.name] = JSON.parse(item.value);
        } catch {
          acc[item.name] = item.value;
        }
        return acc;
      }, {});
      emit("update:model-content", content);
    };

    const onDeleteFeature = async () => {
      if (props.id) {
        $q.dialog({
          icon: 'delete',
          title: $t('Warning'),
          message: `${$t('Delete feature')}?`,
          ok: {
            push: true
          },
          cancel: {
            push: true,
            color: 'negative'
          },
          persistent: true,
        }).onOk(async () => {
          try {
            const {layer, feature} = mapStore.getSelectedFeature
            const layerName = layer?.get?.("id")?.replace?.(`${unref(workspace)}:`, "")
            
            const resolve = () => {
              layer?.getSource().updateParams()
            }
            await deleteXML({workspace: unref(workspace), layer: layerName, feature, resolve});
            // const response = await deleteFeature({ id: props.id });
            // if (response) {

            // }
          } catch (e) {
            cons.log(e)
            //
          }
        }).onCancel(() => {
        }).onDismiss(() => {
        })
      }
    };

    const addField = () => {
      rows.value.splice(0, 0, {
        name: "",
        value: "",
      });
    };

    watch(
      () => unref(props.content),
      (newVal, oldVal) => {
        if (!_isEqual(newVal, oldVal)) {
          rows.value = Object.entries(props.content).map((i) => {
            let type = "string";
            let value = "";
            if (i[1] !== undefined && i[1] !== null) {
              if (typeof i[1] === "string") {
                value = decodeStringGeoServer(i[1]);
              } else {
                value = decodeStringGeoServer(JSON.stringify(i[1]));
                type = "object";
              }
            }
            return {
              name: i[0],
              value,
              type,
            };
          });
        }
      }
    );
    watch(
      () => unref(props.id),
      (newVal, oldVal) => {
        if (!_isEqual(newVal, oldVal)) {
          isEditting.value = false
        }
      }
    );
    return {
      vm,
      role,
      isEditting,
      rows,
      columns,
      saveEdit,
      onDeleteFeature,
      addField,
      location,
      ableToSave,
      ableToDelete,
      dialog: ref(false),
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

.panelClass {
  max-height: 200px;
  height: 200px;
  max-width: 398px;
}

.tableClass {
  // width: 390px;
  // max-width: 390px;
  // width: 98%;
  // max-width: 98%;
}

.captionClass {
  font-weight: 600;
}
</style>
