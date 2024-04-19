<script>
import { mapState, mapWritableState, mapActions } from 'pinia';
import { useFormStore } from '~/store/form';
import { formService } from '~/services';
import { i18n } from '~/internationalization';
import { useNotificationStore } from '~/store/notification';

export default {
  data() {
    return {
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
        this.isValidFile || i18n.t('trans.cdogsPanel.invalidFileMessage'),
      ];
    },
  },
  mounted() {
    this.fetchDocumentTemplates();
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    async fetchDocumentTemplates() {
      try {
        const result = await formService.documentTemplateList(this.form.id);
        if (result && result.data) {
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
        } else {
          this.addNotification({
            text: 'Failed to fetch document templates.',
          });
        }
      } catch (e) {
        this.addNotification({
          text: 'Failed to fetch document templates.',
          consoleError: e,
        });
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
    },
    async handleDelete(item) {
      try {
        await formService.documentTemplateDelete(
          this.form.id,
          item.raw.templateId
        );
        this.fetchDocumentTemplates();
      } catch (e) {
        this.addNotification({
          text: 'Failed to delete document template.',
          consoleError: e,
        });
      }
    },
  },
};
</script>

<template>
  <div>
    <v-data-table
      class="submissions-table mt-3"
      :headers="headers"
      :items="documentTemplates"
    >
      <!-- Created date  -->
      <template #item.createdAt="{ item }">
        {{ $filters.formatDateLong(item.raw.createdAt) }}
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-icon color="red" v-bind="props" @click="handleDelete(item)">
              mdi-minus-circle
            </v-icon>
          </template>
          <span>{{ $t('trans.cdogsPanel.delete') }}</span>
        </v-tooltip>
      </template>

      <!-- Empty footer, remove if allowing multiple templates -->
      <template #bottom></template>
    </v-data-table>
    <div class="mt-16 mb-3">
      <span style="font-weight: bold; color: #003366">
        {{ $t('trans.cdogsPanel.uploadTemplate') }}
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
        {{ $t('trans.cdogsPanel.uploadTemplateFile') }}
      </template>
    </v-file-input>
    <v-btn
      :disabled="
        !isValidFile || isFileInputEmpty || documentTemplates.length >= 1
      "
      color="primary"
      @click="handleFileUpload"
    >
      <span :lang="lang">{{ $t('trans.cdogsPanel.upload') }}</span>
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
