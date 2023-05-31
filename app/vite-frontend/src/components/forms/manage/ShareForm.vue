<script setup>
import QrcodeVue from 'qrcode.vue';
import { computed, ref } from 'vue';

import BaseCopyToClipboard from '~/components/base/BaseCopyToClipboard.vue';
import { NotificationTypes } from '~/utils/constants';

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
  warning: {
    type: Boolean,
    default: false,
  },
});

const dialog = ref(false);
const qrLevel = ref('M');
const qrSize = ref(900);

const formLink = computed(() => {
  return `${window.location.origin}${import.meta.env.BASE_URL}/form/submit?f=${
    properties.formId
  }`;
});
const NOTIFICATIONS_TYPES = computed(() => NotificationTypes);

function downloadQr() {
  let link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = document.querySelector('.qrCodeContainer canvas').toDataURL();
  link.click();
}
</script>

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
          size="small"
          @click="dialog = true"
        >
          <v-icon icon="mdi:mdi-share-variant"></v-icon>
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
              <v-icon icon="mdi:mdi-link"></v-icon>
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
                    size="small"
                    data-cy="shareFormLinkButton"
                  >
                    <v-icon icon="mdi:mdi-open-in-new"></v-icon>
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
                    size="small"
                    @click="downloadQr"
                  >
                    <v-icon icon="mdi:mdi-download"></v-icon>
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

<style scoped lang="scss">
@import '~vuetify/lib/styles/settings/_variables.scss';

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
