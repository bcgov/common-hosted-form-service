<script>
import { mapState, mapWritableState } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { formService } from '~/services';

export default {
  components: {
    BasePanel,
  },
  emits: ['update:fileUploaded', 'update:fileUploadedToBackend'],
  data() {
    return {
      showDropbox: false, // dropbox to upload the template file if no active template in the backend
      showTable: false, // table to display if the form has an active template in the backend
      showUploadButton: false, // upload button enabled after the form is published
      cdogsTemplate: null, // the cdogs template retrieved from the backend
      uploadedFile: null, // the file uploaded by the user
      showAsterisk: true, // red asterisk to indicate required field
      validFileExtension: true, // to validate file extension
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
    ...mapWritableState(useFormStore, ['form']),
  },
  mounted() {
    if (this.form.id) {
      if (this.isTemplateAttached(this.form.id)) {
        this.showTable = true;
      } else {
        this.showDropbox = true;
        this.showUploadButton = true;
      }
    } else {
      this.showDropbox = true;
    }
    if (this.cdogsTemplate) {
      this.$emit('update:fileUploaded', true);
    } else {
      // else should never be triggered
      this.$emit('update:fileUploaded', false);
    }
  },
  methods: {
    emitFileUploaded(event) {
      if (event.length > 0) {
        this.$emit('update:fileUploaded', true);
        const fileExtension = event[0].name.split('.').pop();
        if (
          fileExtension === 'txt' ||
          fileExtension === 'docx' ||
          fileExtension === 'html' ||
          fileExtension === 'odt' ||
          fileExtension === 'pptx' ||
          fileExtension === 'xlsx'
        ) {
          this.validFileExtension = true;
        } else {
          this.validFileExtension = false;
        }
        this.showAsterisk = false;
      } else {
        this.$emit('update:fileUploaded', false);
        this.showAsterisk = true;
        this.validFileExtension = true;
      }
    },
    writeFileToStore(event) {
      this.uploadedFile = event.target.files[0];
      if (!this.uploadedFile) return;
      useFormStore().setTemplateFile(this.uploadedFile);
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
      if (result) {
        this.showDropbox = false;
        this.showUploadButton = false;
        this.showTable = true;
        this.cdogsTemplate = result.data;
        this.$emit('update:fileUploadedToBackend', true);
      }
    },
    async handleDelete() {
      await formService.documentTemplateDelete(
        this.form.id,
        this.cdogsTemplate.id
      );
      this.showDropbox = true;
      this.showUploadButton = true;
      this.showTable = false;
      this.cdogsTemplate = null;
      this.showAsterisk = true;
      this.$emit('update:fileUploadedToBackend', false);
    },
    async isTemplateAttached(formId) {
      const response = await formService.documentTemplateList(formId);
      if (response.data.length > 0) {
        this.cdogsTemplate = response.data[0];
        this.showTable = true;
        this.$emit('update:fileUploaded', true);
        this.$emit('update:fileUploadedToBackend', true);
        return true;
      } else {
        this.showTable = false;
        this.showDropbox = true;
        this.showUploadButton = true;
        this.$emit('update:fileUploaded', false);
        return false;
      }
    },
  },
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.formSettings.cDogsTemplate')
      }}</span></template
    >
    <v-file-input
      v-if="showDropbox"
      :class="[{ label: isRTL }]"
      :style="isRTL ? { gap: '10px' } : null"
      counter
      :clearable="true"
      required="true"
      mandatory
      show-size
      :lang="lang"
      @change="writeFileToStore($event)"
      @update:model-value="emitFileUploaded($event)"
    >
      <template #label>
        <span v-if="showAsterisk" style="color: red; font-weight: bold">
          * </span
        >{{ $t('trans.printOptions.uploadTemplateFile') }}
      </template>
    </v-file-input>
    <span
      v-if="showDropbox && !validFileExtension"
      :class="isRTL ? 'mr-10' : 'ml-10'"
      style="color: red; display: inline-block"
      >The template must use one of the following extentions: .txt, .docx,
      .html, .odt, .pptx, .xlsx</span
    >
    <v-btn
      v-if="showUploadButton"
      :disabled="showAsterisk"
      color="primary"
      class="mt-5"
      @click="handleFileUpload"
    >
      {{ $t('trans.printOptions.upload') }}
    </v-btn>

    <v-table
      v-if="showTable"
      style="color: gray; border: 1px solid lightgray; border-radius: 8px"
      class="mb-5 mt-3 mx-10"
    >
      <thead>
        <tr>
          <th class="text-left">
            {{ $t('trans.formSettings.filename') }}
          </th>
          <th class="text-left">
            {{ $t('trans.formSettings.uploadDate') }}
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td v-if="cdogsTemplate">{{ cdogsTemplate.filename }}</td>
          <td v-if="cdogsTemplate">
            {{ cdogsTemplate.createdAt.split('T')[0] }}
          </td>
          <td>
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon color="red" v-bind="props" @click="handleDelete">
                  mdi-delete-outline
                </v-icon>
              </template>
              <span>{{ $t('trans.formSettings.delete') }}</span>
            </v-tooltip>
          </td>
        </tr>
      </tbody>
    </v-table>
  </BasePanel>
</template>
