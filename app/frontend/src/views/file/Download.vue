<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { getDisposition } from '~/utils/transformUtils';
import { AppPermissions } from '~/utils/constants';

const { locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const formStore = useFormStore();

const { downloadedFile } = storeToRefs(formStore);
let downloadTimeout = null;

// Set the downloadedFile to a null value on creation
downloadedFile.value = null;

const APP_PERMS = computed(() => AppPermissions);
const isFileDownloaded = computed(
  () => downloadedFile.value && downloadedFile.value.headers
);

async function getFile(fileId) {
  await formStore.downloadFile(fileId);
  if (downloadedFile.value && downloadedFile.value.headers) {
    const data = downloadedFile.value.headers['content-type'].includes(
      'application/json'
    )
      ? JSON.stringify(downloadedFile.value.data)
      : downloadedFile.value.data;
    const blob = new Blob([data], {
      type: downloadedFile.value.headers['content-type'],
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getDisposition(
      downloadedFile.value.headers['content-disposition']
    );
    a.style.display = 'none';
    a.classList.add('hiddenDownloadTextElement');
    document.body.appendChild(a);
    a.click();
    downloadTimeout = setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  }
}

onMounted(async () => {
  await getFile(properties.id);
});

onUnmounted(() => {
  clearTimeout(downloadTimeout);
});
</script>

<template>
  <BaseSecure :permission="APP_PERMS.VIEWS_FILE_DOWNLOAD">
    <v-container fluid class="center_vertical_content">
      <h1 :lang="locale">{{ $t('trans.download.chefsDataExport') }}</h1>
      <v-progress-circular
        v-if="!isFileDownloaded"
        :size="50"
        color="primary"
        indeterminate
      ></v-progress-circular>
      <div v-if="!isFileDownloaded" :lang="locale">
        {{ $t('trans.download.preparingForDownloading') }}
      </div>
      <div
        v-if="isFileDownloaded"
        class="mt-5 center_vertical_content"
        :lang="locale"
      >
        <v-icon class="mb-2" size="90" icon="mdi:mdi-file-download" /><br />
        If your file does not automatically download
        <a href="#" :lang="locale" @click="getFile(id)">{{
          $t('trans.download.downloadInfoB')
        }}</a>
      </div>
    </v-container>
  </BaseSecure>
</template>
