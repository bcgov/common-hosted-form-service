<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <v-col class="text-right">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <router-link :to="{ name: 'ImportFormModuleView' }">
              <v-btn class="mx-1" color="primary" icon v-bind="attrs" v-on="on">
                <v-icon>add_circle</v-icon>
              </v-btn>
            </router-link>
          </template>
          <span>Import Form Module</span>
        </v-tooltip>
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col cols="12" sm="8">
        <v-checkbox
          class="pl-3"
          v-model="activeOnly"
          label="Show disabled form modules"
          @click="refeshFormModules"
        />
      </v-col>
      <v-col cols="12" sm="4">
        <!-- search input -->
        <div class="form-module-versions-search">
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

    <v-data-table
      class="form-modules-table"
      :headers="calcHeaders"
      item-key="title"
      :items="formModuleList"
      :search="search"
      :loading="loading"
      loading-text="Loading... Please wait"
      no-data-text="There are no form modules in your system"
    >
      <template #[`item.actions`]="{ item }">
        <router-link :to="{ name: 'FormModuleManage', query: { fm: item.id } }">
          <v-btn color="primary" text small>
            <v-icon class="mr-1">build_circle</v-icon>
            <span class="d-none d-sm-flex">Manage</span>
          </v-btn>
        </router-link>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';


export default {
  name: 'AdminFormModulesTable',
  data() {
    return {
      activeOnly: false,
      headers: [
        { text: 'Form Module Name', align: 'start', value: 'pluginName' },
        { text: 'Created', align: 'start', value: 'createdAt' },
        { text: 'Disabled', align: 'start', value: 'active' },
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
    ...mapGetters('formModule', ['formModuleList']),
    calcHeaders() {
      return this.headers.filter(
        (x) => x.value !== 'active' || this.activeOnly
      );
    },
  },
  methods: {
    ...mapActions('formModule', ['getFormModuleList']),
    async refeshFormModules() {
      this.loading = true;
      await this.getFormModuleList(!this.activeOnly);
      this.loading = false;
    },
  },
  async mounted() {
    await this.getFormModuleList(!this.activeOnly);
    this.loading = false;
  },
};
</script>

<stype scoped>

</stype>
