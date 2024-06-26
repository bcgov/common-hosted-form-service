<script setup>
import { storeToRefs } from 'pinia';
import QrcodeVue from 'qrcode.vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import BaseCopyToClipboard from '~/components/base/BaseCopyToClipboard.vue';
import { NotificationTypes } from '~/utils/constants';
import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

const router = useRouter();

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

const { isRTL } = storeToRefs(useFormStore());

const formLink = computed(() => {
  const url = router.resolve({
    name: 'FormSubmit',
    query: { f: properties.formId },
  });
  return `${window.location.origin}${url.href}`;
});
const NOTIFICATIONS_TYPES = computed(() => NotificationTypes);

function downloadQr() {
  let link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = document.querySelector('.qrCodeContainer canvas').toDataURL();
  link.click();
}

defineExpose({ dialog, formLink, downloadQr });
</script>

<template>
  <span :class="{ 'dir-rtl': isRTL }">
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          class="mx-1"
          color="primary"
          data-cy="shareFormButton"
          v-bind="props"
          size="x-small"
          density="default"
          icon="mdi:mdi-share-variant"
          :title="$t('trans.shareForm.shareForm')"
          @click="dialog = true"
        />
      </template>
      <span :lang="locale">{{ $t('trans.shareForm.shareForm') }}</span>
    </v-tooltip>

    <v-dialog v-model="dialog" width="900" data-cy="shareFormDialog">
      <v-card>
        <v-card-title class="text-h5 pb-0" :lang="locale">{{
          $t('trans.shareForm.shareLink')
        }}</v-card-title>
        <v-card-text>
          <hr />
          <p class="mb-5" :class="{ 'dir-rtl': isRTL }" :lang="locale">
            {{ $t('trans.shareForm.copyQRCode') }}
          </p>
          <v-alert
            v-if="warning"
            :class="[NOTIFICATIONS_TYPES.WARNING.class, { 'dir-rtl': isRTL }]"
            :icon="NOTIFICATIONS_TYPES.WARNING.icon"
            :text="$t('trans.shareForm.warningMessage')"
            :lang="locale"
          ></v-alert>
          <v-text-field
            readonly
            density="compact"
            variant="outlined"
            label="URL"
            data-test="text-shareUrl"
            :model-value="formLink"
            :class="{ 'dir-rtl': isRTL }"
          >
            <template #prepend>
              <v-icon icon="mdi:mdi-link"></v-icon>
            </template>
            <template #append>
              <BaseCopyToClipboard
                class="mt-n1 mx-2"
                :text-to-copy="formLink"
                :tooltip-text="$t('trans.shareForm.copyURLToClipboard')"
                :lang="locale"
              />
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <v-btn
                    class="mt-n1"
                    :class="{ 'dir-rtl': isRTL }"
                    :href="formLink"
                    color="primary"
                    target="_blank"
                    v-bind="props"
                    size="x-small"
                    density="default"
                    data-cy="shareFormLinkButton"
                    icon="mdi:mdi-open-in-new"
                    :title="$t('trans.shareForm.openThisForm')"
                  />
                </template>
                <span :class="{ 'dir-rtl': isRTL }" :lang="locale">{{
                  $t('trans.shareForm.openThisForm')
                }}</span>
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
                    size="x-small"
                    :title="$t('trans.shareForm.downloadQRCode')"
                    @click="downloadQr"
                  >
                    <v-icon icon="mdi:mdi-download"></v-icon>
                  </v-btn>
                </template>
                <span>{{ $t('trans.shareForm.downloadQRCode') }}</span>
              </v-tooltip>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn
            :class="{ 'dir-rtl': isRTL }"
            class="mb-5 close-dlg"
            color="primary"
            variant="flat"
            :title="$t('trans.shareForm.close')"
            @click="dialog = false"
          >
            <span :lang="locale">{{ $t('trans.shareForm.close') }}</span>
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
