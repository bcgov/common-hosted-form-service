<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAdminStore } from '~/store/admin';

const { t } = useI18n({ useScope: 'global' });

const loading = ref(true);
const search = ref('');

const adminStore = useAdminStore();

const { userList } = storeToRefs(adminStore);

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

onMounted(async () => {
  await adminStore.getUsers();
  loading.value = false;
});
</script>

<template>
  <div>
    <v-row no-gutters>
      <v-spacer />
      <v-col cols="12" sm="4">
        <!-- search input -->
        <div class="submissions-search">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            :label="$t('trans.adminUsersTable.search')"
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
      :headers="headers"
      item-key="title"
      :items="userList"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.adminUsersTable.loadingText')"
    >
      <template #item.created="{ item }">
        {{ $filters.formatDate(item.raw.createdAt) }}
      </template>
      <template #item.actions="{ item }">
        <router-link
          :to="{ name: 'AdministerUser', query: { u: item.raw.id } }"
        >
          <v-btn color="primary" variant="text" size="small">
            <v-icon class="mr-1" icon="mdi:mdi-wrench"></v-icon>
            <span class="d-none d-sm-flex">{{
              $t('trans.adminUsersTable.admin')
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
