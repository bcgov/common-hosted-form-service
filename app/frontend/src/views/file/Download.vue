<template>
  <BaseSecure :idp="IDP.IDIR">
    <v-container fluid>
      If the file did not automatically download, click here: <a href="#" @click="getFile(id)">Download</a>
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
  computed: {
    ...mapGetters('form', ['downloadedFile']),
    ...mapGetters('notification', ['addNotification']),
    IDP: () => IdentityProviders,
  },
  mounted() {
    this.getFile(this.id);
  },
  methods: {
    ...mapActions('form', ['downloadFile']),
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
      try {
        await this.downloadFile(fileId);
        if (this.downloadedFile && this.downloadedFile.data && this.downloadedFile.headers) {
          const blob = new Blob([this.downloadedFile.data], {
            type: this.downloadedFile.headers['content-type'],
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = this.getDisposition(this.downloadedFile.headers['content-disposition']);
          a.style.display = 'none';
          a.classList.add('hiddenDownloadTextElement');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          this.addNotification({
            message:
              'An error occurred while attempting to download the file.',
            consoleError: `Error downloading file for file ${this.file.id}.`,
          });
        }
      } catch (error) {
        this.addNotification({
          message:
            'An error occurred while attempting to download the file.',
          consoleError: `Error downloading file for file ${this.file.id} ${error}`,
        });
      }
    }
  }
};
</script>
