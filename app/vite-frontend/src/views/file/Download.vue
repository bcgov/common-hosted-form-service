<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

import BaseSecure from '~/components/base/BaseSecure.vue';
import { useFormStore } from '~/store/form';
import { IdentityProviders } from '~/utils/constants';

const properties = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const formStore = useFormStore();

const { downloadedFile } = storeToRefs(formStore);

const showDownloadLink = ref(false);

const IDP = computed(() => IdentityProviders);

onMounted(() => {
  getFile(properties.id);
});

function getDisposition(disposition) {
  if (disposition && disposition.indexOf('attachment') !== -1) {
    let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    let matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      disposition = matches[1].replace(/['"]/g, '');
    }
  }
  return disposition;
}

async function getFile(fileId) {
  showDownloadLink.value = false;
  await formStore.downloadFile(fileId);
  if (
    downloadedFile.value &&
    downloadedFile.value.data &&
    downloadedFile.value.headers
  ) {
    showDownloadLink.value = true;
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
    document.body.removeChild(a);
  }
}
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <v-container fluid class="center_vertical_content">
      <h1>CHEFS Data Export</h1>
      <v-progress-circular
        v-if="!showDownloadLink"
        :size="50"
        color="primary"
        indeterminate
      ></v-progress-circular>
      <div v-if="!showDownloadLink">Preparing for download...</div>
      <div v-if="showDownloadLink" class="mt-5 center_vertical_content">
        <v-icon class="mb-2" size="90">file_download</v-icon><br />
        If your file does not automatically download
        <a href="#" @click="getFile(id)">click here to try again</a>
      </div>
    </v-container>
  </BaseSecure>
</template>
