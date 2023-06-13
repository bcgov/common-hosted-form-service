<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAdminStore } from '~/store/admin';

const { t } = useI18n({ useScope: 'global' });

const activeOnly = ref(false);
const loading = ref(true);
const search = ref('');

const adminStore = useAdminStore();

const { formList } = storeToRefs(adminStore);

const headers = computed(() => [
  {
    title: t('trans.adminFormsTable.formTitle'),
    align: 'start',
    key: 'name',
  },
  {
    title: t('trans.adminFormsTable.created'),
    align: 'start',
    key: 'createdAt',
  },
  {
    title: t('trans.adminFormsTable.deleted'),
    align: 'start',
    key: 'updatedAt',
  },
  {
    title: t('trans.adminFormsTable.actions'),
    align: 'end',
    key: 'actions',
    filterable: false,
    sortable: false,
  },
]);
const calcHeaders = computed(() =>
  headers.value.filter((x) => x.key !== 'updatedAt' || activeOnly.value)
);

async function refreshForms() {
  loading.value = true;
  await adminStore.getForms(!activeOnly.value);
  loading.value = false;
}

onMounted(async () => {
  await adminStore.getForms();
  loading.value = false;
});
</script>

<template>
  <div>
    <v-row no-gutters>
      <v-col cols="12" sm="8">
        <v-checkbox
          v-model="activeOnly"
          class="pl-3"
          :label="$t('trans.adminFormsTable.showDeletedForms')"
          @click="refreshForms"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <!-- search input -->
        <div class="submissions-search">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            :label="$t('trans.adminFormsTable.search')"
            single-line
            hide-details
            class="pb-5"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      :headers="calcHeaders"
      item-key="title"
      :items="formList"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.adminFormsTable.loadingText')"
      :no-data-text="$t('trans.adminFormsTable.noDataText')"
    >
      <template #item.createdAt="{ item }">
        {{ $filters.formatDateLong(item.raw.createdAt) }} -
        {{ item.raw.createdBy }}
      </template>
      <template #item.updatedAt="{ item }">
        {{ $filters.formatDateLong(item.raw.updatedAt) }} -
        {{ item.raw.updatedBy }}
      </template>
      <template #item.actions="{ item }">
        <router-link
          :to="{ name: 'AdministerForm', query: { f: item.raw.id } }"
        >
          <v-btn color="primary" variant="text" size="small">
            <v-icon class="mr-1" icon="mdi:mdi-wrench"></v-icon>
            <span class="d-none d-sm-flex">{{
              $t('trans.adminFormsTable.admin')
            }}</span>
          </v-btn>
        </router-link>

        <router-link
          :to="{
            name: 'FormSubmit',
            query: { f: item.raw.id },
          }"
          target="_blank"
        >
          <v-btn color="primary" variant="text" size="small">
            <v-icon class="mr-1" icon="mdi:mdi-note-plus"></v-icon>
            <span class="d-none d-sm-flex">{{
              $t('trans.adminFormsTable.launch')
            }}</span>
          </v-btn>
        </router-link>
      </template>
    </v-data-table>
  </div>
</template>
<style scoped>
/* TODO: Global Style! */
.submissions-search {
  width: 100%;
}
@media (min-width: 600px) {
  .submissions-search {
    max-width: 20em;
    float: right;
  }
}
@media (max-width: 599px) {
  .submissions-search {
    padding-left: 16px;
    padding-right: 16px;
  }
}

.submissions-table {
  clear: both;
}
@media (max-width: 1263px) {
  .submissions-table :deep(th) {
    vertical-align: top;
  }
}
/* Want to use scss but the world hates me */
.submissions-table :deep(tbody tr:nth-of-type(odd)) {
  background-color: #f5f5f5;
}
.submissions-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
