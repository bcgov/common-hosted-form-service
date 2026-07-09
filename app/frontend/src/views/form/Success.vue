<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
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

const { authenticated, email } = storeToRefs(useAuthStore());
const { form, isRTL } = storeToRefs(useFormStore());

// preFlightAuth populates the form options (sharing flag, hide-content flag,
// etc.) from the unauthenticated /options endpoint before this view mounts.
// The static block serves two paths:
//   * URL-leakage fallback: sharing is off AND the viewer has no way to fetch
//     the submission (anonymous, no token in sessionStorage). Authenticated
//     viewers and anonymous viewers with a valid token still mount FormViewer.
//   * Designer-opted-in hide-content: hideSubmissionContentOnSuccess is true.
//     Every viewer (anonymous, token-holder, authenticated) gets the static
//     block; FormViewer is never mounted.
// RequestReceipt is suppressed in the URL-leakage path (the link in the
// receipt email points back to the same trimmed page and would defeat the
// privacy protection if forwarded), but shown in the hide-content path
// because the receipt email is the only way the submitter sees their data.
const isSharingDisabled = computed(
  () => form.value.enableSubmissionUrlSharing === false
);
const hasValidToken = computed(
  () => getValidSubmissionAccessToken(properties.s) !== null
);
const urlLeakage = computed(
  () => isSharingDisabled.value && !hasValidToken.value && !authenticated.value
);
const hideContent = computed(
  () => form.value.hideSubmissionContentOnSuccess === true
);
// Set to true when FormViewer emits access-denied after a 401 on getSubmission
// for a sharing-off form. Covers the "forwarded success URL, viewer isn't on
// the form team" case; we fall back to the static block instead of leaving a
// half-rendered viewer + a burst of error notifications.
const accessDenied = ref(false);
const useStaticPath = computed(
  () => urlLeakage.value || hideContent.value || accessDenied.value
);
const confirmationId = computed(() =>
  properties.s ? properties.s.substring(0, 8).toUpperCase() : ''
);

// Wipe the access token as soon as the submitter leaves this page so a later
// reload of the URL falls back to the static block. Covers SPA route changes
// via onBeforeUnmount and browser-level navigation (tab close, refresh,
// off-origin) via pagehide.
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
    <FormViewer
      :submission-id="s"
      :read-only="true"
      display-title
      @access-denied="accessDenied = true"
    >
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
