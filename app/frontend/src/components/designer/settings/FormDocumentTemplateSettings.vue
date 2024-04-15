<script>
import { mapState, mapWritableState } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { formService } from '~/services';

export default {
  components: {
    BasePanel,
  },
  data() {
    return {
      showDropbox: false,
      showTemplate: false,
      showUploadButton: false,
      template: null,
      uploadedFile: null,
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang', 'isFormPublished']),
    ...mapWritableState(useFormStore, ['form']),
  },
  mounted() {
    this.$emit('update:fileUploaded', false);
    if (!this.isFormPublished) {
      this.showDropbox = true;
    } else {
      if (this.isTemplateAttached(this.form.id)) {
        this.showTemplate = true;
      } else {
        this.showDropbox = true;
        this.showUploadButton = true;
      }
    }
  },
  beforeUnmount() {
    this.$emit('update:fileUploaded', true);
  },
  methods: {
    emitFileUploaded(event) {
      if (event.length > 0) {
        this.$emit('update:fileUploaded', true);
      } else {
        this.$emit('update:fileUploaded', false);
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
        this.showTemplate = true;
        this.template = result.data;
      }
    },
    async handleDelete() {
      await formService.documentTemplateDelete(this.form.id, this.template.id);
      this.showDropbox = true;
      this.showUploadButton = true;
      this.showTemplate = false;
    },
    async isTemplateAttached(formId) {
      const response = await formService.documentTemplateList(formId);
      if (response.data.length > 0) {
        this.template = response.data[0];
        return true;
      } else {
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
      :label="$t('trans.printOptions.uploadTemplateFile')"
      required="true"
      mandatory
      show-size
      :lang="lang"
      @change="writeFileToStore($event)"
      @update:model-value="emitFileUploaded($event)"
    />
    <v-btn
      v-if="showUploadButton"
      color="primary"
      class="mt-5"
      @click="handleFileUpload"
    >
      Upload
    </v-btn>

    <v-table
      v-if="showTemplate"
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
          <td>{{ template.filename }}</td>
          <td>{{ template.createdAt.split('T')[0] }}</td>
          <td>
            <v-tooltip location="bottom">
              <template #activator="{ props }">
                <v-icon
                  color="red"
                  v-bind="props"
                  v-on="on"
                  @click="handleDelete"
                >
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
