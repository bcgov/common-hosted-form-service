<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import PendingSubmissionsModal from '~/components/forms/offline/PendingSubmissionsModal.vue';
import { offlineQueue } from '~/offline/queue';
import { useOnlineStatus } from '~/offline/useOnlineStatus';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const route = useRoute();
const router = useRouter();
const { form } = storeToRefs(useFormStore());
const { online } = useOnlineStatus();
const notificationStore = useNotificationStore();

const queuedCount = computed(() => offlineQueue.entries.value.length);
const showPending = ref(false);
// Suppress the pending-list opener while the user is editing a queued entry,
// so they can't recursively open the list from the edit page.
const isEditingOfflineEntry = computed(() => !!route?.query?.editOffline);

// Submitter-facing routes where the offline chip is meaningful. Excludes the
// form editor, list of forms, and list of submissions/drafts pages.
const OFFLINE_ROUTE_ALLOWLIST = new Set([
  'FormSubmit',
  'FormSuccess',
  'UserFormDraftEdit',
  'UserFormDuplicate',
  'UserFormView',
]);
const isOfflineRoute = computed(() => OFFLINE_ROUTE_ALLOWLIST.has(route?.name));

// Only show on submitter/form-related pages, and only when the current form
// is offline-capable or the device has queued entries.
const visible = computed(
  () =>
    isOfflineRoute.value &&
    (queuedCount.value > 0 || !!form.value.enableOfflineSubmission)
);

// Persistent offline notification on online>offline, plus initial-load case.
watch(
  [online, visible],
  ([isOnline, isVisible], oldVals) => {
    if (!isVisible || isOnline) return;
    const wasOnline = oldVals ? oldVals[0] : true;
    if (wasOnline) raiseOfflineNotification();
  },
  { immediate: true }
);

function raiseOfflineNotification() {
  notificationStore.addNotification({
    ...NotificationTypes.INFO,
    title: 'trans.offlineSubmission.offlineBannerTitle',
    text: 'trans.offlineSubmission.offlineBannerMessage',
    translate: true,
    retain: true,
    unique: true,
  });
}

function openQueue() {
  if (isEditingOfflineEntry.value) return;
  showPending.value = true;
}

function onEditEntry(entry) {
  router.push({
    name: 'FormSubmit',
    query: {
      f: entry.formId,
      editOffline: entry.id,
    },
  });
}
</script>

<template>
  <div v-if="visible" class="offline-control d-flex align-center">
    <v-tooltip
      v-if="!online"
      location="bottom"
      :text="t('trans.offlineSubmission.offlineIconTooltip')"
      :open-delay="400"
    >
      <template #activator="{ props: iconProps }">
        <v-icon
          v-bind="iconProps"
          icon="mdi:mdi-cloud-off-outline"
          color="warning"
          size="28"
          class="offline-cloud-icon"
          data-test="offlineCloudIcon"
        />
      </template>
    </v-tooltip>
    <v-tooltip
      v-if="queuedCount > 0"
      location="bottom"
      :text="
        t('trans.offlineSubmission.headerButtonTooltip', queuedCount, {
          count: queuedCount,
        })
      "
      :open-delay="400"
    >
      <template #activator="{ props: tipProps }">
        <v-badge
          color="error"
          location="top end"
          offset-x="0"
          offset-y="0"
          :content="queuedCount"
          data-test="offlineSubmissionsBadge"
        >
          <v-btn
            color="white"
            variant="outlined"
            :disabled="isEditingOfflineEntry"
            class="offline-status-btn"
            data-test="offlineSubmissionButton"
            v-bind="tipProps"
            @click="openQueue"
          >
            <span :lang="locale" class="offline-status-label">{{
              t('trans.offlineSubmission.headerButtonLabel')
            }}</span>
          </v-btn>
        </v-badge>
      </template>
    </v-tooltip>
    <PendingSubmissionsModal v-model="showPending" @edit="onEditEntry" />
  </div>
</template>

<style scoped lang="scss">
.offline-cloud-icon {
  margin-inline-end: 12px;
}

.offline-status-btn {
  height: 40px !important;
  padding-inline: 16px !important;
  letter-spacing: 0;
}

.offline-status-label {
  color: #ffffff !important;
  font-weight: 600;
}
</style>
