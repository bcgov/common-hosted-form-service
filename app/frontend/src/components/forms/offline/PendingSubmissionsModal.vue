<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { offlineQueue, QueueStatus } from '~/offline/queue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const { t, locale } = useI18n({ useScope: 'global' });

const entries = computed(() => offlineQueue.entries.value);

const discardCandidate = ref(null);
const showDiscardDialog = computed({
  get: () => discardCandidate.value !== null,
  set: (v) => {
    if (!v) discardCandidate.value = null;
  },
});

function close() {
  emit('update:modelValue', false);
}

function promptDiscard(entry) {
  discardCandidate.value = entry;
}

async function confirmDiscard() {
  if (!discardCandidate.value) return;
  const id = discardCandidate.value.id;
  discardCandidate.value = null;
  await offlineQueue.remove(id);
}

function cancelDiscard() {
  discardCandidate.value = null;
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
    <v-card
      class="pending-card"
      elevation="4"
      style="border-radius: 14px !important"
    >
      <v-card-title
        class="pending-title d-flex align-center"
        style="
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          padding: 20px 28px 8px !important;
          line-height: 1.3 !important;
          letter-spacing: normal !important;
        "
      >
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
      <v-card-text class="pending-body">
        <p v-if="entries.length === 0" class="pending-empty" :lang="locale">
          {{ t('trans.offlineSubmission.pendingModalEmpty') }}
        </p>
        <div v-else class="pending-list-wrapper">
          <div
            v-for="entry in entries"
            :key="entry.id"
            class="pending-row d-flex align-start"
          >
            <div class="pending-row-body">
              <div class="pending-row-title">
                <template v-if="entry.note">{{ entry.note }}</template>
                <i18n-t
                  v-else-if="entry.formName"
                  keypath="trans.offlineSubmission.pendingDefaultDescription"
                  tag="span"
                >
                  <template #formName>
                    <strong>{{ entry.formName }}</strong>
                  </template>
                </i18n-t>
                <template v-else>{{
                  t('trans.offlineSubmission.pendingDefaultDescriptionNoName')
                }}</template>
              </div>
              <div class="pending-row-meta">
                {{ new Date(entry.queuedAt).toLocaleString() }}
                · {{ statusLabel(entry.status) }}
              </div>
            </div>
            <v-btn
              class="pending-row-discard"
              icon="mdi:mdi-trash-can-outline"
              variant="text"
              density="comfortable"
              color="error"
              :title="t('trans.offlineSubmission.pendingDiscardButton')"
              @click="promptDiscard(entry)"
            />
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="pending-actions">
        <v-spacer />
        <v-btn variant="outlined" size="large" class="px-6" @click="close">{{
          t('trans.offlineSubmission.pendingModalClose')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showDiscardDialog" max-width="480" persistent>
    <v-card elevation="4" style="border-radius: 14px !important">
      <v-card-title
        style="
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          padding: 20px 28px 8px !important;
          line-height: 1.3 !important;
          letter-spacing: normal !important;
        "
      >
        <span :lang="locale">{{
          t('trans.offlineSubmission.pendingDiscardTitle')
        }}</span>
      </v-card-title>
      <v-card-text class="pending-discard-body">
        <p class="pending-discard-message" :lang="locale">
          {{ t('trans.offlineSubmission.pendingDiscardConfirm') }}
        </p>
        <p
          v-if="discardCandidate"
          class="pending-discard-target"
          :lang="locale"
        >
          <template v-if="discardCandidate.note">{{
            discardCandidate.note
          }}</template>
          <i18n-t
            v-else-if="discardCandidate.formName"
            keypath="trans.offlineSubmission.pendingDefaultDescription"
            tag="span"
          >
            <template #formName>
              <strong>{{ discardCandidate.formName }}</strong>
            </template>
          </i18n-t>
          <template v-else>{{
            t('trans.offlineSubmission.pendingDefaultDescriptionNoName')
          }}</template>
        </p>
      </v-card-text>
      <v-card-actions class="pending-discard-actions">
        <v-spacer />
        <v-btn
          color="error"
          variant="flat"
          size="large"
          class="px-6"
          data-test="pending-discard-confirm"
          @click="confirmDiscard"
        >
          <span :lang="locale">{{
            t('trans.offlineSubmission.pendingDiscardButton')
          }}</span>
        </v-btn>
        <v-btn
          variant="outlined"
          size="large"
          class="px-6"
          data-test="pending-discard-cancel"
          @click="cancelDiscard"
        >
          <span :lang="locale">{{ t('trans.baseDialog.cancel') }}</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.pending-card {
  padding: 8px 4px;
}
.pending-body {
  padding: 8px 28px 12px;
  font-size: 1rem;
}
.pending-empty {
  margin: 0;
  color: rgba(0, 0, 0, 0.72);
}
.pending-list-wrapper {
  max-height: 320px;
  overflow-y: auto;
}
.pending-row {
  padding: 14px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  &:first-child {
    border-top: 0;
  }
}
.pending-row-body {
  flex: 1 1 auto;
  min-width: 0;
}
.pending-row-meta {
  font-size: 0.95rem;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.4;
}
.pending-row-title {
  font-size: 1rem;
  line-height: 1.4;
  margin-top: 2px;
  color: rgba(0, 0, 0, 0.87);

  :deep(strong),
  :deep(b) {
    font-weight: 700;
  }
}
.pending-row-discard {
  flex: 0 0 auto;
  margin-inline-start: 12px;
  margin-top: 2px;
}
.pending-actions {
  padding: 8px 24px 20px;
}
.pending-discard-body {
  padding: 8px 28px 12px;
  font-size: 1rem;
}
.pending-discard-message {
  margin: 0 0 12px;
  color: rgba(0, 0, 0, 0.72);
  line-height: 1.5;
}
.pending-discard-target {
  margin: 0;
  color: rgba(0, 0, 0, 0.87);

  :deep(strong),
  :deep(b) {
    font-weight: 700;
  }
}
.pending-discard-actions {
  padding: 8px 24px 20px;
  gap: 12px;
}
</style>
