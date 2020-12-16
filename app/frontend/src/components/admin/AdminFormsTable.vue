<template>
  <div>
    <v-row no-gutters>
      <v-col cols="12" sm="8">
        <v-checkbox
          class="pl-3"
          v-model="activeOnly"
          label="Show deleted forms"
          @click="refeshForms"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <!-- search input -->
        <div class="submissions-search">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
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
      loading-text="Loading... Please wait"
    >
      <template #[`item.created`]="{ item }">
        {{ item.createdAt | formatDate }} - {{ item.createdBy }}
      </template>
      <template #[`item.deleted`]="{ item }">
        {{ item.updatedAt | formatDate }} - {{ item.updatedBy }}
      </template>
      <template #[`item.actions`]="{ item }">
        <router-link :to="{ name: 'AdministerForm', query: { f: item.id } }">
          <v-btn color="primary" text small>
            <v-icon class="mr-1">build_circle</v-icon>
            <span class="d-none d-sm-flex">Admin</span>
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
      headers: [
        { text: 'Form Title', align: 'start', value: 'name' },
        { text: 'Created', align: 'start', value: 'created' },
        { text: 'Deleted', align: 'start', value: 'deleted' },
        {
          text: 'Actions',
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
        },
      ],
      loading: true,
      search: '',
    };
  },
  computed: {
    ...mapGetters('admin', ['formList']),
    calcHeaders() {
      return this.headers.filter(
        (x) => x.value !== 'deleted' || this.activeOnly
      );
    },
  },
  methods: {
    ...mapActions('admin', ['getForms']),
    async refeshForms() {
      this.loading = true;
      await this.getForms(!this.activeOnly);
      this.loading = false;
    },
  },
  async mounted() {
    await this.getForms();
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
