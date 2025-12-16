<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';

import { createDownload } from '~/composables/printOptions';
import { formService, utilsService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';
import { getDisposition, splitFileName } from '~/utils/transformUtils';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  submissionId: {
    type: String,
    default: '',
  },
  submission: {
    type: Object,
    default: undefined,
  },
  f: {
    type: String,
    default: '',
  },
  printConfig: {
    type: Object,
    required: true,
  },
});

const loading = ref(false);

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { isRTL, form } = storeToRefs(formStore);

const formId = computed(() => (properties.f ? properties.f : form.value.id));

function createBody(content, contentFileType, outputFileName, outputFileType) {
  return {
    options: {
      reportName: outputFileName,
      convertTo: outputFileType,
      overwrite: true,
    },
    template: {
      content: content,
      encodingType: 'base64',
      fileType: contentFileType,
    },
  };
}

async function generateDirectPrint() {
  try {
    loading.value = true;

    // Fetch the configured template
    const templateResponse = await formService.documentTemplateRead(
      formId.value,
      properties.printConfig.templateId
    );

    // Extract template content
    const temp = templateResponse.data.template.data;
    const base64String = temp.map((code) => String.fromCharCode(code)).join('');

    // Get template filename and extension
    const { name, extension } = splitFileName(templateResponse.data.filename);
    const outputFileType = properties.printConfig.outputFileType || 'pdf';

    // Create the request body
    const body = createBody(base64String, extension, name, outputFileType);

    // Generate document
    let response = null;
    if (properties.submissionId?.length > 0) {
      response = await formService.docGen(properties.submissionId, body);
    } else {
      const draftData = {
        template: body,
        submission: properties.submission,
      };
      response = await utilsService.draftDocGen(draftData);
    }

    // Create file to download
    const filename = getDisposition(response.headers['content-disposition']);

    const blob = new Blob([response.data], {
      type: 'attachment',
    });

    // Generate Temporary Download Link
    createDownload(blob, filename);
    notificationStore.addNotification({
      text: t('trans.printOptions.docGrnSucess'),
      ...NotificationTypes.SUCCESS,
    });
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.printOptions.failedDocGenErrMsg'),
      consoleError: t('trans.printOptions.failedDocGenErrMsg', {
        error: e.message,
      }),
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <span :class="{ 'dir-rtl': isRTL }">
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          class="mx-1"
          color="primary"
          v-bind="props"
          size="x-small"
          density="default"
          icon="mdi:mdi-printer"
          :title="$t('trans.printOptions.print')"
          :loading="loading"
          :disabled="loading"
          @click="generateDirectPrint"
        />
      </template>
      <span :lang="locale">{{ $t('trans.printOptions.print') }}</span>
    </v-tooltip>
  </span>
</template>
