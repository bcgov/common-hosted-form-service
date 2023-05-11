<template>
  <div>
    <BaseInfoCard class="my-4">
      <h4 class="text-primary">
        <v-icon class="mr-1" color="primary">info</v-icon>IMPORTANT!
      </h4>
      <p>
        If there are no published versions, users are unable to access this form
        until there is a published version assigned. Once a version is
        published, that version is no longer editable. You must create a new
        version based on one of the previous form versions to continue editing.
      </p>
    </BaseInfoCard>

    <div class="mt-8 mb-5">
      <v-icon class="mr-1" color="primary">info</v-icon>Note: Only one version
      can be published.
    </div>
    <v-data-table
      :key="rerenderTable"
      class="submissions-table"
      :headers="headers"
      :items="versionList"
    >
      <!-- Version  -->
      <template v-slot:item.version="{ item }">
        <router-link
          :to="
            item.raw.isDraft
              ? {
                  name: 'FormPreview',
                  query: { f: item.raw.formId, d: item.raw.id },
                }
              : {
                  name: 'FormPreview',
                  query: { f: item.raw.formId, v: item.raw.id },
                }
          "
          class="mx-5"
          target="_blank"
        >
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <span v-bind="props">
                Version {{ item.version }}
                <v-chip
                  v-if="item.raw.isDraft"
                  color="secondary"
                  class="mb-5 px-1"
                  x-small
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
      <template v-slot:item.status="{ item }">
        <v-switch
          data-cy="formPublishedSwitch"
          color="success"
          :model-value="item.raw.published"
          :label="item.raw.published ? 'Published' : 'Unpublished'"
          :disabled="!canPublish"
          @update:change="
            togglePublish(
              $event,
              item.raw.id,
              item.raw.version,
              item.raw.isDraft
            )
          "
        />
      </template>

      <!-- Created date  -->
      <template v-slot:item.createdAt="{ item }">
        {{ $filters.formatDateLong(item.raw.createdAt) }}
      </template>

      <!-- Created by  -->
      <template v-slot:item.createdBy="{ item }">
        {{ item.raw.createdBy }}
      </template>

      <!-- Actions -->
      <template v-slot:item.action="{ item }">
        <!-- Edit draft version -->
        <span v-if="item.raw.isDraft">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <router-link
                :to="{
                  name: 'FormDesigner',
                  query: { d: item.raw.id, f: item.raw.formId, nf: false },
                }"
              >
                <v-btn color="primary" class="mx-1" icon v-bind="props">
                  <v-icon>edit</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>Edit Version</span>
          </v-tooltip>
        </span>

        <!-- export -->
        <span>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                class="mx-1"
                icon
                v-bind="props"
                @click="onExportClick(item.raw.id, item.raw.isDraft)"
              >
                <v-icon>get_app</v-icon>
              </v-btn>
            </template>
            <span>Export Design</span>
          </v-tooltip>
        </span>

        <!-- create new version -->
        <span v-if="!item.raw.isDraft">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <span v-bind="props">
                <v-btn
                  color="primary"
                  class="mx-1"
                  :disabled="hasDraft"
                  icon
                  @click="createVersion(item.raw.formId, item.raw.id)"
                >
                  <v-icon>add</v-icon>
                </v-btn>
              </span>
            </template>
            <span v-if="hasDraft">
              Please publish or delete your latest draft version before starting
              a new version.
            </span>
            <span v-else>
              Use version {{ item.raw.version }} as the base for a new version
            </span>
          </v-tooltip>
        </span>

        <!-- delete draft version -->
        <span v-else>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <span v-bind="props">
                <v-btn
                  color="red"
                  class="mx-1"
                  :disabled="!hasVersions"
                  icon
                  @click="showDeleteDraftDialog = true"
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </span>
            </template>
            <span>Delete Version</span>
          </v-tooltip>
        </span>
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
      type="CONTINUE"
      @continue-dialog="updatePublish"
      @close-dialog="cancelPublish"
    >
      <template #title>
        <span v-if="publishOpts.publishing">
          Publish Version {{ publishOpts.version }}
        </span>
        <span v-else>Unpublish Version {{ publishOpts.version }}</span>
      </template>
      <template #text>
        <span v-if="publishOpts.publishing">
          This will make Version {{ publishOpts.version }} of your form live.
        </span>
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
import { formService } from '@src/services';
import { FormPermissions } from '@src/utils/constants';

export default {
  name: 'ManageVersions',
  inject: ['fd', 'draftId', 'formId'],
  data() {
    return {
      headers: [
        { title: 'Version', align: 'start', key: 'version' },
        { title: 'Status', align: 'start', key: 'status' },
        { title: 'Date Created', align: 'start', key: 'createdAt' },
        { title: 'Created By', align: 'start', key: 'createdBy' },
        {
          title: 'Actions',
          align: 'end',
          key: 'action',
          filterable: false,
          sortable: false,
          width: 200,
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
    hasVersions() {
      return this.form && this.form.versions && this.form.versions.length;
    },
    versionList() {
      if (this.hasDraft) {
        // reformat draft object and then join with versions array
        const reDraft = this.drafts.map((obj, idx) => {
          obj.published = false;
          obj.version = this.form.versions.length + this.drafts.length - idx;
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
    canPublish() {
      return this.permissions.includes(FormPermissions.FORM_UPDATE);
    },
  },
  created() {
    //check if the navigation to this page is from FormDesigner
    if (this.fd) {
      this.turnOnPublish();
    }
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
    createVersion(formId, versionId) {
      if (this.hasDraft) {
        this.showHasDraftsDialog = true;
      } else {
        this.$router.push({
          name: 'FormDesigner',
          query: { f: formId, v: versionId, newVersion: true },
        });
      }
    },

    // -----------------------------------------------------------------------------------------------------
    // Publish/unpublish actions
    // -----------------------------------------------------------------------------------------------------
    cancelPublish() {
      this.showPublishDialog = false;
      document.documentElement.style.overflow = 'auto';
      if (this.draftId) {
        this.$router
          .replace({
            name: 'FormDesigner',
            query: {
              f: this.formId,
              d: this.draftId,
              saved: true,
            },
          })
          .catch(() => {});
        return;
      }
      // To get the toggle back to original state
      this.rerenderTable += 1;
    },
    togglePublish(value, id, version, isDraft) {
      this.publishOpts = {
        publishing: value,
        version: version,
        id: id,
        isDraft: isDraft,
      };
      this.showPublishDialog = true;
    },
    turnOnPublish() {
      if (this.versionList) {
        for (const item of this.versionList) {
          if (item.id === this.draftId) {
            this.publishOpts = {
              publishing: true,
              version: item.version,
              id: item.id,
              isDraft: item.isDraft,
            };
            document.documentElement.style.overflow = 'hidden';
            this.showPublishDialog = true;
          }
        }
      }
    },
    async updatePublish() {
      this.showPublishDialog = false;
      document.documentElement.style.overflow = 'auto';
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

    async deleteCurrentDraft() {
      this.showDeleteDraftDialog = false;
      await this.deleteDraft({
        formId: this.form.id,
        draftId: this.drafts[0].id,
      });
      this.fetchDrafts(this.form.id);
    },

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
