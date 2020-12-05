<template>
  <div>
    <BaseInfoCard class="my-4">
      Editing this form design and saving the changes will create and publish a
      new version. Any submissions made to previous versions will maintain the
      design of the form at the time of that submission.
    </BaseInfoCard>

    <strong>History</strong>
    <v-data-table
      class="submissions-table"
      :headers="headers"
      :items="versionList"
    >
      <template #[`item.version`]="{ item }">
        Version {{ item.version }}
      </template>
      <template #[`item.createdAt`]="{ item }">
        {{ item.createdAt | formatDateLong }}
        - {{ item.createdBy }}
      </template>
      <template #[`item.create`]="{ item }">
        <router-link
          :to="{
            name: 'FormDesigner',
            query: { f: item.formId, v: item.id },
          }"
        >
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn color="primary" text small v-bind="attrs" v-on="on">
                <v-icon>add_circle</v-icon>
              </v-btn>
            </template>
            <span>Use version {{ item.version }} as the base</span>
          </v-tooltip>
        </router-link>
      </template>
      <template #[`item.export`]="{ item }">
        <router-link
          :to="{
            name: 'FormDesigner',
            query: { f: item.formId, v: item.id },
          }"
        >
          <v-btn color="primary" text small>
            <v-icon>get_app</v-icon>
          </v-btn>
        </router-link>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { FormPermissions } from '@/utils/constants';

export default {
  name: 'ManageVersions',
  data() {
    return {
      headers: [
        { text: 'Version', align: 'start', value: 'version' },
        { text: 'Date Published', align: 'start', value: 'createdAt' },
        {
          text: 'Create a New Version',
          align: 'center',
          value: 'create',
          filterable: false,
          sortable: false,
        },
        {
          text: 'Export',
          align: 'center',
          value: 'export',
          filterable: false,
          sortable: false,
        },
      ],
    };
  },
  computed: {
    ...mapGetters('form', ['form', 'permissions']),
    canCreateDesign() {
      return this.permissions.includes(FormPermissions.DESIGN_CREATE);
    },
    versionList() {
      return this.form ? this.form.versions : [];
    },
  },
};
</script>

<style scoped>
/* Todo, this is duplicated in a few tables, extract to style */
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
