<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          class="mx-1"
          color="primary"
          @click="dialog = true"
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon class="mr-1">share</v-icon>
        </v-btn>
      </template>
      <span>Share Form</span>
    </v-tooltip>

    <v-dialog v-model="dialog" width="900">
      <v-card>
        <v-card-title class="headline pb-0">Share Link</v-card-title>
        <v-card-text>
          <hr />
          <p class="pb-5">Copy the link below or download the QR code.</p>

          <v-row no-gutters class="mt-5">
            <v-col cols="11">
              <v-text-field
                readonly
                dense
                flat
                outlined
                label="URL"
                data-test="text-shareUrl"
                :value="formLink"
              >
                <template #prepend>
                  <v-icon>link</v-icon>
                </template>
              </v-text-field></v-col
            >
            <v-col cols="1" class="pt-1">
              <BaseCopyToClipboard
                :copyText="formLink"
                tooltipText="Copy URL to clipboard"
              />
            </v-col>
          </v-row>

          <v-row no-gutters align="end" justify="center">
            <v-col cols="auto">
              <div class="qrCodeContainer">
                <qrcode-vue
                  :value="formLink"
                  :size="qrSize"
                  renderAs="canvas"
                  :level="qrLevel"
                />
              </div>
            </v-col>
            <v-col cols="1" class="text-center">
              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    icon
                    @click="downloadQr"
                    v-bind="attrs"
                    v-on="on"
                  >
                    <v-icon>get_app</v-icon>
                  </v-btn>
                </template>
                <span>Download QR Code</span>
              </v-tooltip>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn class="mb-5 close-dlg" color="primary" @click="dialog = false">
            <span>Close</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import QrcodeVue from 'qrcode.vue';

export default {
  components: {
    QrcodeVue,
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      dialog: false,
      qrLevel: 'M',
      qrSize: 900,
    };
  },
  computed: {
    formLink() {
      // TODO: Consider using vue-router to generate this url string instead
      return `${window.location.origin}${process.env.BASE_URL}form/submit?f=${this.formId}`;
    },
  },
  methods: {
    downloadQr() {
      var link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = document.querySelector('.qrCodeContainer canvas').toDataURL();
      link.click();
    },
  },
};
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/settings/_variables';

.qrCodeContainer {
  @media #{map-get($display-breakpoints, 'sm-and-up')} {
    padding-left: 75px;
  }

  ::v-deep canvas {
    margin-top: 50px;
    max-width: 250px;
    max-height: 250px;
  }
}

.close-dlg {
  margin-top: 50px;
}
</style>
