<template>
  <span>
    <v-btn
      color="blue"
      text
      small
      v-clipboard:copy="copyText"
      v-clipboard:success="clipboardSuccessHandler"
      v-clipboard:error="clipboardErrorHandler"
    >
      <v-icon class="mr-1">file_copy</v-icon>
      <span>Copy to clipboard</span>
    </v-btn>
    <v-snackbar v-model="clipSnackbar.on" right top :timeout="6000" :color="clipSnackbar.color">
      {{clipSnackbar.text}}
      <v-btn color="white" text @click="clipSnackbar.on = false">
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>
  </span>
</template>

<script>
import Vue from 'vue';
import VueClipboard from 'vue-clipboard2';

VueClipboard.config.autoSetContainer = true;
Vue.use(VueClipboard);

export default {
  name: 'BaseCopyToClipboard',
  props: {
    copyText: {
      required: true,
      type: String,
    },
  },
  data() {
    return {
      clipSnackbar: {
        on: false,
        color: 'info',
      },
    };
  },
  methods: {
    clipboardSuccessHandler() {
      this.clipSnackbar.on = true;
      this.clipSnackbar.text = 'Link copied to clipboard';
      this.clipSnackbar.color = 'info';
      this.$emit('copied');
    },
    clipboardErrorHandler() {
      this.clipSnackbar.on = true;
      this.clipSnackbar.text = 'Error attempting to copy to clipboard';
      this.clipSnackbar.color = 'error';
    },
  },
};
</script>
