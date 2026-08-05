<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { entryTitle } from '~/offline/entryDisplay';
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
    <v-card class="d-flex flex-column" style="max-height: 80vh">
      <v-card-title class="d-flex align-center flex-shrink-0">
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
      <div
        v-if="rows.length"
        class="flex-shrink-0 px-6 pb-3"
        style="max-height: 240px; overflow-y: auto"
      >
        <v-list density="compact">
          <v-list-item v-for="row in rows" :key="row.dedupKey">
            <template #prepend>
              <v-icon
                v-if="row.displayStatus === 'sent'"
                color="success"
                icon="mdi:mdi-check-circle"
              />
              <v-icon
                v-else-if="row.displayStatus === 'failed'"
                color="error"
                icon="mdi:mdi-close-circle"
              />
              <v-icon
                v-else
                color="grey"
                icon="mdi:mdi-clock-outline"
                :title="t('trans.offlineSubmission.syncRowStillToSend')"
              />
            </template>
            <v-list-item-title>{{ entryTitle(row, t) }}</v-list-item-title>
            <div class="text-caption text-medium-emphasis" :lang="locale">
              {{
                t('trans.offlineSubmission.syncRowQueuedAt', {
                  time: new Date(row.queuedAt).toLocaleString(),
                })
              }}
            </div>
            <div
              v-if="row.sentAt"
              class="text-caption text-medium-emphasis"
              :lang="locale"
            >
              {{
                t('trans.offlineSubmission.syncRowSentAt', {
                  time: new Date(row.sentAt).toLocaleString(),
                })
              }}
              <template v-if="confirmationId(row)">
                ·
                {{
                  t('trans.offlineSubmission.syncRowConfirmationId', {
                    id: confirmationId(row),
                  })
                }}
              </template>
              <template v-else-if="row.displayStatus === 'failed'">
                · {{ row.failReason }}
              </template>
            </div>
          </v-list-item>
        </v-list>
      </div>
      <v-card-actions v-if="done" class="flex-shrink-0">
        <v-spacer />
        <v-btn @click="close">{{
          t('trans.offlineSubmission.syncModalDoneClose')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
