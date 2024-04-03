<template>
  <div class="q-pa-md">
    <q-table
      flat
      bordered
      wrap-cells
      hide-pagination
      row-key="name"
      title="Treats"
      :rows="rows"
      :columns="columns"
      separator="cell"
      v-model:pagination="projectionPagination"
    >
      <template v-slot:top>
        <div class="text-h6">{{ $t("Projections") }}</div>
        <q-btn rounded color="primary" icon="add" style="margin-left: 10px">
          <q-tooltip anchor="center right" self="center start">{{
            $t("Add projection")
          }}</q-tooltip>
          <PopupProjection v-model:row="newProjection" :list="rows"/>
        </q-btn>
        <q-space />
        <q-input debounce="300" color="primary" v-model="filter" @update:model-value="getAll()">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="id" :props="props">
              {{ props.row.id }}
          </q-td>
          <q-td key="name" :props="props">
            <q-badge color="primary">
              {{ props.row.name }}
            </q-badge>
          </q-td>
          <q-td key="definition" :props="props" style="white-space: pre-wrap">
            {{ props.row.definition }}
          </q-td>
          <q-td key="action" :props="props">
            <q-btn
              v-bind="actionButtonProps"
              icon="edit"
              style="margin-right: 10px"
            >
              <!-- popup projection edit -->
              <PopupProjection v-model:row="props.row" :list="rows" />
            </q-btn>
            <q-btn
              v-bind="{ ...actionButtonProps, color: 'red' }"
              icon="delete"
              @click="onDeleteProjection(props.row)"
            >
            </q-btn>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <q-pagination
      input
      style="place-content: center"
      v-model="projectionPagination.page"
      @update:model-value="getAll"
      :max="projectionPagination.rowsNumber"
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
  computed,
  getCurrentInstance,
  onMounted,
} from "vue";
import { useQuasar } from "quasar";
import { i18n } from "boot/i18n.js";
import PopupProjection from "src/pages/ProjectionManagementPage/popupProjection.vue";

import {
  getAllProjection,
  deleteProjection,
} from "src/api/projection";

export default defineComponent({
  name: "ProjectionManagementPage",
  components: {
    PopupProjection,
  },
  setup() {
    const $t = i18n.global.t;
    const $q = useQuasar();
    const filter = ref("");
    const visibleColumns = ref(["name", "definition", "action"]);
    const actionButtonProps = {
      size: "sm",
      color: "primary",
      round: true,
      dense: true,
    };
    const columns = computed(() => [
      {
        name: "id",
        required: true,
        label: "Id",
        align: "left",
        field: "id",
      },
      {
        name: "name",
        align: "center",
        label: $t("Name"),
        field: "name",
        sortable: true,
      },
      {
        name: "definition",
        align: "center",
        label: $t("Definition"),
        field: "definition",
      },
      { name: "action", align: "center", label: $t("Action") },
    ]);

    const newProjection = ref({
      name: null,
      definition: null,
    })
    const toggle = async (row) => {
      $q.dialog({
        title: $t("Warning"),
        message: !row.activate
          ? `${$t("Deactivate user")}  ${row.email}?`
          : `${$t("Activate user")}  ${row.email}?`,
        ok: {
          push: true,
        },
        cancel: {
          push: true,
          color: "negative",
        },
        persistent: true,
      })
        .onOk(async () => {
          const response = await activateUser(row);
        })
        .onCancel(() => {
          row.activate = !row.activate;
        })
        .onDismiss(() => { });
    };
    const projectionPagination = ref({
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0,
    });
    const getAll = async (val) => {
      const query = {
        page: val ? val : unref(projectionPagination).page,
        per_page: unref(projectionPagination).rowsPerPage,
        search: unref(filter),
      }
      if (unref(filter)) {
        query.page = 1
      }
      const response = await getAllProjection(query);
      rows.value = response.data;
      projectionPagination.value.page = response.page;
      projectionPagination.value.rowsPerPage = response.per_page;
      projectionPagination.value.rowsNumber = parseInt(
        Math.ceil(response.count / response.per_page)
      );
    };
    const rows = ref([]);
    onMounted(async () => {
      await getAll();
    });

    const onDeleteProjection = async (row) => {
      const resolve = async () => {
        await getAll();
      };
      const res = await deleteProjection(row, resolve);
    };
    return {
      newProjection,
      filter,
      visibleColumns,
      columns,
      rows,
      toggle,
      onDeleteProjection,
      actionButtonProps,
      projectionPagination,
      getAll,
    };
  },
});
</script>
<style lang="scss"></style>
