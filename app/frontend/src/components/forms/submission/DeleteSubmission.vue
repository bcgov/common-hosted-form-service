<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseDialog from '~/components/base/BaseDialog.vue';
import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  isDraft: {
    type: Boolean,
    default: false,
  },
  submissionId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['deleted']);

const showDeleteDialog = ref(false);

const formStore = useFormStore();

const { isRTL } = storeToRefs(formStore);

async function delSub() {
  await formStore.deleteSubmission(properties.submissionId);
  showDeleteDialog.value = false;
  emit('deleted');
}

defineExpose({ emit, delSub });
</script>

<template>
  <span :class="{ 'dir-rtl': isRTL }">
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          class="mx-1"
          color="red"
          :disabled="disabled"
          v-bind="props"
          size="x-small"
          density="default"
          icon="mdi:mdi-delete"
          :title="`${$t('trans.deleteSubmission.deleteThis')}${
            isDraft
              ? $t('trans.deleteSubmission.drafts')
              : $t('trans.deleteSubmission.submission')
          }`"
          @click="showDeleteDialog = true"
        />
      </template>
      <span :lang="locale"
        >{{ $t('trans.deleteSubmission.deleteThis') }}
        {{
          isDraft
            ? $t('trans.deleteSubmission.drafts')
            : $t('trans.deleteSubmission.submission')
        }}</span
      >
    </v-tooltip>

    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="delSub"
    >
      <template #title>
        <span :lang="locale">{{
          $t('trans.deleteSubmission.confirmDeletion')
        }}</span></template
      >
      <template #text>
        <span :lang="locale">
          {{ $t('trans.deleteSubmission.deleteWarning') }}
          {{
            isDraft
              ? $t('trans.deleteSubmission.drafts')
              : $t('trans.deleteSubmission.formSubmission')
          }}?</span
        >
      </template>
      <template #button-text-continue>
        <span :lang="locale">{{ $t('trans.deleteSubmission.delete') }}</span>
      </template>
    </BaseDialog>
  </span>
</template>
