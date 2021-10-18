<template>
  <div>
    <v-data-table
      :key="rerenderTable"
      class="submissions-table"
      :headers="headers"
      :items="versionList"
    >
      <!-- Version  -->
      <template #[`item.version`]="{ item }">
        <router-link
          :to="
            item.isDraft
              ? { name: 'FormPreview', query: { f: item.formId, d: item.id } }
              : { name: 'FormPreview', query: { f: item.formId, v: item.id } }
          "
          class="mx-5"
          target="_blank"
        >
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <span v-bind="attrs" v-on="on">
                Version {{ item.version }}
                <v-chip
                  v-if="item.isDraft"
                  color="secondary"
                  class="mb-5 px-1"
                  x-small
                  text-color="black"
                >
                  Draft
                </v-chip>
              </span>
            </template>
            <span>
              Click to preview
              <v-icon>open_in_new</v-icon>
            </span>
          </v-tooltip>
        </router-link>
      </template>

      <!-- Status  -->

      <template #[`item.status`]="{ item }">
        <label>{{ item.published ? 'Published' : 'Unpublished' }}</label>
      </template>

      <!-- Created date  -->
      <template #[`item.createdAt`]="{ item }">
        {{ item.createdAt | formatDateLong }}
      </template>

      <!-- Created by  -->
      <template #[`item.createdBy`]="{ item }">
        {{ item.createdBy }}
      </template>

      <!-- Updated at  -->
      <template #[`item.updatedAt`]="{ item }">
        {{ item.updatedAt | formatDateLong }}
      </template>

      <!-- id  -->
      <template #[`item.id`]="{ item }">
        {{ item.id }}
      </template>

      <!-- form id  -->
      <template #[`item.formId`]="{ item }">
        {{ item.formId }}
      </template>

      <!-- Actions -->
      <template #[`item.action`]="{ item }">
        <!-- Edit draft version -->
        <span v-if="item.isDraft">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link
                :to="{
                  name: 'FormDesigner',
                  query: { d: item.id, f: item.formId },
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
            <span>Edit Version</span>
          </v-tooltip>
        </span>

        <!-- export -->
        <span>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                color="primary"
                class="mx-1"
                icon
                @click="onExportClick(item.id, item.isDraft)"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>get_app</v-icon>
              </v-btn>
            </template>
            <span>Export Design</span>
          </v-tooltip>
        </span>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { formService } from '@/services';

export default {
  name: 'ManageVersions',
  data() {
    return {
      headers: [
        { text: 'Versions', align: 'start', value: 'version' },
        { text: 'Status', align: 'start', value: 'status' },
        { text: 'Created By', align: 'start', value: 'createdBy' },
        { text: 'Date Created', align: 'start', value: 'createdAt' },
        { text: 'Last Updated', align: 'start', value: 'updatedAt' },
        { text: 'ID', align: 'start', value: 'id' },
        { text: 'Form ID', align: 'start', value: 'formId' },
        {
          text: 'Actions',
          align: 'end',
          value: 'action',
          filterable: false,
          sortable: false,
          width: 100,
        },
      ],
      formSchema: {
        display: 'form',
        type: 'form',
        components: [],
      },
      publishOpts: {
        publishing: true,
        version: '',
        id: '',
      },
      showHasDraftsDialog: false,
      showPublishDialog: false,
      showDeleteDraftDialog: false,
      rerenderTable: 0,
    };
  },
  computed: {
    ...mapGetters('form', ['drafts']),
    ...mapGetters('admin', ['form']),
    hasDraft() {
      return this.drafts && this.drafts.length > 0;
    },
    versionList() {
      if (this.hasDraft) {
        // reformat draft object and then join with versions array
        const reDraft = this.drafts.map((obj) => {
          obj.published = false;
          obj.version = this.form.versions.length + 1;
          obj.isDraft = true;
          delete obj.formVersionId;
          delete obj.schema;

          return obj;
        });
        const merged = reDraft.concat(this.form.versions);
        return this.form ? merged : [];
      } else {
        return this.form ? this.form.versions : [];
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('form', [
      'fetchForm',
      'fetchDrafts',
      'publishDraft',
      'deleteDraft',
      'toggleVersionPublish',
    ]),
    ...mapActions('admin', ['readForm', 'restoreForm']),

    // -----------------------------------------------------------------------------------------------------
    // Publish/unpublish actions
    // -----------------------------------------------------------------------------------------------------
    cancelPublish() {
      this.showPublishDialog = false;
      // To get the toggle back to original state
      this.rerenderTable += 1;
    },
    async updatePublish() {
      this.showPublishDialog = false;
      // if publishing a draft version
      if (this.publishOpts.isDraft) {
        await this.publishDraft({
          formId: this.form.id,
          draftId: this.publishOpts.id,
        });
        // Refresh draft in form version list
        this.fetchDrafts(this.form.id);
      }
      // else, we toggle status of a version
      else {
        await this.toggleVersionPublish({
          formId: this.form.id,
          versionId: this.publishOpts.id,
          publish: this.publishOpts.publishing,
        });
      }
      // Refresh form version list
      this.fetchForm(this.form.id);
    },
    // ----------------------------------------------------------------------/ Publish/unpublish actions

    async onExportClick(id, isDraft) {
      await this.getFormSchema(id, isDraft);
      let snek = this.form.snake;
      if (!this.form.snake) {
        snek = this.form.name
          .replace(/\s+/g, '_')
          .replace(/[^-_0-9a-z]/gi, '')
          .toLowerCase();
      }

      const a = document.createElement('a');
      a.href = `data:application/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(this.formSchema)
      )}`;
      a.download = `${snek}_schema.json`;
      a.style.display = 'none';
      a.classList.add('hiddenDownloadTextElement');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },

    async getFormSchema(id, isDraft = false) {
      try {
        let res = !isDraft
          ? await formService.readVersion(this.form.id, id)
          : await formService.readDraft(this.form.id, id);
        this.formSchema = { ...this.formSchema, ...res.data.schema };
      } catch (error) {
        this.addNotification({
          message: 'An error occurred while loading the form design.',
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
