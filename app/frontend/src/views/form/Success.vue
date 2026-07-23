<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import FormViewer from '~/components/designer/FormViewer.vue';
import RequestReceipt from '~/components/forms/RequestReceipt.vue';
import { offlineQueueEvents } from '~/offline/offlineQueueManager';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import {
  clearSubmissionAccessToken,
  getValidSubmissionAccessToken,
} from '~/services/formService';

const { locale, t } = useI18n({ useScope: 'global' });

const props = defineProps({
  s: {
    type: String,
    required: true,
  },
});

const { email } = storeToRefs(useAuthStore());
const { form, isRTL } = storeToRefs(useFormStore());

const route = useRoute();
const router = useRouter();

// Synthetic pending page: `?s=pending-<dedupKey>` while an offline submission
// waits to drain. No server-side submission exists yet, so token/sharing gates
// don't apply and this path must be checked first.
const pendingKey = computed(() => {
  if (typeof props.s === 'string' && props.s.startsWith('pending-')) {
    return props.s.slice('pending-'.length);
  }
  return null;
});

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

function onSynced({ dedupKey, submissionId }) {
  if (!pendingKey.value || !submissionId) return;
  if (dedupKey !== pendingKey.value) return;
  // Swap synthetic id for real one so reloads land on the canonical Success page.
  router.replace({
    name: 'FormSuccess',
    query: { ...route.query, s: submissionId },
  });
}

function startAnother() {
  router.push({
    name: 'FormSubmit',
    query: {
      f: route.query.f,
      fresh: Date.now(),
      ...(route.query.simulateOffline
        ? { simulateOffline: route.query.simulateOffline }
        : {}),
    },
  });
}

// Wipe the token on navigation so later URL reloads fall back to static.
// pagehide covers browser-level navigation; onBeforeUnmount covers SPA routes.
const wipeToken = () => clearSubmissionAccessToken(props.s);

onMounted(() => {
  globalThis.addEventListener('pagehide', wipeToken);
  offlineQueueEvents.on('synced', onSynced);
});

onBeforeUnmount(() => {
  globalThis.removeEventListener('pagehide', wipeToken);
  wipeToken();
  offlineQueueEvents.off('synced', onSynced);
});
</script>

<template>
  <div v-if="pendingKey" class="pa-6" :class="{ 'dir-rtl': isRTL }">
    <h1 class="mb-3" :lang="locale">
      <v-icon
        size="large"
        color="warning"
        icon="mdi:mdi-cloud-upload-outline"
      ></v-icon>
      {{ t('trans.offlineSubmission.successPendingTitle') }}
    </h1>
    <p :lang="locale">
      {{ t('trans.offlineSubmission.successPendingMessage') }}
    </p>
    <v-btn color="primary" class="mt-4" @click="startAnother">
      {{ t('trans.offlineSubmission.successPendingStartAnother') }}
    </v-btn>
  </div>
  <div v-else-if="useStaticPath" class="mb-5" :class="{ 'dir-rtl': isRTL }">
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
