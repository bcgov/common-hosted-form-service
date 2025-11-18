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
          mdi-information
        </v-icon>
        {{ $t('trans.localAutosave.title') }}
      </div>
    </template>

    <template #text>
      <p class="text-body-1">
        {{ $t('trans.localAutosave.message') }}
      </p>
    </template>

    <template #button-text-continue>
      <span>{{ $t('trans.localAutosave.restore') }}</span>
    </template>

    <template #button-text-close>
      <span>{{ $t('trans.localAutosave.discard') }}</span>
    </template>
  </BaseDialog>
</template>

<script setup>
import { computed } from 'vue';
import BaseDialog from '~/components/base/BaseDialog.vue';

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(['update:show', 'restore', 'discard']);

const showDialog = computed({
  get: () => props.show,
  set: (v) => emit('update:show', v),
});

function handleRestore() {
  emit('restore');
  showDialog.value = false;
}

function handleDiscard() {
  emit('discard');
  showDialog.value = false;
}
</script>
