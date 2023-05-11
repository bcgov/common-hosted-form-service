<template>
  <div>
    <v-row no-gutters>
      <v-col cols="12" sm="8">
        <v-checkbox
          v-model="activeOnly"
          class="pl-3"
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
      no-data-text="There are no forms in your system"
    >
      <template v-slot:item.createdAt="{ item }">
        {{ $filters.formatDateLong(item.raw.createdAt) }} -
        {{ item.raw.createdBy }}
      </template>
      <template v-slot:item.updatedAt="{ item }">
        {{ $filters.formatDateLong(item.raw.updatedAt) }} -
        {{ item.raw.updatedBy }}
      </template>
      <template v-slot:item.actions="{ item }">
        <router-link
          :to="{ name: 'AdministerForm', query: { f: item.raw.id } }"
        >
          <v-btn color="primary" variant="text" size="small">
            <v-icon class="mr-1">build_circle</v-icon>
            <span class="d-none d-sm-flex">Admin</span>
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
            <v-icon class="mr-1">note_add</v-icon>
            <span class="d-none d-sm-flex">Launch</span>
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
        { title: 'Form Title', align: 'start', key: 'name' },
        { title: 'Created', align: 'start', key: 'createdAt' },
        { title: 'Deleted', align: 'start', key: 'updatedAt' },
        {
          title: 'Actions',
          align: 'end',
          key: 'actions',
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
        (x) => x.key !== 'updatedAt' || this.activeOnly
      );
    },
  },
  async mounted() {
    await this.getForms();
    this.loading = false;
  },
  methods: {
    ...mapActions('admin', ['getForms']),
    async refeshForms() {
      this.loading = true;
      await this.getForms(!this.activeOnly);
      this.loading = false;
    },
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
  .submissions-table :deep(th) {
    vertical-align: top;
  }
}
/* Want to use scss but the world hates me */
.submissions-table :deep(tbody) tr:nth-of-type(odd) {
  background-color: #f5f5f5;
}
.submissions-table :deep(thead) tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
