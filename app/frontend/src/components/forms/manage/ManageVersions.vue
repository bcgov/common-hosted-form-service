<script>
import { mapActions, mapState } from 'pinia';

import BaseDialog from '~/components/base/BaseDialog.vue';
import BaseInfoCard from '~/components/base/BaseInfoCard.vue';
import { i18n } from '~/internationalization';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { formService } from '~/services';
import { FormPermissions } from '~/utils/constants';

export default {
  components: {
    BaseDialog,
    BaseInfoCard,
  },
  inject: ['formDesigner', 'draftId', 'formId'],
  data() {
    return {
      headers: [
        {
          title: i18n.t('trans.manageVersions.version'),
          align: 'start',
          key: 'version',
        },
        {
          title: i18n.t('trans.manageVersions.status'),
          align: 'start',
          key: 'status',
        },
        {
          title: i18n.t('trans.manageVersions.dateCreated'),
          align: 'start',
          key: 'createdAt',
        },
        {
          title: i18n.t('trans.manageVersions.createdBy'),
          align: 'start',
          key: 'createdBy',
        },
        {
          title: i18n.t('trans.manageVersions.actions'),
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
    ...mapState(useFormStore, [
      'drafts',
      'form',
      'permissions',
      'isRTL',
      'lang',
    ]),
    hasDraft() {
      return this.drafts?.length > 0;
    },
    hasVersions() {
      return this.form?.versions?.length;
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
  async created() {
    if (this.formDesigner) {
      await this.turnOnPublish();
    }
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    ...mapActions(useFormStore, [
      'deleteDraft',
      'fetchDrafts',
      'fetchForm',
      'publishDraft',
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
      }

      if (this.hasDraft) {
        const idx = this.drafts.map((d) => d.id).indexOf(this.publishOpts.id);
        this.drafts[idx].published = !this.drafts[idx].published;
      } else {
        const idx = this.form.versions
          .map((d) => d.id)
          .indexOf(this.publishOpts.id);
        this.form.versions[idx].published = !this.form.versions[idx].published;
      }

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
          text: 'An error occurred while loading the form design.',
          consoleError: `Error loading form ${this.form.id} schema (version / draft: ${id}): ${error}`,
        });
      }
    },
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <BaseInfoCard class="my-4">
      <h4 class="text-primary" :lang="lang">
        <v-icon
          :class="isRTL ? 'ml-1' : 'mr-1'"
          color="primary"
          icon="mdi:mdi-information"
        ></v-icon
        >{{ $t('trans.manageVersions.important') }}!
      </h4>
      <p :lang="lang">{{ $t('trans.manageVersions.infoA') }}</p>
    </BaseInfoCard>

    <div class="mt-8 mb-5" :lang="lang">
      <v-icon
        :class="isRTL ? 'ml-1' : 'mr-1'"
        color="primary"
        icon="mdi:mdi-information"
      ></v-icon
      >{{ $t('trans.manageVersions.infoB') }}
    </div>
    <v-data-table
      :key="rerenderTable"
      hover
      class="submissions-table"
      :headers="headers"
      :items="versionList"
    >
      <!-- Version  -->
      <template #item.version="{ item }">
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
              <span v-bind="props" :lang="lang">
                {{ $t('trans.manageVersions.version') }} {{ item.raw.version }}
                <v-chip
                  v-if="item.raw.isDraft"
                  color="secondary"
                  class="mb-5 px-1"
                  x-small
                  :lang="lang"
                >
                  {{ $t('trans.manageVersions.draft') }}
                </v-chip>
              </span>
            </template>
            <span :lang="lang">
              {{ $t('trans.manageVersions.clickToPreview') }}
              <v-icon icon="mdi:mdi-open-in-new"></v-icon>
            </span>
          </v-tooltip>
        </router-link>
      </template>

      <!-- Status  -->
      <template #item.status="{ item }">
        <v-switch
          v-model="item.raw.published"
          data-cy="formPublishedSwitch"
          color="success"
          :disabled="!canPublish"
          :class="{ 'dir-ltl': isRTL }"
          @update:modelValue="
            togglePublish(
              $event,
              item.raw.id,
              item.raw.version,
              item.raw.isDraft
            )
          "
        >
          <template #label>
            <span :class="{ 'mr-2': isRTL }" :lang="lang">
              {{
                item.raw.published
                  ? $t('trans.manageVersions.published')
                  : $t('trans.manageVersions.unpublished')
              }}</span
            >
          </template>
        </v-switch>
      </template>

      <!-- Created date  -->
      <template #item.createdAt="{ item }">
        {{ $filters.formatDateLong(item.raw.createdAt) }}
      </template>

      <!-- Created by  -->
      <template #item.createdBy="{ item }">
        {{ item.raw.createdBy }}
      </template>

      <!-- Actions -->
      <template #item.action="{ item }">
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
                <v-btn
                  color="primary"
                  class="mx-1"
                  icon
                  v-bind="props"
                  variant="text"
                >
                  <v-icon icon="mdi:mdi-pencil"></v-icon>
                </v-btn>
              </router-link>
            </template>
            <span :lang="lang">{{
              $t('trans.manageVersions.editVersion')
            }}</span>
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
                variant="text"
                @click="onExportClick(item.raw.id, item.raw.isDraft)"
              >
                <v-icon icon="mdi:mdi-download"></v-icon>
              </v-btn>
            </template>
            <span :lang="lang">{{
              $t('trans.manageVersions.exportDesign')
            }}</span>
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
                  variant="text"
                  @click="createVersion(item.raw.formId, item.raw.id)"
                >
                  <v-icon icon="mdi:mdi-plus"></v-icon>
                </v-btn>
              </span>
            </template>
            <span v-if="hasDraft" :lang="lang">
              {{ $t('trans.manageVersions.infoC') }}
            </span>
            <span v-else :lang="lang">
              {{
                $t('trans.manageVersions.useVersionInfo', {
                  version: item.raw.version,
                })
              }}
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
                  variant="text"
                  @click="showDeleteDraftDialog = true"
                >
                  <v-icon icon="mdi:mdi-delete"></v-icon>
                </v-btn>
              </span>
            </template>
            <span :lang="lang">{{
              $t('trans.manageVersions.deleteVersion')
            }}</span>
          </v-tooltip>
        </span>
      </template>
    </v-data-table>

    <BaseDialog
      v-model="showHasDraftsDialog"
      type="OK"
      @close-dialog="showHasDraftsDialog = false"
    >
      <template #title
        ><span :lang="lang">{{
          $t('trans.manageVersions.draftAlreadyExists')
        }}</span></template
      >
      <template #text>
        <span :lang="lang">
          {{ $t('trans.manageVersions.infoD') }}
        </span>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="showPublishDialog"
      type="CONTINUE"
      @continue-dialog="updatePublish"
      @close-dialog="cancelPublish"
    >
      <template #title>
        <span v-if="publishOpts.publishing" :lang="lang">
          {{ $t('trans.manageVersions.publishVersion') }}
          {{ publishOpts.version }}
        </span>
        <span v-else :lang="lang">
          {{ $t('trans.manageVersions.unpublishVersion') }}
          {{ publishOpts.version }}</span
        >
      </template>
      <template #text>
        <span v-if="publishOpts.publishing" :lang="lang">
          {{
            $t('trans.manageVersions.useVersionInfo', {
              version: publishOpts.version,
            })
          }}
        </span>
        <span v-else :lang="lang">
          {{ $t('trans.manageVersions.infoE') }}
        </span>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="showDeleteDraftDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDraftDialog = false"
      @continue-dialog="deleteCurrentDraft"
    >
      <template #title
        ><span :lang="lang">{{
          $t('trans.manageVersions.confirmDeletion')
        }}</span>
      </template>
      <template #text
        ><span :lang="lang">{{
          $t('trans.manageVersions.infoF')
        }}</span></template
      >
      <template #button-text-continue>
        <span :lang="lang">{{ $t('trans.manageVersions.delete') }}</span>
      </template>
    </BaseDialog>
  </div>
</template>

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
.submissions-table :deep(thead) tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
