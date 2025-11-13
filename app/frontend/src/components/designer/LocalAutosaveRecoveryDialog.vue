<template>
  <BaseDialog
    v-model="showDialog"
    type="CONTINUE"
    :enable-custom-button="true"
    @close-dialog="handleDiscard"
    @continue-dialog="handleRestore"
  >
    <template #title>
      <div class="d-flex align-center">
        <v-icon color="info" class="mr-2" size="20" aria-hidden="true">
          mdi-restore
        </v-icon>
        <span :lang="locale">{{ $t('trans.localAutosave.title') }}</span>
      </div>
    </template>

    <template #text>
      <div class="text-body-1">
        <p>{{ $t('trans.localAutosave.message') }}</p>

        <div v-if="localTimestamp" class="mt-3 mb-3">
          <v-chip color="primary" variant="tonal" size="small">
            <v-icon start size="16" aria-hidden="true">
              mdi-clock-outline
            </v-icon>
            <span>{{ formatTimestamp(localTimestamp) }}</span>
          </v-chip>
        </div>

        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="text-body-2 mt-3"
        >
          {{ $t('trans.localAutosave.disclaimer') }}
        </v-alert>
      </div>
    </template>

    <template #button-text-continue>
      <span :lang="locale">{{ $t('trans.localAutosave.restore') }}</span>
    </template>

    <template #button-text-close>
      <span :lang="locale">{{ $t('trans.localAutosave.discard') }}</span>
    </template>
  </BaseDialog>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseDialog from '~/components/base/BaseDialog.vue';

const { t, locale } = useI18n({ useScope: 'global' });

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  localTimestamp: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['update:show', 'restore', 'discard']);

const showDialog = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
});

function formatTimestamp(timestamp) {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) {
      return t('trans.localAutosave.daysAgo', { count: days });
    } else if (hours > 0) {
      return t('trans.localAutosave.hoursAgo', { count: hours });
    } else if (minutes > 0) {
      return t('trans.localAutosave.minutesAgo', { count: minutes });
    } else {
      return t('trans.localAutosave.justNow');
    }
  } catch (error) {
    return timestamp;
  }
}

function handleRestore() {
  emit('restore');
  showDialog.value = false;
}

function handleDiscard() {
  emit('discard');
  showDialog.value = false;
}
</script>
