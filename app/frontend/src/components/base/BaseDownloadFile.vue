<template>
  <span>
    <v-btn text color="primary" @click="downloadFile">
      <v-icon class="mr-1">cloud_download</v-icon>
      <span v-if="buttonText">{{ buttonText }}</span>
    </v-btn>
  </span>
</template>

<script>
export default {
  name: 'BaseDownloadFile',
  props: {
    buttonText: {
      required: false,
      type: String,
    },
    defaultName: {
      required: true,
      type: String,
    },
    fileContent: {
      required: true,
      type: String,
    },
  },
  methods: {
    downloadFile() {
      var element = document.createElement('a');
      element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' +
          encodeURIComponent(this.fileContent)
      );
      element.setAttribute('download', this.defaultName);
      element.style.display = 'none';
      element.classList.add('hiddenDownloadTextElement');
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
  },
};
</script>
