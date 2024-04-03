<template>
  <div class="q-pa-md">
    <q-table
      class="tableLocationClass"
      v-bind="tableProps"
      title="Treats"
      v-model:rows="locationRows"
      :columns="locationColumns"
      v-model:pagination="locationPagination"
      :visible-columns="visibleLocationColumns"
      :filter="locationFilter"
    >
      <template v-slot:top>
        <q-select
          v-model="visibleLocationColumns"
          :display-value="$t('Columns')"
          :options="locationColumns"
          dense
          multiple
          outlined
          emit-value
          map-options
          options-cover
          options-dense
          option-value="name"
          style="min-width: 150px"
        />
        <q-btn rounded color="primary" icon="add" style="margin-left: 10px">
          <q-tooltip anchor="center right" self="center start">{{
            $t("Add location")
          }}</q-tooltip>
          <PopupLocation
            v-model:row="newLocation"
            :location-rows="locationRows"
            :projections="projections"
            :workspaces="workspaces"
          />
        </q-btn>
        <q-space />
        <!-- <q-btn color="primary" icon="sync" @click="onSyncWorkspace">
          <q-tooltip>{{ $t('synchronized data from geoserver') }}</q-tooltip>
        </q-btn> -->
        <q-input :label="$t('Search for location')" debounce="300" color="primary" v-model="locationFilter" @update:model-value="getAll()">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body="propsLocation">
        <q-tr :props="propsLocation">
          <q-td
            v-for="_key in ['id', 'name', 'description']"
            :key="_key"
            :props="propsLocation"
          >
            {{ propsLocation.row[_key] }}
          </q-td>
          <q-td
            v-for="_key in ['longitude', 'latitude']"
            :key="_key"
            :props="propsLocation"
          >
            {{ propsLocation.row?.view?.[_key] }}
          </q-td>
          <q-td key="workspace" :props="propsLocation">
            {{ propsLocation.row.workspace }}
          </q-td>
          <q-td key="projection" :props="propsLocation">
            {{ propsLocation.row.view?.projection?.name }}
          </q-td>
          <q-td key="layer" :props="propsLocation">
            <q-btn
              v-bind="actionButtonProps"
              @click="propsLocation.expand = !propsLocation.expand"
              :icon="propsLocation.expand ? 'expand_less' : 'expand_more'"
            />
          </q-td>
          <q-td key="action" :props="propsLocation">
            <q-btn
              v-bind="actionButtonProps"
              icon="edit"
              style="margin-right: 10px"
            >
              <!-- popup location edit -->
              <PopupLocation
                v-model:row="propsLocation.row"
                :location-rows="locationRows"
                :projections="projections"
                :workspaces="workspaces"
              />
            </q-btn>
            <q-btn
              v-bind="{ ...actionButtonProps, color: 'red' }"
              icon="delete"
              @click="onDeleteLocation(propsLocation.row)"
            >
            </q-btn>
          </q-td>
        </q-tr>
        <q-tr v-show="propsLocation.expand" :props="propsLocation">
          <q-td colspan="100%" v-if="propsLocation.expand">
            <!-- layer table -->
            <TableLayer :props-location="propsLocation.row"/>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <!-- location pagination -->
    <q-pagination
      input
      style="place-content: center"
      v-model="locationPagination.page"
      @update:model-value="getAll"
      :max="locationPagination.rowsNumber"
      boundary-numbers
      direction-links
      flat
      color="grey"
      active-color="primary"
    />
  </div>
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
import {
  deleteLocation,
  getAllLocation,
  updateLocation,
  addLocaction,
} from "src/api/location";
import { getAllProjection } from "src/api/projection";
import { getWorkspace, syncWorkspace } from "src/api/workspace";
import PopupLocation from "src/pages/LocationManagementPage/components/popupLocation.vue";
import TableLayer from "src/pages/LocationManagementPage/components/tableLayer.vue";
export default defineComponent({
  name: "LocationManagementPage",
  components: {
    PopupLocation,
    TableLayer,
  },
  setup() {
    const vm = getCurrentInstance().proxy;
    const $q = useQuasar();
    const $t = i18n.global.t;
    // deprecated for synchronize with command instead
    const onSyncWorkspace = async () => {
      await syncWorkspace({
        workspaces: unref(workspaces).map((sp) => sp.name)
      })
    }
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
    const locationFilter = ref("");
    const visibleLocationColumns = ref([
      "name",
      "description",
      "longitude",
      "latitude",
      "workspace",
      "projection",
      "layer",
      "action",
    ]);
    const locationColumns = computed(() => [
      {
        name: "id",
        required: true,
        label: "Id",
        align: "left",
        field: "id",
        style: "min-width: 90px; width: 90px",
      },
      {
        name: "name",
        align: "center",
        label: $t("Name"),
        field: "name",
      },
      {
        name: "description",
        align: "center",
        label: $t("Description"),
        field: "description",
        style: "min-witdh: 300px; max-width: 400px; width: 400px",
      },
      {
        name: "longitude",
        align: "center",
        label: $t("Longitude"),
        field: "longitude",
        sortable: true,
      },
      {
        name: "latitude",
        align: "center",
        label: $t("Latitude"),
        field: "latitude",
        sortable: true,
      },
      {
        name: "workspace",
        align: "center",
        label: $t("Workspace"),
        field: "workspace",
      },
      {
        name: "projection",
        align: "center",
        label: $t("Projection"),
        field: "projection",
        sortable: true,
      },
      {
        name: "layer",
        align: "center",
        label: $t("Layers"),
        field: "mapLayers",
      },
      {
        name: "action",
        align: "center",
        label: $t("Action"),
      },
    ]);
    const locationPagination = ref({
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0,
    });
    const onDeleteLocation = async (row) => {
      const resolve = async () => {
        await getAll();
      };
      const res = await deleteLocation(row, resolve);
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

    const getAll = async (val) => {
      const query = {
        page: val ? val : unref(locationPagination).page,
        per_page: unref(locationPagination).rowsPerPage,
        search: unref(locationFilter),
      };
      const response = await getAllLocation(query);
      locationRows.value = response.data;
      locationPagination.value.page = response.page;
      locationPagination.value.rowsPerPage = response.per_page;
      locationPagination.value.rowsNumber = parseInt(
        Math.ceil(response.count / response.per_page)
      );
    };
    const newLocation = ref({
      name: null,
      description: null,
      view: {
        longitude: null,
        latitude: null,
        projection: {
          name: null,
        },
      },
    });
    const locationRows = ref([]);
    const projections = ref([]);
    const workspaces = ref([]);
    onMounted(() => {
      getAll();
      getAllProjection()
        .then((response) => {
          projections.value = response.data;
        })
        .catch(() => {
          projections.value = [];
        });
      getWorkspace().then((response) => {
        workspaces.value = response?.workspaces?.workspace || response?.workspace || response?.workspaces
      }).catch(() => {
        workspaces.value = [];
      })
    });

    return {
      tableProps,
      actionButtonProps,
      locationFilter,
      getAll,
      visibleLocationColumns,
      locationColumns,
      locationRows,
      locationPagination,
      newLocation,
      onDeleteLocation,
      currentPopupRef,
      showPopup,
      projections,
      workspaces,
      onSyncWorkspace,
    };
  },
});
</script>
<style lang="scss" scoped>
.tableLocationClass {
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
