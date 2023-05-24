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
      <template #[`item.created`]="{ item }">
        {{ item.createdAt | formatDate }}
      </template>
      <template #[`item.actions`]="{ item }">
        <router-link :to="{ name: 'AdministerUser', query: { u: item.id } }">
          <v-btn color="primary" text small>
            <v-icon class="mr-1">build_circle</v-icon>
            <span class="d-none d-sm-flex">{{
              $t('trans.adminUsersTable.admin')
            }}</span>
          </v-btn>
        </router-link>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'FormsTable',
  data() {
    return {
      activeOnly: false,
      loading: true,
      search: '',
    };
  },
  computed: {
    ...mapGetters('admin', ['userList']),
    headers() {
      return [
        {
          text: this.$t('trans.adminUsersTable.fullName'),
          align: 'start',
          value: 'fullName',
        },
        {
          text: this.$t('trans.adminUsersTable.userID'),
          align: 'start',
          value: 'username',
        },
        {
          text: this.$t('trans.adminUsersTable.created'),
          align: 'start',
          value: 'created',
        },
        {
          text: this.$t('trans.adminUsersTable.actions'),
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
        },
      ];
    },
  },
  methods: {
    ...mapActions('admin', ['getUsers']),
  },
  async mounted() {
    await this.getUsers();
    this.loading = false;
  },
};
</script>

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
  .submissions-table >>> th {
    vertical-align: top;
  }
}
/* Want to use scss but the world hates me */
.submissions-table >>> tbody tr:nth-of-type(odd) {
  background-color: #f5f5f5;
}
.submissions-table >>> thead tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
