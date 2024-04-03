<template>
  <div class="q-pa-md">
    <q-table
      flat bordered
      title="Treats"
      :rows="rows"
      :columns="columns"
      row-key="name"
      :visible-columns="visibleColumns"
      :filter="filter"
      :rows-per-page-options="[0]"
    >
      <template v-slot:top>
        <q-select
          v-model="visibleColumns"
          :display-value="$t('Columns')"
          :options="columns"
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
        <q-space />
        <q-input debounce="300" color="primary" v-model="filter">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="id" :props="props">
            <q-badge color="green">
              {{ props.row.id }}
            </q-badge>
          </q-td>
          <q-td key="email" :props="props">
            <q-badge color="primary">
              {{ props.row.email }}
            </q-badge>
          </q-td>
          <q-td key="name" :props="props">
            {{ props.row.name }}
          </q-td>
          <q-td key="role" :props="props">
            <q-badge v-if="props.row.role==='USER'" color="primary">
              {{ props.row.role }}
            </q-badge>
            <q-badge v-else color="red">
              {{ props.row.role }}
            </q-badge>
          </q-td>
          <q-td key="activate" :props="props">
            <q-toggle :disable="props.row.role==='ADMIN'"  v-model="props.row.activate"
            @update:model-value="toggle(props.row)">
              <q-tooltip>{{ $t("Activate user") }}</q-tooltip>
            </q-toggle>
          </q-td>
        </q-tr>
      </template>
    </q-table>
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
import { useQuasar, Dialog } from "quasar";
import { i18n } from "boot/i18n.js";
import { getAll, activateUser } from 'src/api/user'
export default defineComponent({
  name: "UserManagementPage",
  setup() {
    const $t = i18n.global.t;
    const $q = useQuasar();
    const filter = ref('')
    const value = ref(true)
    const visibleColumns = ref([ 'email', 'name','role', 'activate'])
    const columns = computed(() => [
      {
        name: 'id',
        required: true,
        label: 'Id',
        align: 'left',
        field: row => row.id,
        format: val => `${val}`,
      },
      { name: 'email', align: 'center', label: $t('Email'), field: 'email', sortable: true },
      { name: 'name', align: 'center', label: $t('Name'), field: 'name', sortable: true },
      { name: 'role', align: 'center', label: $t('Role'), field: 'role', sortable: true },
      { name: 'activate', align: 'center', label: $t('Activate'), field: 'activate', sortable: true },
    ])
    const toggle = async (row) => {
      Dialog.create({
        class: 'deleteWarningClass',
        title: $t('Warning'),
         message:
           !row.activate ?
             `${$t('Deactivate user')}  ${row.email}?`:
             `${$t('Activate user')}  ${row.email}?`,
        ok: {
          push: true
        },
        cancel: {
          push: true,
          color: 'negative'
        },
        persistent: true
      }).onOk(async() => {
        const response = await activateUser(row)
      }).onCancel(() => {
        row.activate = !row.activate
      }).onDismiss(() => {
      })
    }
    const getAllUser = async() => {
      const response = await getAll()
        return response
    }
    const rows = ref([])
    onMounted(async () => {
      const allUsers = await getAllUser()
      rows.value = allUsers
    })

    return {
      value,
      filter,
      visibleColumns,
      columns,
      rows,
      toggle,
    }
  }
})
</script>
<style lang="scss">
.deleteWarningClass {
  .q-dialog__title {
    color: orange;
  
    &::before {
      content: "\26A0";
    }
  }
}
</style>