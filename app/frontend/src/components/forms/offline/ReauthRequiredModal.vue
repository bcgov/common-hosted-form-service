<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  offlineQueueEvents,
  REAUTH_PENDING_SS_KEY,
  REAUTH_SNOOZE_SS_KEY,
  tryDrain,
} from '~/offline/offlineQueueManager';
import { useAuthStore } from '~/store/auth';

const { t, locale } = useI18n({ useScope: 'global' });

const mode = ref(null); // 'auth' | 'confirm'
const count = ref(0);

function onAuthRequired({ queuedCount }) {
  count.value = queuedCount;
  mode.value = 'auth';
}

function onReauthConfirm({ queuedCount }) {
  count.value = queuedCount;
  mode.value = 'confirm';
}

function close() {
  mode.value = null;
}

function signIn() {
  try {
    sessionStorage.setItem(REAUTH_PENDING_SS_KEY, '1');
  } catch {
    // sessionStorage unavailable; post-login confirm won't fire but sign-in still proceeds.
  }
  close();
  useAuthStore().login();
}

function notNow() {
  try {
    sessionStorage.setItem(REAUTH_SNOOZE_SS_KEY, '1');
  } catch {
    // sessionStorage unavailable; without snooze the next tick will re-prompt.
  }
  close();
}

function send() {
  close();
  tryDrain();
}

onMounted(() => {
  offlineQueueEvents.on('auth-required', onAuthRequired);
  offlineQueueEvents.on('reauth-drain-confirm', onReauthConfirm);
});

onBeforeUnmount(() => {
  offlineQueueEvents.off('auth-required', onAuthRequired);
  offlineQueueEvents.off('reauth-drain-confirm', onReauthConfirm);
});
</script>

<template>
  <v-dialog :model-value="mode !== null" persistent max-width="520">
    <v-card v-if="mode === 'auth'">
      <v-card-title :lang="locale">
        {{ t('trans.offlineSubmission.reauthTitle') }}
      </v-card-title>
      <v-card-text :lang="locale">
        {{ t('trans.offlineSubmission.reauthBody', { count }) }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" data-test="reauthNotNow" @click="notNow">
          {{ t('trans.offlineSubmission.reauthNotNow') }}
        </v-btn>
        <v-btn color="primary" data-test="reauthSignIn" @click="signIn">
          {{ t('trans.offlineSubmission.reauthSignIn') }}
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-card v-else-if="mode === 'confirm'">
      <v-card-title :lang="locale">
        {{ t('trans.offlineSubmission.reauthDrainConfirmTitle') }}
      </v-card-title>
      <v-card-text :lang="locale">
        {{ t('trans.offlineSubmission.reauthDrainConfirmBody', { count }) }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" data-test="reauthDrainCancel" @click="close">
          {{ t('trans.offlineSubmission.reauthDrainCancel') }}
        </v-btn>
        <v-btn color="primary" data-test="reauthDrainSend" @click="send">
          {{ t('trans.offlineSubmission.reauthDrainSend') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
