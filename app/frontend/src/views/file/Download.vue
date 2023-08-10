<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <v-container fluid class="center_vertical_content">
      <h1 :lang="lang">{{ $t('trans.download.chefsDataExport') }}</h1>
      <v-progress-circular
        v-if="!showDownloadLink"
        :size="50"
        color="primary"
        indeterminate
      ></v-progress-circular>
      <div v-if="!showDownloadLink" :lang="lang">
        {{ $t('trans.download.preparingForDownloading') }}
      </div>
      <div
        class="mt-5 center_vertical_content"
        v-if="showDownloadLink"
        :lang="lang"
      >
        <v-icon class="mb-2" size="90">file_download</v-icon><br />
        {{ $t('trans.download.downloadInfoA') }}
        <a href="#" @click="getFile(id)" :hreflang="lang">{{
          $t('trans.download.downloadInfoB')
        }}</a>
      </div>
    </v-container>
  </BaseSecure>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { IdentityProviders } from '@/utils/constants';
export default {
  name: 'Download',
  props: {
    id: String,
  },
  data() {
    return {
      showDownloadLink: false,
    };
  },
  computed: {
    ...mapGetters('form', ['downloadedFile', 'lang', 'isRTL']),
    IDP: () => IdentityProviders,
  },
  mounted() {
    this.getFile(this.id);
  },
  methods: {
    ...mapActions('form', ['downloadFile']),
    ...mapActions('notifications', ['addNotification']),
    // disposition retrieval from https://stackoverflow.com/a/40940790
    getDisposition(disposition) {
      if (disposition && disposition.indexOf('attachment') !== -1) {
        let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        let matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          disposition = matches[1].replace(/['"]/g, '');
        }
      }
      return disposition;
    },
    async getFile(fileId) {
      this.showDownloadLink = false;
      await this.downloadFile(fileId);
      if (
        this.downloadedFile &&
        this.downloadedFile.data &&
        this.downloadedFile.headers
      ) {
        this.showDownloadLink = true;
        const data = this.downloadedFile.headers['content-type'].includes(
          'application/json'
        )
          ? JSON.stringify(this.downloadedFile.data)
          : this.downloadedFile.data;
        const blob = new Blob([data], {
          type: this.downloadedFile.headers['content-type'],
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.getDisposition(
          this.downloadedFile.headers['content-disposition']
        );
        a.style.display = 'none';
        a.classList.add('hiddenDownloadTextElement');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    },
  },
};
</script>
