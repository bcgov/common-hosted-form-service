<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          class="mx-1"
          data-cy="shareFormButton"
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
        <v-card-title class="text-h5 pb-0">Share Link</v-card-title>
        <v-card-text>
          <hr />
          <p class="mb-5">Copy the link below or download the QR code.</p>
          <v-alert
            :value="warning"
            :class="NOTIFICATIONS_TYPES.WARNING.class"
            :color="NOTIFICATIONS_TYPES.WARNING.color"
            :icon="NOTIFICATIONS_TYPES.WARNING.icon"
            transition="scale-transition"
          >
            There is no published version of the form at this time. The link
            below will not be reachable until a version is published.
          </v-alert>
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
            <template #append-outer>
              <BaseCopyToClipboard
                class="mt-n1"
                :copyText="formLink"
                tooltipText="Copy URL to clipboard"
              />
              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <v-btn
                    class="mt-n1"
                    color="primary"
                    :href="formLink"
                    icon
                    target="_blank"
                    v-bind="attrs"
                    data-cy="shareFormLinkButton"
                    v-on="on"
                  >
                    <v-icon class="mr-1">open_in_new</v-icon>
                  </v-btn>
                </template>
                <span>Open this form</span>
              </v-tooltip>
            </template>
          </v-text-field>

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
import { NotificationTypes } from '@/utils/constants';

export default {
  components: {
    QrcodeVue,
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
    warning: {
      type: Boolean,
      default: false,
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
    NOTIFICATIONS_TYPES() {
      return NotificationTypes;
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
