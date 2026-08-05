<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import PendingSubmissionsModal from '~/components/forms/offline/PendingSubmissionsModal.vue';
import { offlineQueue } from '~/offline/queue';
import { useSimulationToggle } from '~/offline/useSimulationToggle';
import { useFormStore } from '~/store/form';

const { t, locale } = useI18n({ useScope: 'global' });

const route = useRoute();
const { form } = storeToRefs(useFormStore());
const { networkOnline, canSimulateOffline, simulatingOffline } =
  useSimulationToggle();

const OFFLINE_ROUTES = ['FormSubmit', 'FormSuccess'];
const queuedCount = computed(() => offlineQueue.entries.value.length);
const showPending = ref(false);

// Only show when an offline-enabled form is actually being rendered. Login /
// forms-list / admin / etc. must never see this control even when simulation
// is on or the queue has items; those are unrelated contexts.
const visible = computed(
  () =>
    !!form.value.enableOfflineSubmission && OFFLINE_ROUTES.includes(route.name)
);

const realOffline = computed(() => !networkOnline.value);
// Toggle button is visible when the URL grants the simulate gate OR whenever
// the user is already simulating (so they can always exit even after
// navigating away from a route that carried ?simulateOffline=1). Hidden
// during real offline; there's no manual "go online" to flip to.
const showChevron = computed(
  () =>
    networkOnline.value && (canSimulateOffline.value || simulatingOffline.value)
);

const state = computed(() => {
  if (realOffline.value) {
    return {
      color: 'white',
      variant: 'outlined',
      icon: 'mdi:mdi-cloud-off-outline',
      iconColor: 'warning',
      label: t('trans.offlineSubmission.offlineBadge'),
      dataTest: 'offlineBadge',
    };
  }
  if (simulatingOffline.value) {
    return {
      color: 'white',
      variant: 'outlined',
      icon: 'mdi:mdi-cloud-off-outline',
      iconColor: 'warning',
      label: t('trans.offlineSubmission.simulatingBadge'),
      dataTest: 'simulatingOfflineBadge',
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

// External toggle icon shows the state you'll switch TO, not the current one.
const toggleIcon = computed(() =>
  simulatingOffline.value
    ? 'mdi:mdi-cloud-check-outline'
    : 'mdi:mdi-cloud-off-outline'
);
const toggleTooltip = computed(() =>
  simulatingOffline.value
    ? t('trans.offlineSubmission.goOnline')
    : t('trans.offlineSubmission.goOffline')
);

function openQueue() {
  showPending.value = true;
}

function toggleSimulate() {
  simulatingOffline.value = !simulatingOffline.value;
}
</script>

<template>
  <div v-if="visible" class="offline-control d-flex align-center">
    <v-tooltip v-if="showChevron" location="bottom" :text="toggleTooltip">
      <template #activator="{ props: toggleProps }">
        <v-btn
          color="white"
          variant="text"
          class="offline-toggle-btn"
          data-test="simulateOfflineToggle"
          v-bind="toggleProps"
          @click="toggleSimulate"
        >
          <v-icon :icon="toggleIcon" size="28" />
        </v-btn>
      </template>
    </v-tooltip>
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
          color="warning"
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
    <PendingSubmissionsModal v-model="showPending" />
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

.offline-toggle-btn {
  height: 32px !important;
  width: 32px !important;
  min-width: 32px !important;
  padding: 0 !important;
  margin-inline-end: -4px;
}

:deep(.v-badge__badge) {
  cursor: pointer;
}
</style>
