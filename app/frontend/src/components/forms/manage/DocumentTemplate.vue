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
        await formService.documentTemplateDelete(
          this.form.id,
          item.raw.templateId
        );
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
    async handleFilePreview(item) {
      this.loading = true;
      try {
        const result = await formService.documentTemplateRead(
          this.form.id,
          item.raw.templateId
        );
        const chars = result.data.template.data
          .map((byte) => String.fromCharCode(byte))
          .join('');
        const decodedString = atob(chars);
        const decodedBytes = new Uint8Array(
          new TextEncoder().encode(decodedString)
        );

        // Function to determine the MIME type based on file extension
        const getMimeType = (filename) => {
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
        };

        const mimeType = getMimeType(item.raw.filename);
        const blob = new Blob([decodedBytes], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        // Create an anchor element and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = item.raw.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove(); // Clean up
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
  },
};
</script>

<template>
  <div>
    <v-data-table-server
      class="submissions-table mt-3"
      :headers="headers"
      :loading="loading"
      :items="documentTemplates"
    >
      <!-- Created date  -->
      <template #item.createdAt="{ item }">
        {{ $filters.formatDateLong(item.raw.createdAt) }}
      </template>

      <!-- Preview/Download File -->
      <template #item.filename="{ item }">
        <a href="#" @click="handleFilePreview(item)">
          {{ item.raw.filename }}
        </a>
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-icon color="red" v-bind="props" @click="handleDelete(item)">
              mdi-minus-circle
            </v-icon>
          </template>
          <span>{{ $t('trans.documentTemplate.delete') }}</span>
        </v-tooltip>
      </template>

      <!-- Empty footer, remove if allowing multiple templates -->
      <template #bottom></template>
    </v-data-table-server>
    <div class="mt-10 mb-3">
      <span style="font-weight: 550; color: #003366">
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
      prepend-icon=""
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
