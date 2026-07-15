<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import FormViewer from '~/components/designer/FormViewer.vue';
import RequestReceipt from '~/components/forms/RequestReceipt.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import {
  clearSubmissionAccessToken,
  getValidSubmissionAccessToken,
} from '~/services/formService';

const { locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  s: {
    type: String,
    required: true,
  },
});

const { email } = storeToRefs(useAuthStore());
const { form, isRTL } = storeToRefs(useFormStore());

// Static block: sharing off + no token (strict privacy) OR hide-content.
// RequestReceipt is suppressed on the sharing-off path (forwarding it would
// defeat the privacy protection).
const isSharingDisabled = computed(
  () => form.value.enableSubmissionUrlSharing === false
);
const hasValidToken = computed(
  () => getValidSubmissionAccessToken(properties.s) !== null
);
const urlLeakage = computed(
  () => isSharingDisabled.value && !hasValidToken.value
);
const hideContent = computed(
  () => form.value.hideSubmissionContentOnSuccess === true
);
const useStaticPath = computed(() => urlLeakage.value || hideContent.value);
const confirmationId = computed(() =>
  properties.s ? properties.s.substring(0, 8).toUpperCase() : ''
);

// Wipe the token on navigation so later URL reloads fall back to static.
// pagehide covers browser-level navigation; onBeforeUnmount covers SPA routes.
const wipeToken = () => clearSubmissionAccessToken(properties.s);
onMounted(() => globalThis.addEventListener('pagehide', wipeToken));
onBeforeUnmount(() => {
  globalThis.removeEventListener('pagehide', wipeToken);
  wipeToken();
});
</script>

<template>
  <div v-if="useStaticPath" class="mb-5" :class="{ 'dir-rtl': isRTL }">
    <h1 class="mb-5" :lang="locale">
      <v-icon size="large" color="success" icon="mdi:mdi-check-circle"></v-icon>
      {{ $t('trans.sucess.sucessFormSubmissn') }}
    </h1>
    <h3 v-if="form.showSubmissionConfirmation">
      <span :lang="locale">
        {{ $t('trans.sucess.confirmationId') }}:
        <mark>{{ confirmationId }}</mark>
      </span>
    </h3>
    <RequestReceipt
      v-if="form.enableSubmitterEmailReceipt && !urlLeakage"
      class="d-print-none"
      :email="email"
      :submission-id="s"
    />
    <hr />
  </div>
  <div v-else>
    <FormViewer :submission-id="s" :read-only="true" display-title>
      <template #alert>
        <div class="mb-5" :class="{ 'dir-rtl': isRTL }">
          <h1 class="mb-5" :lang="locale">
            <v-icon
              size="large"
              color="success"
              icon="mdi:mdi-check-circle"
            ></v-icon>
            {{ $t('trans.sucess.sucessFormSubmissn') }}
          </h1>
          <h3 v-if="form.showSubmissionConfirmation">
            <span class="d-print-none" :lang="locale">
              {{ $t('trans.sucess.keepRecord') }}{{ ' ' }}
            </span>
            <span :lang="locale">
              {{ $t('trans.sucess.confirmationId') }}:
              <mark>{{ confirmationId }}</mark>
            </span>
          </h3>
          <RequestReceipt
            v-if="form.enableSubmitterEmailReceipt"
            class="d-print-none"
            :email="email"
            :submission-id="s"
          />
          <hr />
        </div>
      </template>
    </FormViewer>
  </div>
</template>
