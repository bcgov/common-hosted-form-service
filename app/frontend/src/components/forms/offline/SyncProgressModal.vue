<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { offlineQueueEvents } from '~/offline/offlineQueueManager';

const { t, locale } = useI18n({ useScope: 'global' });

const visible = ref(false);
const total = ref(0);
const sent = ref(0);
const failed = ref(0);
const done = ref(false);
// Snapshot at drain-start so rows survive flush() removal; 'synced' /
// 'entry-failed' events update displayStatus ('pending'|'sent'|'failed').
const rows = ref([]);

const percent = computed(() =>
  total.value === 0 ? 0 : Math.round((sent.value / total.value) * 100)
);

function confirmationId(row) {
  if (!row.showConfirmationId || !row.submissionId) return null;
  return row.submissionId.substring(0, 8).toUpperCase();
}

function onStart({ total: t0, entries = [] }) {
  total.value = t0;
  sent.value = 0;
  failed.value = 0;
  done.value = false;
  rows.value = entries.map((e) => ({
    ...e,
    displayStatus: 'pending',
    submissionId: null,
    failReason: null,
    sentAt: null,
  }));
  visible.value = true;
}

function onProgress(progress) {
  sent.value = progress.sent || 0;
  failed.value = progress.failed || 0;
}

function onSynced({ dedupKey, submissionId }) {
  const row = rows.value.find((r) => r.dedupKey === dedupKey);
  if (!row) return;
  row.displayStatus = 'sent';
  row.submissionId = submissionId;
  row.sentAt = new Date().toISOString();
}

function onEntryFailed({ dedupKey, error }) {
  const row = rows.value.find((r) => r.dedupKey === dedupKey);
  if (!row) return;
  row.displayStatus = 'failed';
  row.failReason = error;
  row.sentAt = new Date().toISOString();
}

function onEnd(result) {
  sent.value = result?.sent ?? sent.value;
  failed.value = result?.failed ?? failed.value;
  done.value = true;
  // While draining (done=false), v-dialog persistent + no Close button rendered.
}

onMounted(() => {
  offlineQueueEvents.on('drain-start', onStart);
  offlineQueueEvents.on('drain-progress', onProgress);
  offlineQueueEvents.on('drain-end', onEnd);
  offlineQueueEvents.on('synced', onSynced);
  offlineQueueEvents.on('entry-failed', onEntryFailed);
});

onBeforeUnmount(() => {
  offlineQueueEvents.off('drain-start', onStart);
  offlineQueueEvents.off('drain-progress', onProgress);
  offlineQueueEvents.off('drain-end', onEnd);
  offlineQueueEvents.off('synced', onSynced);
  offlineQueueEvents.off('entry-failed', onEntryFailed);
});

function close() {
  visible.value = false;
}
</script>

<template>
  <v-dialog v-model="visible" persistent max-width="560">
    <v-card
      class="d-flex flex-column"
      style="max-height: 80vh; border-radius: 14px !important"
    >
      <v-card-title
        class="d-flex align-center flex-shrink-0"
        style="
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          padding: 20px 28px 8px !important;
          line-height: 1.3 !important;
          letter-spacing: normal !important;
        "
      >
        <span :lang="locale">{{
          t('trans.offlineSubmission.syncModalTitle')
        }}</span>
        <v-spacer />
        <v-btn
          v-if="done"
          icon="mdi:mdi-close"
          variant="text"
          density="comfortable"
          :title="t('trans.offlineSubmission.syncModalDoneClose')"
          @click="close"
        />
      </v-card-title>
      <div class="flex-shrink-0 px-6">
        <p :lang="locale">
          {{ t('trans.offlineSubmission.syncModalSubtitle') }}
        </p>
        <p v-if="!done" class="mt-3 mb-1" :lang="locale">
          {{ t('trans.offlineSubmission.syncModalProgress', { sent, total }) }}
        </p>
        <p v-else class="mt-3 mb-1" :lang="locale">
          {{ t('trans.offlineSubmission.syncModalDoneSummary', { sent }) }}
        </p>
        <v-progress-linear :model-value="percent" height="10" rounded />
        <p v-if="done && failed > 0" class="mt-3 text-error" :lang="locale">
          {{ t('trans.offlineSubmission.syncModalFailedSummary', { failed }) }}
        </p>
      </div>
      <div v-if="rows.length" class="sync-list-wrapper">
        <div
          v-for="row in rows"
          :key="row.dedupKey"
          class="sync-row d-flex align-start"
        >
          <v-icon
            v-if="row.displayStatus === 'sent'"
            color="success"
            icon="mdi:mdi-check-circle"
            size="24"
            class="sync-row-icon"
          />
          <v-icon
            v-else-if="row.displayStatus === 'failed'"
            color="error"
            icon="mdi:mdi-close-circle"
            size="24"
            class="sync-row-icon"
          />
          <v-icon
            v-else
            color="grey"
            icon="mdi:mdi-clock-outline"
            size="24"
            class="sync-row-icon"
            :title="t('trans.offlineSubmission.syncRowStillToSend')"
          />
          <div class="sync-row-body">
            <div class="sync-row-title">
              <template v-if="row.note">{{ row.note }}</template>
              <i18n-t
                v-else-if="row.formName"
                keypath="trans.offlineSubmission.pendingDefaultDescription"
                tag="span"
              >
                <template #formName>
                  <strong>{{ row.formName }}</strong>
                </template>
              </i18n-t>
              <template v-else>{{
                t('trans.offlineSubmission.pendingDefaultDescriptionNoName')
              }}</template>
            </div>
            <div class="sync-row-meta">
              {{
                t('trans.offlineSubmission.syncRowQueuedAt', {
                  time: new Date(row.queuedAt).toLocaleString(),
                })
              }}
            </div>
            <div v-if="row.sentAt" class="sync-row-meta">
              {{
                t('trans.offlineSubmission.syncRowSentAt', {
                  time: new Date(row.sentAt).toLocaleString(),
                })
              }}
            </div>
            <div v-if="confirmationId(row)" class="sync-row-meta">
              {{
                t('trans.offlineSubmission.syncRowConfirmationId', {
                  id: confirmationId(row),
                })
              }}
            </div>
            <div
              v-else-if="row.displayStatus === 'failed'"
              class="sync-row-meta"
            >
              {{ row.failReason }}
            </div>
          </div>
        </div>
      </div>
      <v-card-actions v-if="done" class="flex-shrink-0 sync-actions">
        <v-spacer />
        <v-btn variant="outlined" size="large" class="px-6" @click="close">{{
          t('trans.offlineSubmission.syncModalDoneClose')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.sync-list-wrapper {
  flex-shrink: 0;
  padding: 8px 28px 12px;
  max-height: 240px;
  overflow-y: auto;
}
.sync-row {
  padding: 14px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  &:first-child {
    border-top: 0;
  }
}
.sync-row-icon {
  flex: 0 0 auto;
  margin-inline-end: 12px;
  margin-top: 2px;
}
.sync-row-body {
  flex: 1 1 auto;
  min-width: 0;
}
.sync-row-meta {
  font-size: 0.95rem;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.4;
}
.sync-row-title {
  font-size: 1rem;
  line-height: 1.4;
  margin-top: 2px;
  color: rgba(0, 0, 0, 0.87);

  :deep(strong),
  :deep(b) {
    font-weight: 700;
  }
}
.sync-actions {
  padding: 8px 24px 20px;
}
</style>
