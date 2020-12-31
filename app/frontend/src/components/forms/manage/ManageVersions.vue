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

      <!-- Status  -->
      <template #[`item.status`]="{ item }">
        <v-switch
          color="success"
          value
          :input-value="item.published"
          :label="item.published ? 'Published' : 'Unpublished'"
          @change="togglePublish($event, item.id)"
        />
      </template>

      <!-- Update date  -->
      <template #[`item.updatedAt`]="{ item }">
        {{ item.updatedAt | formatDateLong }}
        - {{ item.updatedBy }}
      </template>

      <!-- Create new version  -->
      <template #[`item.create`]="{ item }">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <div v-bind="attrs" v-on="on">
              <v-btn
                :disabled="hasDraft"
                color="primary"
                text
                small
                @click="createVersion(item.formId, item.id)"
              >
                <v-icon>add_circle</v-icon>
              </v-btn>
            </div>
          </template>
          <span v-if="hasDraft">
            Please edit, publish or delete the existing draft before starting a
            new draft.
          </span>
          <span v-else>
            Use version {{ item.version }} as the base for a new version
          </span>
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
        Please edit, publish or delete the existing draft before starting a new
        draft.
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="showPublishDialog"
      type="OK"
      @close-dialog="showPublishDialog = false"
    >
      <template #title>Draft already exists</template>
      <template #text>
        Please edit, publish or delete the existing draft before starting a new
        draft.
      </template>
    </BaseDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import { FormPermissions } from '@/utils/constants';
import CurrentDraft from '@/components/forms/manage/CurrentDraft.vue';

export default {
  name: 'ManageVersions',
  components: { CurrentDraft },
  data() {
    return {
      headers: [
        { text: 'Version', align: 'start', value: 'version' },
        { text: 'Status', align: 'start', value: 'status' },
        { text: 'Last Update', align: 'start', value: 'updatedAt' },
        {
          text: 'Create a New Version',
          align: 'center',
          value: 'create',
          filterable: false,
          sortable: false,
        },
      ],
      showHasDraftsDialog: false,
      showPublishDialog: false,
    };
  },
  computed: {
    ...mapGetters('form', ['drafts', 'form', 'permissions']),
    canCreateDesign() {
      return this.permissions.includes(FormPermissions.DESIGN_CREATE);
    },
    hasDraft() {
      return this.drafts && this.drafts.length > 0;
    },
    versionList() {
      return this.form ? this.form.versions : [];
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('form', ['fetchForm', 'toggleVersionPublish']),
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
    async togglePublish(value, versionId) {
      await this.toggleVersionPublish({
        formId: this.form.id,
        versionId: versionId,
        publish: value,
      });
      // Refresh form version list
      this.fetchForm(this.form.id);
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
