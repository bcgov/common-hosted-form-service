<template>
  <div>
    <BaseInfoCard class="my-4">
      <h4 class="primary--text">
        <v-icon class="mr-1" color="primary">info</v-icon>IMPORTANT!
      </h4>
      <p>
        Form Module Versions can't be deleted, but they can be updated and overwritten. To prevent breaking older forms, you should only replace a url if it is not working.
      </p>
    </BaseInfoCard>

    <div class="mt-8 mb-5">
      <v-icon class="mr-1" color="primary">info</v-icon>The latest version will be used in all form designers.
    </div>

    <v-data-table
      :key="rerenderTable"
      class="form-module-versions-table"
      :headers="headers"
      :items="versionList"
    >
      <!-- Version -->
      <template #[`item.version`]="{ item }">
        <span>
          Version {{ item.version }}
        </span>
      </template>

      <!-- Created date  -->
      <template #[`item.createdAt`]="{ item }">
        {{ item.createdAt | formatDateLong }}
      </template>

      <!-- Created by  -->
      <template #[`item.createdBy`]="{ item }">
        {{ item.createdBy }}
      </template>

      <!-- Actions -->
      <template #[`item.action`]="{ item }">
        <span>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link
                :to="{
                  name: 'FormModuleVersionManage',
                  query: { fm: item.formModuleId, fmv: item.id },
                }"
              >
                <v-btn
                  color="primary"
                  class="mx-1"
                  icon
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>edit</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>Manage Form Module Version</span>
          </v-tooltip>
        </span>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'ManageFormModuleVersions',
  data() {
    return {
      headers: [
        { text: 'Version', align: 'start', value: 'version' },
        { text: 'Date Created', align: 'start', value: 'createdAt' },
        { text: 'Created By', align: 'start', value: 'createdBy' },
        {
          text: 'Actions',
          align: 'end',
          value: 'action',
          filterable: false,
          sortable: false,
          width: 200,
        },
      ],
      rerenderTable: 0,
    };
  },
  computed: {
    ...mapGetters('formModule', ['formModule', 'formModuleVersionList']),
    versionList() {
      if (!this.formModuleVersionList) return [];
      this.formModuleVersionList.map((fmv, index) => {
        fmv.version = this.formModuleVersionList.length - index; 
        return fmv;
      });
      return this.formModuleVersionList;
    }
  },
  methods: {
    ...mapActions('formModule', [
      'getFormModuleVersionList',
    ]),
  },
};
</script>
