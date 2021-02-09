<template>
  <div>
    <BaseInfoCard class="my-4">
      <h4 class="primary--text">
        <v-icon class="mr-1" color="primary">info</v-icon>IMPORTANT!
      </h4>
      <p>If there are no published versions, users are unable to access this form until there
        is a published version assigned. Once a version is published, that version is no longer editable. You must create a new version based on one of the previous form versions to continue editing.</p>
    </BaseInfoCard>

    <div class="mt-8 mb-5">
      <v-icon class="mr-1" color="primary">info</v-icon>Note: Only one version can be published.
    </div>
    <v-data-table
      :key="rerenderTable"
      class="submissions-table"
      :headers="headers"
      :items="versionList"
    >
      <!-- Version  -->
      <template #[`item.version`]="{ item }">
        <router-link
          :to=" item.isDraft ? { name: 'FormPreview', query: { f: item.formId, d: item.id } } : { name: 'FormPreview', query: { f: item.formId, v: item.id } }"
          class="mx-5"
          target="_blank"
        >
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <span v-bind="attrs" v-on="on">
                Version {{ item.version }}
                <v-chip
                  v-if="item.isDraft"
                  class="mb-5 px-1"
                  x-small
                  color="secondary"
                  text-color="black"
                >Draft</v-chip>
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
        <v-switch
          color="success"
          value
          :input-value="item.published"
          :label="item.published ? 'Published' : 'Unpublished'"
          @change="togglePublish($event, item.id, item.version, item.isDraft)"
        />
      </template>

      <!-- Update date  -->
      <template #[`item.updatedAt`]="{ item }">
        {{ item.updatedAt | formatDateLong }}
        - {{ item.updatedBy ? item.updatedBy : item.createdBy }}
      </template>

      <!-- Edit draft version -->
      <template #[`item.edit`]="{ item }">
        <div v-if="item.isDraft" class="a1">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on">
                <router-link
                  :to="{
                    name: 'FormDesigner',
                    query: { d: item.id, f: item.formId },
                  }"
                >
                  <v-btn color="primary" text small>
                    <v-icon>edit</v-icon>
                  </v-btn>
                </router-link>
              </div>
            </template>
            <span>Edit Version</span>
          </v-tooltip>
        </div>
      </template>

      <!-- export -->
      <template #[`item.export`]="{ item }">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <div v-bind="attrs" v-on="on">
              <v-btn color="primary" text small @click="onExportClick(item.id, item.isDraft)">
                <v-icon>get_app</v-icon>
              </v-btn>
            </div>
          </template>
          <span>Export Design</span>
        </v-tooltip>
      </template>

      <template #[`item.action`]="{ item }">
        <!-- create new version -->
        <div v-if="!item.isDraft">
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
                  <v-icon>add</v-icon>
                </v-btn>
              </div>
            </template>
            <span v-if="hasDraft">
              Please publish or delete your latest draft version before starting a
              new version.
            </span>
            <span v-else>Use version {{ item.version }} as the base for a new version</span>
          </v-tooltip>
        </div>

        <!-- delete draft version -->
        <div v-if="item.isDraft">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                class="mx-1"
                color="red"
                @click="showDeleteDraftDialog = true"
                icon
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>delete</v-icon>
              </v-btn>
            </template>
            <span>Delete Version</span>
          </v-tooltip>
        </div>
      </template>
    </v-data-table>

    <BaseDialog v-model="showHasDraftsDialog" type="OK" @close-dialog="showHasDraftsDialog = false">
      <template #title>Draft already exists</template>
      <template #text>
        Please edit, publish or delete the existing draft before starting a new
        draft.
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="showPublishDialog"
      type="CONTINUE"
      @continue-dialog="updatePublish"
      @close-dialog="cancelPublish"
    >
      <template #title>
        <span v-if="publishOpts.publishing">Publish Version {{ publishOpts.version }}</span>
        <span v-else>Unpublish Version {{ publishOpts.version }}</span>
      </template>
      <template #text>
        <span
          v-if="publishOpts.publishing"
        >This will set Version {{ publishOpts.version }} to the live form.</span>
        <span v-else>
          Unpublishing this form will take the form out of circulation until a
          version is published again.
        </span>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="showDeleteDraftDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDraftDialog = false"
      @continue-dialog="deleteCurrentDraft"
    >
      <template #title>Confirm Deletion</template>
      <template #text>Are you sure you wish to delete this Version?</template>
      <template #button-text-continue>
        <span>Delete</span>
      </template>
    </BaseDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import { formService } from '@/services';
import { FormPermissions } from '@/utils/constants';

export default {
  name: 'ManageVersions',
  data() {
    return {
      headers: [
        { text: 'Version', align: 'start', value: 'version' },
        { text: 'Status', align: 'start', value: 'status' },
        { text: 'Last Update', align: 'start', value: 'updatedAt' },
        {
          text: 'Actions',
          align: 'center',
          value: 'edit',
          filterable: false,
          sortable: false,
        },
        {
          text: '',
          value: 'export',
          filterable: false,
          sortable: false,
        },
        {
          text: '',
          value: 'action',
          filterable: false,
          sortable: false,
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
    ...mapGetters('form', ['drafts', 'form', 'permissions']),
    canCreateDesign() {
      return this.permissions.includes(FormPermissions.DESIGN_CREATE);
    },
    hasDraft() {
      return this.drafts && this.drafts.length > 0;
    },
    versionList() {
      if(this.hasDraft) {
        // reformat draft object and then join with versions array
        const reDraft = this.drafts.map(obj => {
          obj.published = false;
          obj.version = this.form.versions.length + 1;
          obj.isDraft = true;
          delete obj.formVersionId;
          delete obj.schema;

          return obj;
        });
        const merged = reDraft.concat(this.form.versions);
        return this.form ? merged : [];
      }
      else {
        return this.form ? this.form.versions : [];
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('form', ['fetchForm', 'fetchDrafts', 'publishDraft', 'deleteDraft', 'toggleVersionPublish']),
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

    // -----------------------------------------------------------------------------------------------------
    // Publish/unpublish actions
    // -----------------------------------------------------------------------------------------------------
    cancelPublish() {
      this.showPublishDialog = false;
      // To get the toggle back to original state
      this.rerenderTable += 1;
    },
    togglePublish(value, id, version, isDraft) {
      this.publishOpts = {
        publishing: value,
        version: version,
        id: id,
        isDraft: isDraft
      };
      this.showPublishDialog = true;
    },
    async updatePublish() {
      this.showPublishDialog = false;
      // if publishing a draft version
      if(this.publishOpts.isDraft){
        await this.publishDraft({
          formId: this.form.id,
          draftId: this.publishOpts.id
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

    async deleteCurrentDraft() {
      this.showDeleteDraftDialog = false;
      await this.deleteDraft({ formId: this.form.id, draftId: this.drafts[0].id });
      this.fetchDrafts(this.form.id);
    },

    onExportClick(id, isDraft) {
      let snek = this.form.snake;
      if (!this.form.snake) {
        snek = this.form.name
          .replace(/\s+/g, '_')
          .replace(/[^-_0-9a-z]/gi, '')
          .toLowerCase();
      }

      this.getFormSchema(id, isDraft);

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
        let res = (!isDraft ) ? await formService.readVersion(this.form.id, id) : await formService.readDraft(this.form.id, id);
        this.formSchema = { ...this.formSchema, ...res.data.schema };
      } catch (error) {
        this.addNotification({
          message: 'An error occurred while loading the form design.',
          consoleError: `Error loading form ${this.form.id} schema (version / draft: ${id}): ${error}`,
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
.submissions-table
  >>> td:not(.v-data-table__mobile-row):nth-last-child(-n + 3) {
  padding: 0;
}
</style>
