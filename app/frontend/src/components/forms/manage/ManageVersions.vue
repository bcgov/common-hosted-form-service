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
            <span>
              Use version {{ item.version }} as the base for a new version
            </span>
          </v-tooltip>
        </router-link>
      </template>
      <template #[`item.export`]="{ item }">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              color="primary"
              text
              small
              @click="exportSchema(item.id)"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>get_app</v-icon>
            </v-btn>
          </template>
          <span> Download version {{ item.version }} to a file </span>
        </v-tooltip>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { FormPermissions } from '@/utils/constants';
import formService from '@/services/formService.js';

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
  methods: {
    ...mapActions('notifications', ['addNotification']),
    async exportSchema(versionId) {
      try {
        const ver = await formService.readVersion(this.form.id, versionId);
        if (ver && ver.data) {
          const a = document.createElement('a');
          a.href = `data:application/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(ver.data.schema)
          )}`;
          a.download = `${this.form.snake}_schema.json`;
          a.style.display = 'none';
          a.classList.add('hiddenDownloadTextElement');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          throw new Error('No data in response from readVersion call');
        }
      } catch (error) {
        this.addNotification({
          message:
            'An error occurred while attempting to export the design for this version.',
          consoleError: `Error export schema for ${this.form.id} version ${versionId}: ${error}`,
        });
      }
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
