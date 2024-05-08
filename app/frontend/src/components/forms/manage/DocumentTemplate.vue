<script>
import { mapState, mapWritableState, mapActions } from 'pinia';
import { useFormStore } from '~/store/form';
import { formService } from '~/services';
import { i18n } from '~/internationalization';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

export default {
  data() {
    return {
      loading: false,
      validFileExtensions: ['txt', 'docx', 'html', 'odt', 'pptx', 'xlsx'],
      isValidFile: true,
      isFileInputEmpty: true,
      uploadedFile: null, // File uploaded into the File Input
      cdogsTemplate: null, // File content as base64 (retrieved from backend)
      headers: [
        { title: 'File Name', key: 'filename' },
        { title: 'Date Created', key: 'createdAt' },
        { title: 'Actions', key: 'actions', align: 'end' },
      ],
      documentTemplates: [],
      enablePreview: false,
      techdocsLinkTemplateUpload:
        'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Functionalities/CDOGS-Template-Upload/',
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
    ...mapWritableState(useFormStore, ['form']),
    validationRules() {
      return [
        this.isValidFile || i18n.t('trans.documentTemplate.invalidFileMessage'),
      ];
    },
  },
  mounted() {
    this.fetchDocumentTemplates();
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    async fetchDocumentTemplates() {
      this.loading = true;
      try {
        const result = await formService.documentTemplateList(this.form.id);
        // Clear existing templates before adding new ones
        this.documentTemplates = [];

        // Iterate through each document in the result
        result.data.forEach((doc) => {
          this.documentTemplates.push({
            filename: doc.filename,
            createdAt: doc.createdAt,
            templateId: doc.id,
            actions: '',
          });
        });
        // disable preview for microsoft docs
        if (this.documentTemplates.length > 0) {
          // get file extension
          const fileExtension = this.documentTemplates[0].filename
            .split('.')
            .pop();
          if (
            fileExtension === 'docx' ||
            fileExtension === 'pptx' ||
            fileExtension === 'xlsx' ||
            fileExtension === 'odt'
          ) {
            this.enablePreview = false;
          } else {
            this.enablePreview = true;
          }
        }
      } catch (e) {
        this.addNotification({
          text: i18n.t('trans.documentTemplate.fetchError'),
          consoleError: i18n.t('trans.documentTemplate.fetchError', {
            error: e.message,
          }),
        });
      } finally {
        this.loading = false;
      }
    },

    handleFileInput(event) {
      if (event && event.length > 0) {
        this.isFileInputEmpty = false;
        this.uploadedFile = event[0];
        const fileExtension = event[0].name.split('.').pop();
        if (this.validFileExtensions.includes(fileExtension)) {
          this.isValidFile = true;
        } else {
          this.isValidFile = false;
        }
      } else {
        this.isFileInputEmpty = true;
        this.isValidFile = true;
      }
    },
    async handleFileUpload() {
      this.loading = true;
      const fileContentAsBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(this.uploadedFile);
        reader.onload = () => {
          // Strip the Data URL scheme part (everything up to, and including, the comma)
          const base64Content = reader.result.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = (error) => {
          reject(error);
        };
      });
      const data = {
        filename: this.uploadedFile.name,
        template: fileContentAsBase64,
      };
      try {
        const result = await formService.documentTemplateCreate(
          this.form.id,
          data
        );
        this.cdogsTemplate = result.data;
        this.fetchDocumentTemplates();

        // Reset the file input
        if (this.$refs.fileInput) {
          this.$refs.fileInput.reset();
        }
        this.addNotification({
          text: i18n.t('trans.documentTemplate.uploadSuccess'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (e) {
        this.addNotification({
          text: i18n.t('trans.documentTemplate.uploadError'),
          consoleError: i18n.t('trans.documentTemplate.uploadError', {
            error: e.message,
          }),
        });
      } finally {
        this.loading = false;
      }
    },
    async handleDelete(item) {
      this.loading = true;
      try {
        await formService.documentTemplateDelete(this.form.id, item.templateId);
        this.fetchDocumentTemplates();
        this.addNotification({
          text: i18n.t('trans.documentTemplate.deleteSuccess'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (e) {
        this.addNotification({
          text: i18n.t('trans.documentTemplate.deleteError'),
          consoleError: i18n.t('trans.documentTemplate.deleteError', {
            error: e.message,
          }),
        });
      } finally {
        this.loading = false;
      }
    },
    async handleFileAction(item, action) {
      this.loading = true;
      try {
        const result = await formService.documentTemplateRead(
          this.form.id,
          item.templateId
        );
        const base64EncodedData = result.data.template.data
          .map((byte) => String.fromCharCode(byte))
          .join('');
        // Decode the base64 string to binary data
        const binaryString = atob(base64EncodedData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: this.getMimeType(item.filename),
        });
        const url = window.URL.createObjectURL(blob);

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
        this.addNotification({
          text: i18n.t('trans.documentTemplate.fetchError'),
          consoleError: i18n.t('trans.documentTemplate.fetchError', {
            error: e.message,
          }),
        });
      } finally {
        this.loading = false;
      }
    },
    getMimeType(filename) {
      const extension = filename.slice(filename.lastIndexOf('.') + 1);
      const mimeTypes = {
        txt: 'text/plain',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        html: 'text/html',
        odt: 'application/vnd.oasis.opendocument.text',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      return mimeTypes[extension];
    },
  },
};
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
              :hreflang="lang"
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
          <span :lang="lang">
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
      :lang="lang"
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
        !isValidFile || isFileInputEmpty || documentTemplates.length >= 1
      "
      color="primary"
      @click="handleFileUpload"
    >
      <span :lang="lang">{{ $t('trans.documentTemplate.upload') }}</span>
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
