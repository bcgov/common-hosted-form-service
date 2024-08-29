<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  fetchDocumentTemplates,
  getDocumentTemplate,
  readFile,
} from '~/composables/documentTemplate';
import { useFormStore } from '~/store/form';
import { formService } from '~/services';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

let cdogsTemplate = ref(null);
const documentTemplates = ref([]);
const enablePreview = ref(false);
const fileInput = ref(null);
const headers = ref([
  { title: 'File Name', key: 'filename' },
  { title: 'Date Created', key: 'createdAt' },
  { title: 'Actions', key: 'actions', align: 'end' },
]);
const loading = ref(true);
const isFileInputEmpty = ref(true);
const isValidFile = ref(true);
const isValidSize = ref(true);
const techdocsLinkTemplateUpload = ref(
  'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/CDOGS-Template-Upload/'
);
let uploadedFile = null; // File uploaded into the File Input
const validFileExtensions = ['txt', 'docx', 'html', 'odt', 'pptx', 'xlsx'];

const notificationStore = useNotificationStore();

const { form, isRTL } = storeToRefs(useFormStore());

const validationRules = computed(() => [
  isValidSize.value || t('trans.documentTemplate.fileSizeError'),
  isValidFile.value || t('trans.documentTemplate.invalidFileMessage'),
]);

onMounted(async () => {
  await fetchTemplates();
});

async function fetchTemplates() {
  loading.value = true;
  try {
    documentTemplates.value = [];
    documentTemplates.value = await fetchDocumentTemplates(form.value.id);
    // disable preview for microsoft docs
    if (documentTemplates.value.length > 0) {
      // get file extension
      const fileExtension = documentTemplates.value[0].filename
        .split('.')
        .pop();
      if (
        fileExtension === 'docx' ||
        fileExtension === 'pptx' ||
        fileExtension === 'xlsx' ||
        fileExtension === 'odt'
      ) {
        enablePreview.value = false;
      } else {
        enablePreview.value = true;
      }
    }
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.documentTemplate.fetchError'),
      consoleError: t('trans.documentTemplate.fetchError', {
        error: e.message,
      }),
    });
  } finally {
    loading.value = false;
  }
}

function handleFileInput(event) {
  if (event && event.length > 0) {
    isFileInputEmpty.value = false;
    uploadedFile = event[0];

    // validate file size
    if (uploadedFile.size > 25000000) {
      isValidSize.value = false;
    } else {
      isValidSize.value = true;
    }

    // validate file extension
    const fileExtension = event[0].name.split('.').pop();
    if (validFileExtensions.includes(fileExtension)) {
      isValidFile.value = true;
    } else {
      isValidFile.value = false;
    }
  } else {
    isFileInputEmpty.value = true;
    isValidFile.value = true;
    isValidSize.value = true;
  }
}

async function handleFileUpload() {
  loading.value = true;
  const fileContentAsBase64 = await readFile(uploadedFile);
  const data = {
    filename: uploadedFile.name,
    template: fileContentAsBase64,
  };
  try {
    const result = await formService.documentTemplateCreate(
      form.value.id,
      data
    );
    cdogsTemplate.value = result.data;

    await fetchTemplates();

    // Reset the file input
    if (fileInput.value) {
      fileInput.value.reset();
    }
    notificationStore.addNotification({
      text: t('trans.documentTemplate.uploadSuccess'),
      ...NotificationTypes.SUCCESS,
    });
  } catch (e) {
    if (e.response.status === 413) {
      notificationStore.addNotification({
        text: t('trans.documentTemplate.fileSizeError'),
        consoleError: t('trans.documentTemplate.fileSizeError', {
          error: e.message,
        }),
      });
    } else {
      notificationStore.addNotification({
        text: t('trans.documentTemplate.uploadError'),
        consoleError: t('trans.documentTemplate.uploadError', {
          error: e.message,
        }),
      });
    }
  } finally {
    loading.value = false;
  }
}

async function handleDelete(item) {
  loading.value = true;
  try {
    await formService.documentTemplateDelete(form.value.id, item.templateId);
    await fetchTemplates();
    notificationStore.addNotification({
      text: t('trans.documentTemplate.deleteSuccess'),
      ...NotificationTypes.SUCCESS,
    });
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.documentTemplate.deleteError'),
      consoleError: t('trans.documentTemplate.deleteError', {
        error: e.message,
      }),
    });
  } finally {
    loading.value = false;
  }
}

async function handleFileAction(item, action) {
  loading.value = true;
  try {
    const url = await getDocumentTemplate(
      form.value.id,
      item.templateId,
      item.filename
    );

    if (action === 'preview') {
      // Open the file in a new tab
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
    } else if (action === 'download') {
      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    }
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.documentTemplate.fetchError'),
      consoleError: t('trans.documentTemplate.fetchError', {
        error: e.message,
      }),
    });
  } finally {
    loading.value = false;
  }
}

defineExpose({
  cdogsTemplate,
  enablePreview,
  fileInput,
  handleDelete,
  handleFileAction,
  handleFileInput,
  isFileInputEmpty,
  isValidFile,
  isValidSize,
  uploadedFile,
});
</script>

<template>
  <div>
    <span style="display: inline-block" class="mt-2">
      <div style="display: inline-flex; align-items: center">
        {{ $t('trans.documentTemplate.info') }}
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-icon
              color="primary"
              class="ml-2"
              :class="{ 'mr-2': isRTL }"
              v-bind="props"
              icon="mdi:mdi-help-circle-outline"
            ></v-icon>
          </template>
          <span>
            <a
              :href="techdocsLinkTemplateUpload"
              class="preview_info_link_field_white"
              target="_blank"
              :lang="locale"
            >
              {{ $t('trans.formSettings.learnMore') }}
              <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline"></v-icon>
            </a>
          </span>
        </v-tooltip>
      </div>
    </span>

    <v-data-table-server
      class="submissions-table mt-2"
      :headers="headers"
      :loading="loading"
      :items="documentTemplates"
      :items-length="documentTemplates.length"
    >
      <!-- Created date  -->
      <template #item.createdAt="{ item }">
        {{ $filters.formatDateLong(item.createdAt) }}
      </template>

      <!-- Preview/Download File -->
      <template #item.filename="{ item }">
        <span v-if="!enablePreview">{{ item.filename }}</span>
        <v-tooltip v-if="enablePreview" location="bottom">
          <template #activator="{ props }">
            <a
              href="#"
              v-bind="props"
              @click="handleFileAction(item, 'preview')"
            >
              {{ item.filename }}
            </a>
          </template>
          <span :lang="locale">
            {{ $t('trans.manageVersions.clickToPreview') }}
            <v-icon icon="mdi:mdi-open-in-new"></v-icon>
          </span>
        </v-tooltip>
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <div class="icon-container">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                v-bind="props"
                class="action-icon"
                @click="handleFileAction(item, 'download')"
              >
                mdi-download
              </v-icon>
            </template>
            <span>{{ $t('trans.documentTemplate.download') }}</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon
                color="red"
                v-bind="props"
                class="action-icon"
                @click="handleDelete(item)"
              >
                mdi-minus-circle
              </v-icon>
            </template>
            <span>{{ $t('trans.documentTemplate.delete') }}</span>
          </v-tooltip>
        </div>
      </template>

      <!-- Empty footer, remove if allowing multiple templates -->
      <template #bottom></template>
    </v-data-table-server>
    <div class="mt-10 mb-3" :class="isRTL ? 'mr-4' : 'ml-4'">
      <span style="font-weight: 550">
        {{ $t('trans.documentTemplate.uploadTemplate') }}
      </span>
    </div>
    <v-file-input
      ref="fileInput"
      class="mb-2"
      :class="[{ label: isRTL }]"
      :style="isRTL ? { gap: '10px' } : null"
      counter
      :clearable="true"
      show-size
      :lang="locale"
      prepend-icon="false"
      :disabled="documentTemplates.length >= 1"
      :rules="validationRules"
      @update:model-value="handleFileInput($event)"
    >
      <template #label>
        {{ $t('trans.documentTemplate.uploadTemplateFile') }}
      </template>
    </v-file-input>
    <v-btn
      :disabled="
        !isValidFile ||
        !isValidSize ||
        isFileInputEmpty ||
        documentTemplates.length >= 1
      "
      color="primary"
      :title="$t('trans.documentTemplate.upload')"
      @click="handleFileUpload"
    >
      <span :lang="locale">{{ $t('trans.documentTemplate.upload') }}</span>
    </v-btn>
  </div>
</template>

<style scoped>
.action-icon:not(:last-child) {
  margin-right: 20px;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

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
