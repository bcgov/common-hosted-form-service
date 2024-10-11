<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';

const { t, locale } = useI18n({ useScope: 'global' });

const showDeleted = ref(false);
const loading = ref(false);
const search = ref('');

const adminStore = useAdminStore();
const formStore = useFormStore();

const { formList } = storeToRefs(adminStore);
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
  await refreshForms();
});

async function refreshForms() {
  loading.value = true;
  await adminStore.getForms(!showDeleted.value);
  loading.value = false;
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
            v-model="search"
            density="compact"
            variant="underlined"
            :lang="locale"
            :label="t('trans.adminFormsTable.search')"
            append-inner-icon="mdi-magnify"
            single-line
            hide-details
            class="pb-5"
            :class="{ 'dir-rtl': isRTL, label: isRTL }"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      hover
      :headers="calcHeaders"
      item-key="title"
      :items="formList"
      :search="search"
      :loading="loading"
      :lang="locale"
      :loading-text="t('trans.adminFormsTable.loadingText')"
      :no-data-text="t('trans.adminFormsTable.noDataText')"
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
        <router-link :to="{ name: 'AdministerForm', query: { f: item.id } }">
          <v-btn
            color="primary"
            variant="text"
            size="small"
            :title="$t('trans.adminFormsTable.admin')"
          >
            <v-icon class="mr-1" icon="mdi:mdi-wrench"></v-icon>
            <span class="d-none d-sm-flex" :lang="locale">{{
              t('trans.adminFormsTable.admin')
            }}</span>
          </v-btn>
        </router-link>

        <router-link
          :to="{
            name: 'FormSubmit',
            query: { f: item.id },
          }"
          target="_blank"
        >
          <v-btn
            color="primary"
            variant="text"
            size="small"
            :title="$t('trans.adminFormsTable.launch')"
          >
            <v-icon class="mr-1" icon="mdi:mdi-note-plus"></v-icon>
            <span class="d-none d-sm-flex" :lang="locale">{{
              t('trans.adminFormsTable.launch')
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
.submissions-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
