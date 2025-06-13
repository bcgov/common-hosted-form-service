<script setup>
import _ from 'lodash';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';

const { t, locale } = useI18n({ useScope: 'global' });

const loading = ref(true);
const search = ref('');
const firstDataLoad = ref(true);
const forceTableRefresh = ref(0);
const debounceInput = ref(null);
const debounceTime = ref(300);
const currentPage = ref(1);
const itemsPP = ref(10);

const adminStore = useAdminStore();
const formStore = useFormStore();

const { userList, userTotal } = storeToRefs(adminStore);
const { isRTL } = storeToRefs(formStore);

const headers = computed(() => [
  {
    title: t('trans.adminUsersTable.fullName'),
    align: 'start',
    key: 'fullName',
  },
  {
    title: t('trans.adminUsersTable.userID'),
    align: 'start',
    key: 'username',
  },
  {
    title: t('trans.adminUsersTable.created'),
    align: 'start',
    key: 'created',
  },
  {
    title: t('trans.adminUsersTable.actions'),
    align: 'end',
    key: 'actions',
    filterable: false,
    sortable: false,
  },
]);

async function refreshUsers() {
  loading.value = true;
  await adminStore.getUsers({
    paginationEnabled: true,
    page: currentPage.value - 1,
    itemsPerPage: itemsPP.value,
    search: search.value,
    searchEnabled: search.value.length > 0 ? true : false,
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
    await refreshUsers();
  }
  firstDataLoad.value = false;
}

async function handleSearch(value) {
  search.value = value;
  if (value === '') {
    await refreshUsers();
  } else {
    debounceInput.value();
  }
}

onMounted(async () => {
  debounceInput.value = _.debounce(async () => {
    forceTableRefresh.value += 1;
  }, debounceTime.value);
  refreshUsers();
});
</script>

<template>
  <div>
    <v-row no-gutters>
      <v-spacer />
      <v-col cols="12">
        <!-- search input -->
        <div
          class="submissions-search"
          :class="isRTL ? 'float-left' : 'float-right'"
        >
          <v-text-field
            v-model="search"
            density="compact"
            variant="underlined"
            :label="$t('trans.adminUsersTable.search')"
            append-inner-icon="mdi-magnify"
            single-line
            hide-details
            class="pb-5"
            :class="{ 'dir-rtl': isRTL, label: isRTL }"
            :lang="locale"
            @update:modelValue="handleSearch"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table-server
      class="submissions-table"
      hover
      :headers="headers"
      item-key="title"
      :items="userList"
      :items-per-page="itemsPP"
      :items-length="userTotal === undefined ? 0 : userTotal"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.adminUsersTable.loadingText')"
      :lang="locale"
      @update:options="updateOptions"
    >
      <template #item.created="{ item }">
        {{ $filters.formatDate(item.createdAt) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          color="primary"
          variant="text"
          size="small"
          :to="{ name: 'AdministerUser', query: { u: item.id } }"
          :title="$t('trans.adminUsersTable.admin')"
        >
          <v-icon class="mr-1" icon="mdi:mdi-wrench"></v-icon>
          <span class="d-none d-sm-flex" :lang="locale">{{
            $t('trans.adminUsersTable.admin')
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
