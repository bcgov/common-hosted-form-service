<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { useFormStore } from '~/store/form';
import { formService } from '~/services';
import { useNotificationStore } from '~/store/notification';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  submissionId: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    default: '',
  },
});

const { isRTL } = storeToRefs(useFormStore());

// Computed class binding that combines RTL and passed-in class
const spanClass = computed(() => ({
  'dir-rtl': isRTL,
  [properties.class]: properties.class,
}));

// Reactive ref to store the result of the async check
const canReviseSubmission = ref(false);

// Loading state to prevent multiple clicks
const isEnablingRevision = ref(false);

// Async function to check if submission can be revised
async function checkCanReviseSubmission() {
  try {
    const result = await formService.checkSubmitterRevision(
      properties.submissionId
    );
    canReviseSubmission.value = result.data;
  } catch {
    canReviseSubmission.value = false;
  }
}

const router = useRouter();
const notificationStore = useNotificationStore();

async function handleRevision() {
  // Prevent multiple clicks while request is in progress
  if (isEnablingRevision.value) {
    return;
  }

  isEnablingRevision.value = true;

  try {
    const response = await formService.performSubmitterRevision(
      properties.submissionId
    );

    // If response is 200, navigate to Edit Revision
    if (response.status === 200) {
      router.push({
        name: 'UserFormDraftEdit',
        query: {
          s: properties.submissionId,
        },
      });
    } else if (response.status === 400) {
      // If response is 400, failed the check, so hide the button
      canReviseSubmission.value = false;
    }
    // Any other error will be caught by the catch block
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.submitterRevision.recallErrMsg'),
      consoleError: t('trans.submitterRevision.recallConsErrMsg', {
        submissionId: properties.submissionId,
        error: error,
      }),
    });
  } finally {
    // Always reset loading state when request completes
    isEnablingRevision.value = false;
  }
}

// Watch for changes in submissionId or formId and re-check
watch(
  () => [properties.submissionId],
  () => {
    if (properties.submissionId) {
      checkCanReviseSubmission();
    }
  },
  { immediate: true }
);

// Also check when component mounts
onMounted(() => {
  if (properties.submissionId) {
    checkCanReviseSubmission();
  }
});

defineExpose({
  handleRevision,
  canReviseSubmission,
  isEnablingRevision,
});
</script>

<template>
  <span v-if="canReviseSubmission" :class="spanClass">
    <v-btn
      color="primary"
      variant="outlined"
      :title="$t('trans.submitterRevision.recall')"
      :loading="isEnablingRevision"
      :disabled="isEnablingRevision"
      @click="handleRevision"
      ><span :lang="locale">{{
        $t('trans.submitterRevision.recall')
      }}</span></v-btn
    >
  </span>
</template>
