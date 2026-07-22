<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { entryTitle } from '~/offline/entryDisplay';
import { offlineQueue, QueueStatus } from '~/offline/queue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const { t, locale } = useI18n({ useScope: 'global' });

const entries = computed(() => offlineQueue.entries.value);

function close() {
  emit('update:modelValue', false);
}

async function discard(id) {
  const ok = window.confirm(t('trans.offlineSubmission.pendingDiscardConfirm'));
  if (!ok) return;
  await offlineQueue.remove(id);
}

const STATUS_KEYS = {
  [QueueStatus.FAILED_AUTH]: 'pendingFailedAuth',
  [QueueStatus.FAILED_PERMISSION]: 'pendingFailedPermission',
  [QueueStatus.FAILED_IDENTITY_MISMATCH]: 'pendingFailedIdentityMismatch',
  [QueueStatus.FAILED_VERSION_GONE]: 'pendingFailedVersionGone',
  [QueueStatus.FAILED_VALIDATION]: 'pendingFailedValidation',
  [QueueStatus.SYNCING]: 'statusSyncing',
  [QueueStatus.PENDING]: 'statusPending',
};

function statusLabel(status) {
  return t(`trans.offlineSubmission.${STATUS_KEYS[status] || 'statusPending'}`);
}
</script>

<template>
  <v-dialog
    :model-value="props.modelValue"
    max-width="640"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <span :lang="locale">{{
          t('trans.offlineSubmission.pendingModalTitle')
        }}</span>
        <v-spacer />
        <v-btn
          icon="mdi:mdi-close"
          variant="text"
          density="comfortable"
          :title="t('trans.offlineSubmission.pendingModalClose')"
          @click="close"
        />
      </v-card-title>
      <v-card-text>
        <p v-if="entries.length === 0" :lang="locale">
          {{ t('trans.offlineSubmission.pendingModalEmpty') }}
        </p>
        <div v-else style="max-height: 240px; overflow-y: auto">
          <v-list>
            <v-list-item v-for="entry in entries" :key="entry.id">
              <v-list-item-title>{{ entryTitle(entry, t) }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ new Date(entry.queuedAt).toLocaleString() }}
                · {{ statusLabel(entry.status) }}
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  size="small"
                  color="error"
                  variant="text"
                  @click="discard(entry.id)"
                >
                  {{ t('trans.offlineSubmission.pendingDiscardButton') }}
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="close">{{
          t('trans.offlineSubmission.pendingModalClose')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
