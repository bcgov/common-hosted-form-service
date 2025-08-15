<template>
  <BaseDialog
    v-model="showDialog"
    type="CONTINUE"
    :enable-custom-button="true"
    @close-dialog="onDismiss"
    @continue-dialog="onRestore"
  >
    <template #title>
      <div class="d-flex align-center">
        <v-icon color="info" class="mr-2" size="20" aria-hidden="true">
          mdi-content-save
        </v-icon>
        <span :lang="locale">{{ $t('trans.formDataRecovery.title') }}</span>
      </div>
    </template>

    <template #text>
      <div class="text-body-1">
        <p>{{ $t('trans.formDataRecovery.message') }}</p>

        <output
          v-if="recoveryData?.timestamp"
          class="mt-3 mb-3"
          aria-live="polite"
        >
          <v-chip color="primary" variant="tonal" size="small">
            <v-icon start size="16" aria-hidden="true"
              >mdi-clock-outline</v-icon
            >
            <span
              :aria-label="
                $t('trans.formDataRecovery.savedAt', {
                  time: formatSaveTime.value(recoveryData.timestamp),
                })
              "
            >
              {{ formatSaveTime.value(recoveryData.timestamp) }}
            </span>
          </v-chip>
        </output>

        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="text-body-2 mt-3"
        >
          {{ $t('trans.formDataRecovery.disclaimer') }}
        </v-alert>
      </div>
    </template>

    <template #button-text-continue>
      <span :lang="locale">{{ $t('trans.formDataRecovery.restore') }}</span>
    </template>

    <template #button-text-close>
      <span :lang="locale">{{ $t('trans.formDataRecovery.dismiss') }}</span>
    </template>
  </BaseDialog>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseDialog from '~/components/base/BaseDialog.vue';

const { t, locale } = useI18n({ useScope: 'global' });

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  recoveryData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'restore', 'dismiss']);

const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const formatSaveTime = computed(() => {
  return (timestamp) => {
    if (!timestamp) return '';

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) {
      return t('trans.formDataRecovery.daysAgo', { count: days });
    } else if (hours > 0) {
      return t('trans.formDataRecovery.hoursAgo', { count: hours });
    } else if (minutes > 0) {
      return t('trans.formDataRecovery.minutesAgo', { count: minutes });
    } else {
      return t('trans.formDataRecovery.justNow');
    }
  };
});

function onRestore() {
  emit('restore', props.recoveryData);
  showDialog.value = false;
}

function onDismiss() {
  emit('dismiss');
  showDialog.value = false;
}
</script>
