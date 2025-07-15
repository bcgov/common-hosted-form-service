<script setup>
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import BaseDialog from '~/components/base/BaseDialog.vue';
import BaseInfoCard from '~/components/base/BaseInfoCard.vue';
import { exportFormSchema } from '~/composables/form';
import { formService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const router = useRouter();

const formDesigner = inject('formDesigner');
const draftId = inject('draftId');

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { drafts, form, permissions, isRTL } = storeToRefs(formStore);

const headers = ref([
  {
    title: t('trans.manageVersions.version'),
    align: 'start',
    key: 'version',
  },
  {
    title: t('trans.manageVersions.status'),
    align: 'start',
    key: 'status',
  },
  {
    title: t('trans.manageVersions.dateCreated'),
    align: 'start',
    key: 'createdAt',
  },
  {
    title: t('trans.manageVersions.createdBy'),
    align: 'start',
    key: 'createdBy',
  },
  {
    title: t('trans.manageVersions.actions'),
    align: 'end',
    key: 'action',
    filterable: false,
    sortable: false,
    width: 200,
  },
]);

const rerenderTable = ref(0);
const showDeleteDraftDialog = ref(false);
const showHasDraftsDialog = ref(false);
const showPublishDialog = ref(false);

let formSchema = ref({
  display: 'form',
  type: 'form',
  components: [],
});

const publishOpts = ref({
  publishing: true,
  version: '',
  id: '',
});

const hasDraft = computed(() => drafts.value?.length > 0);
const hasVersions = computed(() => form.value?.versions?.length);
const versionList = computed(() => {
  if (hasDraft.value) {
    // If there are existing drafts
    const formattedDrafts = drafts.value.map((draft, idx) => {
      draft.version = form.value.versions.length + drafts.value.length - idx;
      draft.published = draft.published ? draft.published : false;
      draft.isDraft = true;
      delete draft.formVersionId;
      return draft;
    });
    return formattedDrafts.concat(form.value.versions);
  } else {
    return form.value ? form.value.versions : [];
  }
});
const canPublish = computed(() =>
  permissions.value.includes(FormPermissions.FORM_UPDATE)
);

async function deleteCurrentDraft() {
  showDeleteDraftDialog.value = false;
  await formStore.deleteDraft({
    formId: form.value.id,
    draftId: drafts.value[0].id,
  });
  await formStore.fetchDrafts(form.value.id);
}

async function onExportClick(formVersionId, isDraft) {
  await getFormSchema(formVersionId, isDraft);
  exportFormSchema(form.value.name, formSchema.value, form.value.snake);
}

async function getFormSchema(id, isDraft = false) {
  try {
    let res = !isDraft
      ? await formService.readVersion(form.value.id, id)
      : await formService.readDraft(form.value.id, id);
    formSchema.value = { ...formSchema.value, ...res.data.schema };
  } catch (error) {
    notificationStore.addNotification({
      text: 'An error occurred while loading the form design.',
      consoleError: `Error loading form ${form.value.id} schema (version / draft: ${id}): ${error}`,
    });
  }
}

function createVersion(formId, versionId) {
  if (hasDraft.value) {
    showHasDraftsDialog.value = true;
  } else {
    router.push({
      name: 'FormDesigner',
      query: { f: formId, v: versionId, newVersion: true },
    });
  }
}

function cancelPublish() {
  showPublishDialog.value = false;
  document.documentElement.style.overflow = 'auto';
  if (hasDraft.value) {
    const idx = drafts.value.map((d) => d.id).indexOf(publishOpts.value.id);
    if (idx !== -1) {
      drafts.value[idx].published = !drafts.value[idx].published;
    }
  }
  if (form.value.versions) {
    const idx = form.value.versions
      .map((d) => d.id)
      .indexOf(publishOpts.value.id);
    if (idx !== -1) {
      form.value.versions[idx].published = !form.value.versions[idx].published;
    }
  }
  rerenderTable.value += 1;
}

async function updatePublish() {
  showPublishDialog.value = false;
  document.documentElement.style.overflow = 'auto';
  // if publishing a draft version
  if (publishOpts.value.isDraft) {
    await formStore.publishDraft({
      formId: form.value.id,
      draftId: publishOpts.value.id,
    });
    // Refresh draft in form version list
    formStore.fetchDrafts(form.value.id);
  }
  // else, we toggle status of a version
  else {
    await formStore.toggleVersionPublish({
      formId: form.value.id,
      versionId: publishOpts.value.id,
      publish: publishOpts.value.publishing,
    });
  }
  // Refresh form version list
  formStore.fetchForm(form.value.id);
}

function togglePublish(value, id, version, isDraft) {
  publishOpts.value = {
    publishing: value,
    version: version,
    id: id,
    isDraft: isDraft,
  };
  showPublishDialog.value = true;
}

function turnOnPublish() {
  if (versionList.value) {
    for (const item of versionList.value) {
      if (item.id === draftId) {
        publishOpts.value = {
          publishing: true,
          version: item.version,
          id: item.id,
          isDraft: item.isDraft,
        };
        // toggle switch state in data table
        const idx = drafts.value.map((d) => d.id).indexOf(item.id);
        if (idx !== -1) {
          drafts.value[idx].published = true;
        }
        document.documentElement.style.overflow = 'hidden';
        showPublishDialog.value = true;
      }
    }
  }
}

onMounted(() => {
  if (formDesigner) {
    turnOnPublish();
  }
});

defineExpose({
  createVersion,
  deleteCurrentDraft,
  formSchema,
  onExportClick,
  publishOpts,
  rerenderTable,
  showDeleteDraftDialog,
  showHasDraftsDialog,
  showPublishDialog,
  togglePublish,
  updatePublish,
  versionList,
});
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <BaseInfoCard class="my-4">
      <h4 class="text-primary" :lang="locale">
        <v-icon
          :class="isRTL ? 'ml-1' : 'mr-1'"
          color="primary"
          icon="mdi:mdi-information"
        ></v-icon
        >{{ $t('trans.manageVersions.important') }}!
      </h4>
      <p :lang="locale">{{ $t('trans.manageVersions.infoA') }}</p>
    </BaseInfoCard>

    <div class="mt-8 mb-5" :lang="locale">
      <v-icon
        :class="isRTL ? 'ml-1' : 'mr-1'"
        color="primary"
        icon="mdi:mdi-information"
      ></v-icon
      >{{ $t('trans.manageVersions.infoB') }}
    </div>

    <!-- Actions -->
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
            item.isDraft
              ? {
                  name: 'FormPreview',
                  query: { f: item.formId, d: item.id },
                }
              : {
                  name: 'FormPreview',
                  query: { f: item.formId, v: item.id },
                }
          "
          class="mx-5"
          target="_blank"
        >
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <span v-bind="props" :lang="locale">
                {{ $t('trans.manageVersions.version') }} {{ item.version }}
                <v-chip
                  v-if="item.isDraft"
                  color="secondary"
                  class="mb-5 px-1"
                  x-small
                  :lang="locale"
                >
                  {{ $t('trans.manageVersions.draft') }}
                </v-chip>
              </span>
            </template>
            <span :lang="locale">
              {{ $t('trans.manageVersions.clickToPreview') }}
              <v-icon icon="mdi:mdi-open-in-new"></v-icon>
            </span>
          </v-tooltip>
        </router-link>
      </template>

      <!-- Status  -->
      <template #item.status="{ item }">
        <v-switch
          v-model="item.published"
          data-cy="formPublishedSwitch"
          color="success"
          :disabled="!canPublish"
          :class="{ 'dir-ltl': isRTL }"
          @update:modelValue="
            togglePublish($event, item.id, item.version, item.isDraft)
          "
        >
          <template #label>
            <span :class="{ 'mr-2': isRTL }" :lang="locale">
              {{
                item.published
                  ? $t('trans.manageVersions.published')
                  : $t('trans.manageVersions.unpublished')
              }}</span
            >
          </template>
        </v-switch>
      </template>

      <!-- Created date  -->
      <template #item.createdAt="{ item }">
        {{ $filters.formatDateLong(item.createdAt) }}
      </template>

      <!-- Created by  -->
      <template #item.createdBy="{ item }">
        {{ item.createdBy }}
      </template>

      <template #item.action="{ item }">
        <!-- Edit draft version -->
        <span v-if="item.isDraft">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <router-link
                :to="{
                  name: 'FormDesigner',
                  query: { d: item.id, f: item.formId, nf: false },
                }"
              >
                <v-btn
                  color="primary"
                  class="mx-1"
                  icon
                  v-bind="props"
                  variant="text"
                  :title="$t('trans.manageVersions.editVersion')"
                >
                  <v-icon icon="mdi:mdi-pencil"></v-icon>
                </v-btn>
              </router-link>
            </template>
            <span :lang="locale">{{
              $t('trans.manageVersions.editVersion')
            }}</span>
          </v-tooltip>
        </span>

        <!-- Export version -->
        <span>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                class="mx-1"
                icon
                v-bind="props"
                variant="text"
                :title="$t('trans.manageVersions.exportDesign')"
                @click="onExportClick(item.id, item.isDraft)"
              >
                <v-icon icon="mdi:mdi-download"></v-icon>
              </v-btn>
            </template>
            <span :lang="locale">{{
              $t('trans.manageVersions.exportDesign')
            }}</span>
          </v-tooltip>
        </span>

        <!-- Create draft from version -->
        <span v-if="!item.isDraft">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <span v-bind="props">
                <v-btn
                  color="primary"
                  class="mx-1"
                  :disabled="hasDraft"
                  icon
                  variant="text"
                  :title="
                    hasDraft
                      ? $t('trans.manageVersions.infoC')
                      : $t('trans.manageVersions.useVersionInfo', {
                          version: item.version,
                        })
                  "
                  @click="createVersion(item.formId, item.id)"
                >
                  <v-icon icon="mdi:mdi-plus"></v-icon>
                </v-btn>
              </span>
            </template>
            <span v-if="hasDraft" :lang="locale">
              {{ $t('trans.manageVersions.infoC') }}
            </span>
            <span v-else :lang="locale">
              {{
                $t('trans.manageVersions.useVersionInfo', {
                  version: item.version,
                })
              }}
            </span>
          </v-tooltip>
        </span>

        <!-- Delete version -->
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
                  :title="$t('trans.manageVersions.deleteVersion')"
                  @click="showDeleteDraftDialog = true"
                >
                  <v-icon icon="mdi:mdi-delete"></v-icon>
                </v-btn>
              </span>
            </template>
            <span :lang="locale">{{
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
        ><span :lang="locale">{{
          $t('trans.manageVersions.draftAlreadyExists')
        }}</span></template
      >
      <template #text>
        <span :lang="locale">
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
        <span v-if="publishOpts.publishing" :lang="locale">
          {{ $t('trans.manageVersions.publishVersion') }}
          {{ publishOpts.version }}
        </span>
        <span v-else :lang="locale">
          {{ $t('trans.manageVersions.unpublishVersion') }}
          {{ publishOpts.version }}</span
        >
      </template>
      <template #text>
        <span v-if="publishOpts.publishing" :lang="locale">
          {{
            $t('trans.manageVersions.useVersionInfo', {
              version: publishOpts.version,
            })
          }}
        </span>
        <span v-else :lang="locale">
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
        ><span :lang="locale">{{
          $t('trans.manageVersions.confirmDeletion')
        }}</span>
      </template>
      <template #text
        ><span :lang="locale">{{
          $t('trans.manageVersions.infoF')
        }}</span></template
      >
      <template #button-text-continue>
        <span :lang="locale">{{ $t('trans.manageVersions.delete') }}</span>
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
