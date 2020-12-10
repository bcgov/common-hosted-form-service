<template>
  <div>
    <BaseInfoCard class="my-4">
      When you create a form, it becomes a Draft. Once you publish this form,
      you are no longer able to edit it, instead you can create a new version
      and edit from there. A new version of the form will carry the existing
      version that you created. If you unpublish the form, the submitter won't
      be able to access the form.
    </BaseInfoCard>

    <CurrentDraft v-if="hasDraft" class="my-8" />

    <strong>History</strong>
    <v-data-table
      class="submissions-table"
      :headers="headers"
      :items="versionList"
    >
      <template #no-data>
        No versions yet. Publish a draft to release a form version.
      </template>

      <!-- Version  -->
      <template #[`item.version`]="{ item }">
        <router-link
          :to="{
            name: 'FormPreview',
            query: { f: item.formId, v: item.id },
          }"
          class="mx-5"
          target="_blank"
        >
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <span v-bind="attrs" v-on="on">Version {{ item.version }}</span>
            </template>
            <span> Click to preview <v-icon>open_in_new</v-icon></span>
          </v-tooltip>
        </router-link>
      </template>

      <!-- Published date  -->
      <template #[`item.createdAt`]="{ item }">
        {{ item.createdAt | formatDateLong }}
        - {{ item.createdBy }}
      </template>

      <!-- Create new version  -->
      <template #[`item.create`]="{ item }">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              color="primary"
              text
              small
              @click="createVersion(item.formId, item.id)"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>add_circle</v-icon>
            </v-btn>
          </template>
          <span>
            Use version {{ item.version }} as the base for a new version
          </span>
        </v-tooltip>
      </template>

      <!-- Export Schema  -->
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
          <span>Download version {{ item.version }} to a file</span>
        </v-tooltip>
      </template>
    </v-data-table>

    <BaseDialog
      v-model="showHasDraftsDialog"
      type="OK"
      @close-dialog="showHasDraftsDialog = false"
    >
      <template #title>Draft already exists</template>
      <template #text>
        A Draft already exists for this form. Please edit that draft or delete
        it if you wish to start a new one.
      </template>
    </BaseDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import { FormPermissions } from '@/utils/constants';
import CurrentDraft from '@/components/forms/manage/CurrentDraft.vue';
import formService from '@/services/formService.js';

export default {
  name: 'ManageVersions',
  components: { CurrentDraft },
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
      showHasDraftsDialog: false,
    };
  },
  computed: {
    ...mapGetters('form', ['drafts', 'form', 'permissions']),
    canCreateDesign() {
      return this.permissions.includes(FormPermissions.DESIGN_CREATE);
    },
    hasDraft() {
      return this.drafts && this.drafts.length;
    },
    versionList() {
      return this.form ? this.form.versions : [];
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    createVersion(formId, versionId) {
      if (this.hasDraft) {
        this.showHasDraftsDialog = true;
      } else {
        this.$router.push({
          name: 'FormDesigner',
          query: { f: formId, v: versionId },
        });
      }
    },
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
