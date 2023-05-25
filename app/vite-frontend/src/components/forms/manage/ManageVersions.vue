<script setup>
import { storeToRefs } from 'pinia';
import { computed, inject, ref } from 'vue';

import BaseDialog from '~/components/base/BaseDialog.vue';
import getRouter from '~/router';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { formService } from '~/services';
import { FormPermissions } from '~/utils/constants';

const fd = inject('fd');
const draftId = inject('draftId');
const formId = inject('formId');

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const headers = ref([
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
]);
const formSchema = ref({
  display: 'form',
  type: 'form',
  components: [],
});
const publishOpts = ref({
  publishing: true,
  version: '',
  id: '',
});
const showHasDraftsDialog = ref(false);
const showPublishDialog = ref(false);
const showDeleteDraftDialog = ref(false);
const rerenderTable = ref(0);

const { drafts, form, permissions } = storeToRefs(formStore);

const hasDraft = computed(() => drafts?.value?.length > 0);
const hasVersions = computed(() => form?.versions?.length);
const versionList = computed(() => {
  if (hasDraft.value) {
    // reformat draft object and then join with versions array
    const reDraft = drafts.value.map((obj, idx) => {
      obj.published = false;
      obj.version = form.value.versions.length + drafts.value.length - idx;
      obj.isDraft = true;
      delete obj.formVersionId;
      delete obj.schema;

      return obj;
    });
    const merged = reDraft.concat(form.value.versions);
    return form.value ? merged : [];
  } else {
    return form.value ? form.value.versions : [];
  }
});
const canPublish = computed(() =>
  permissions.value.includes(FormPermissions.FORM_UPDATE)
);

function createVersion(formId, versionId) {
  if (hasDraft.value) {
    showHasDraftsDialog.value = true;
  } else {
    getRouter().push({
      name: 'FormDesigner',
      query: { f: formId, v: versionId, newVersion: true },
    });
  }
}

function cancelPublish() {
  showPublishDialog.value = false;
  document.documentElement.style.overflow = 'auto';
  if (draftId.value) {
    getRouter()
      .replace({
        name: 'FormDesigner',
        query: {
          f: formId.value,
          d: draftId.value,
          saved: true,
        },
      })
      .catch(() => {});
  }

  rerenderTable.value += 1;
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
        document.documentElement.style.overflow = 'hidden';
        showPublishDialog.value = true;
      }
    }
  }
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

async function deleteCurrentDraft() {
  showDeleteDraftDialog.value = false;
  await formStore.deleteDraft({
    formId: form.value.id,
    draftId: drafts.value[0].id,
  });
  formStore.fetchDrafts(form.value.id);
}

async function onExportClick(id, isDraft) {
  await getFormSchema(id, isDraft);
  let snek = form.value.snake;
  if (!form.value.snake) {
    snek = form.value.name
      .replace(/\s+/g, '_')
      .replace(/[^-_0-9a-z]/gi, '')
      .toLowerCase();
  }

  const a = document.createElement('a');
  a.href = `data:application/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(formSchema.value)
  )}`;
  a.download = `${snek}_schema.json`;
  a.style.display = 'none';
  a.classList.add('hiddenDownloadTextElement');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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

if (fd) {
  turnOnPublish();
}
</script>

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
          :label="item.raw.published ? 'Published' : 'Unpublished'"
          :disabled="!canPublish"
          @update:modelValue="
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
                variant="text"
                @click="onExportClick(item.raw.id, item.raw.isDraft)"
              >
                <v-icon icon="mdi:mdi-download"></v-icon>
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
                  variant="text"
                  @click="createVersion(item.raw.formId, item.raw.id)"
                >
                  <v-icon icon="mdi:mdi-plus"></v-icon>
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
                  variant="text"
                  @click="showDeleteDraftDialog = true"
                >
                  <v-icon icon="mdi:mdi-delete"></v-icon>
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
