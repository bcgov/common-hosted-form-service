<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          class="mx-1"
          data-cy="shareFormButton"
          color="primary"
          icon
          v-bind="props"
          @click="dialog = true"
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
            v-if="warning"
            :class="NOTIFICATIONS_TYPES.WARNING.class"
            :color="NOTIFICATIONS_TYPES.WARNING.color"
            :icon="NOTIFICATIONS_TYPES.WARNING.icon"
            text="There is no published version of the form at this time. The link
            below will not be reachable until a version is published."
          ></v-alert>
          <v-text-field
            readonly
            density="compact"
            variant="outlined"
            label="URL"
            data-test="text-shareUrl"
            :model-value="formLink"
          >
            <template #prepend>
              <v-icon>link</v-icon>
            </template>
            <template #append>
              <BaseCopyToClipboard
                class="mt-n1"
                :copy-text="formLink"
                tooltip-text="Copy URL to clipboard"
              />
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <v-btn
                    class="mt-n1"
                    color="primary"
                    :href="formLink"
                    icon
                    target="_blank"
                    v-bind="props"
                    data-cy="shareFormLinkButton"
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
                  render-as="canvas"
                  :level="qrLevel"
                />
              </div>
            </v-col>
            <v-col cols="1" class="text-center">
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <v-btn
                    color="primary"
                    icon
                    v-bind="props"
                    @click="downloadQr"
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
import { NotificationTypes } from '@src/utils/constants';

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
      return `${window.location.origin}${
        import.meta.env.BASE_URL
      }/form/submit?f=${this.formId}`;
    },
    NOTIFICATIONS_TYPES() {
      return NotificationTypes;
    },
  },
  methods: {
    downloadQr() {
      let link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = document.querySelector('.qrCodeContainer canvas').toDataURL();
      link.click();
    },
  },
};
</script>

<style scoped lang="scss">
@import 'vuetify/settings';

.qrCodeContainer {
  @media #{map-get($display-breakpoints, 'sm-and-up')} {
    padding-left: 75px;
  }

  :deep(canvas) {
    margin-top: 50px;
    max-width: 250px;
    max-height: 250px;
  }
}

.close-dlg {
  margin-top: 50px;
}
</style>
