<script>
import { mapActions, mapState } from 'pinia';

import { i18n } from '~/internationalization';

import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';

export default {
  data() {
    return {
      loading: true,
      search: '',
    };
  },
  computed: {
    ...mapState(useAdminStore, ['userList']),
    ...mapState(useFormStore, ['isRTL', 'lang']),
    headers() {
      return [
        {
          title: i18n.t('trans.adminUsersTable.fullName'),
          align: 'start',
          key: 'fullName',
        },
        {
          title: i18n.t('trans.adminUsersTable.userID'),
          align: 'start',
          key: 'username',
        },
        {
          title: i18n.t('trans.adminUsersTable.created'),
          align: 'start',
          key: 'created',
        },
        {
          title: i18n.t('trans.adminUsersTable.actions'),
          align: 'end',
          key: 'actions',
          filterable: false,
          sortable: false,
        },
      ];
    },
  },
  async mounted() {
    await this.getUsers();
    this.loading = false;
  },
  methods: {
    ...mapActions(useAdminStore, ['getUsers']),
  },
};
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
            :lang="lang"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      hover
      :headers="headers"
      item-key="title"
      :items="userList"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.adminUsersTable.loadingText')"
      :lang="lang"
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
            <span class="d-none d-sm-flex" :lang="lang">{{
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
.submissions-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
