<script setup>
import { ref } from 'vue';

import { useFormStore } from '~/store/form';

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

const emits = defineEmits(['deleted']);

const formStore = useFormStore();

const showDeleteDialog = ref(false);

async function deleteSubmission() {
  await formStore.deleteSubmission(properties.submissionId);
  showDeleteDialog.value = false;
  emits('deleted');
}
</script>

<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          color="red"
          :disabled="disabled"
          icon
          v-bind="props"
          @click="showDeleteDialog = true"
        >
          <v-icon>delete</v-icon>
        </v-btn>
      </template>
      <span
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
      @continue-dialog="deleteSubmission"
    >
      <template #title>{{
        $t('trans.deleteSubmission.confirmDeletion')
      }}</template>
      <template #text>
        {{ $t('trans.deleteSubmission.deleteWarning') }}
        {{
          isDraft
            ? "$t('trans.deleteSubmission.drafts')"
            : "$t('trans.deleteSubmission.formSubmission')"
        }}?
      </template>
      <template #button-text-continue>
        <span>{{ $t('trans.deleteSubmission.delete') }}</span>
      </template>
    </BaseDialog>
  </span>
</template>
