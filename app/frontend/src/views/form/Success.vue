<script setup>
import { storeToRefs } from 'pinia';
import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
} from 'vue';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import {
  clearSubmissionAccessToken,
  getValidSubmissionAccessToken,
} from '~/services/formService';

const FormViewer = defineAsyncComponent(() =>
  import('~/components/designer/FormViewer.vue')
);
const RequestReceipt = defineAsyncComponent(() =>
  import('~/components/forms/RequestReceipt.vue')
);

const { locale } = useI18n({ useScope: 'global' });

const props = defineProps({
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
  () => getValidSubmissionAccessToken(props.s) !== null
);
const urlLeakage = computed(
  () => isSharingDisabled.value && !hasValidToken.value
);
const hideContent = computed(
  () => form.value.hideSubmissionContentOnSuccess === true
);
const useStaticPath = computed(() => urlLeakage.value || hideContent.value);
const confirmationId = computed(() =>
  props.s ? props.s.substring(0, 8).toUpperCase() : ''
);

// Wipe the token on navigation so later URL reloads fall back to static.
// pagehide covers browser-level navigation; onBeforeUnmount covers SPA routes.
const wipeToken = () => clearSubmissionAccessToken(props.s);

onMounted(() => {
  globalThis.addEventListener('pagehide', wipeToken);
});

onBeforeUnmount(() => {
  globalThis.removeEventListener('pagehide', wipeToken);
  wipeToken();
});
</script>

<template>
  <div>
    <div class="mb-5" :class="{ 'dir-rtl': isRTL }">
      <h1 class="mb-5" :lang="locale">
        <v-icon size="large" color="success" icon="mdi:mdi-check-circle" />
        {{ $t('trans.sucess.sucessFormSubmissn') }}
      </h1>
      <h3 v-if="form.showSubmissionConfirmation">
        <span v-if="!useStaticPath" class="d-print-none" :lang="locale">
          {{ $t('trans.sucess.keepRecord') }}{{ ' ' }}
        </span>
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
    <FormViewer
      v-if="!useStaticPath"
      :submission-id="s"
      :read-only="true"
      display-title
    />
  </div>
</template>
