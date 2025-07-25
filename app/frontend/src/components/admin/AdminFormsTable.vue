<script setup>
import _ from 'lodash';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';

const { t, locale } = useI18n({ useScope: 'global' });

const showDeleted = ref(false);
const loading = ref(false);
const inputValue = ref('');
const search = ref('');
const firstDataLoad = ref(true);
const forceTableRefresh = ref(0);
const debounceInput = ref(null);
const debounceTime = ref(1000);
const currentPage = ref(1);
const itemsPP = ref(10);

const adminStore = useAdminStore();
const formStore = useFormStore();

const { formList, formTotal } = storeToRefs(adminStore);
const { isRTL } = storeToRefs(formStore);

const calcHeaders = computed(() =>
  headers.value.filter((x) => x.key !== 'updatedAt' || showDeleted.value)
);

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

watch(showDeleted, async () => {
  await refreshForms();
});

onMounted(async () => {
  debounceInput.value = _.debounce(async () => {
    forceTableRefresh.value += 1;
  }, debounceTime.value);
  refreshForms();
});

async function refreshForms() {
  loading.value = true;
  await adminStore.getForms({
    activeOnly: !showDeleted.value,
    paginationEnabled: true,
    page: currentPage.value - 1,
    itemsPerPage: itemsPP.value,
    search: search.value,
    searchEnabled: search.value.length > 0,
  });
  loading.value = false;
}
async function updateOptions(options) {
  const { page, itemsPerPage } = options;
  if (page) {
    currentPage.value = page;
  }
  if (itemsPerPage) {
    itemsPP.value = itemsPerPage;
  }
  if (!firstDataLoad.value) {
    await refreshForms();
  }
  firstDataLoad.value = false;
}

const debouncedSearch = _.debounce(async (value) => {
  search.value = value;
  await refreshForms();
}, debounceTime.value);

async function handleSearch(value) {
  if (value === '') {
    search.value = value;
    await refreshForms();
  } else {
    debouncedSearch(value);
  }
}
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-row no-gutters>
      <v-col cols="12" sm="8">
        <v-checkbox
          v-model="showDeleted"
          class="pl-3"
          data-test="checkbox-show-deleted"
          :class="isRTL ? 'float-right' : 'float-left'"
          :label="t('trans.adminFormsTable.showDeletedForms')"
        >
          <template #label>
            <span :class="{ 'mr-2': isRTL }" :lang="locale">
              {{ t('trans.adminFormsTable.showDeletedForms') }}
            </span>
          </template>
        </v-checkbox>
      </v-col>

      <v-col cols="12" sm="4">
        <!-- search input -->
        <div
          class="submissions-search"
          :class="isRTL ? 'float-left' : 'float-right'"
        >
          <v-text-field
            v-model="inputValue"
            density="compact"
            variant="underlined"
            :lang="locale"
            :label="t('trans.adminFormsTable.search')"
            append-inner-icon="mdi-magnify"
            single-line
            hide-details
            class="pb-5"
            :class="{ 'dir-rtl': isRTL, label: isRTL }"
            @update:modelValue="handleSearch"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table-server
      class="submissions-table"
      hover
      :headers="calcHeaders"
      item-key="title"
      :items="formList"
      :items-per-page="itemsPP"
      :items-length="formTotal"
      :search="search"
      :loading="loading"
      :lang="locale"
      :loading-text="t('trans.adminFormsTable.loadingText')"
      :no-data-text="t('trans.adminFormsTable.noDataText')"
      @update:options="updateOptions"
    >
      <template #item.createdAt="{ item }">
        {{ $filters.formatDateLong(item.createdAt) }} -
        {{ item.createdBy }}
      </template>
      <template #item.updatedAt="{ item }">
        {{ $filters.formatDateLong(item.updatedAt) }} -
        {{ item.updatedBy }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          color="primary"
          variant="text"
          size="small"
          :to="{ name: 'AdministerForm', query: { f: item.id } }"
          :title="$t('trans.adminFormsTable.admin')"
        >
          <v-icon class="mr-1" icon="mdi:mdi-wrench"></v-icon>
          <span class="d-none d-sm-flex" :lang="locale">{{
            t('trans.adminFormsTable.admin')
          }}</span>
        </v-btn>
        <v-btn
          color="primary"
          variant="text"
          size="small"
          :to="{
            name: 'FormSubmit',
            query: { f: item.id },
          }"
          target="_blank"
          :title="$t('trans.adminFormsTable.launch')"
        >
          <v-icon class="mr-1" icon="mdi:mdi-note-plus"></v-icon>
          <span class="d-none d-sm-flex" :lang="locale">{{
            t('trans.adminFormsTable.launch')
          }}</span>
        </v-btn>
      </template>
    </v-data-table-server>
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
.submissions-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
