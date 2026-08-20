<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import PendingSubmissionsModal from '~/components/forms/offline/PendingSubmissionsModal.vue';
import { offlineQueue } from '~/offline/queue';
import { useOnlineStatus } from '~/offline/useOnlineStatus';
import { useFormStore } from '~/store/form';

const { t, locale } = useI18n({ useScope: 'global' });

const route = useRoute();
const router = useRouter();
const { form } = storeToRefs(useFormStore());
const { online } = useOnlineStatus();

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

const state = computed(() => {
  if (!online.value) {
    return {
      color: 'white',
      variant: 'outlined',
      icon: 'mdi:mdi-cloud-off-outline',
      iconColor: 'warning',
      label: t('trans.offlineSubmission.offlineBadge'),
      dataTest: 'offlineBadge',
    };
  }
  return {
    color: 'white',
    variant: 'outlined',
    icon: 'mdi:mdi-cloud-check-outline',
    iconColor: '#00e676',
    label: t('trans.offlineSubmission.onlineBadge'),
    dataTest: 'onlineBadge',
  };
});

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
          :model-value="queuedCount > 0"
          color="error"
          location="top end"
          offset-x="0"
          offset-y="0"
          data-test="offlineSubmissionsBadge"
        >
          <template #badge>
            <v-tooltip
              location="bottom"
              :text="
                t('trans.offlineSubmission.headerButtonTooltip', queuedCount, {
                  count: queuedCount,
                })
              "
            >
              <template #activator="{ props: badgeTipProps }">
                <span v-bind="badgeTipProps" @click="openQueue">{{
                  queuedCount
                }}</span>
              </template>
            </v-tooltip>
          </template>
          <v-btn
            :color="state.color"
            :variant="state.variant"
            :data-test="state.dataTest"
            :disabled="isEditingOfflineEntry"
            class="offline-status-btn"
            v-bind="tipProps"
            @click="openQueue"
          >
            <template #prepend>
              <v-icon
                :color="state.iconColor"
                :icon="state.icon"
                size="28"
                class="offline-status-icon"
              />
            </template>
            <span :lang="locale" class="offline-status-label">{{
              state.label
            }}</span>
          </v-btn>
        </v-badge>
      </template>
    </v-tooltip>
    <PendingSubmissionsModal v-model="showPending" @edit="onEditEntry" />
  </div>
</template>

<style scoped lang="scss">
.offline-status-btn {
  height: 40px !important;
  width: 120px;
  min-width: 120px;
  padding-inline: 12px !important;
  letter-spacing: 0;

  @media (max-width: 599px) {
    min-width: 40px;
    padding-inline: 8px !important;

    .offline-status-label {
      display: none;
    }
  }
}

.offline-status-label {
  color: #ffffff !important;
}

:deep(.v-badge__badge) {
  cursor: pointer;
}
</style>
