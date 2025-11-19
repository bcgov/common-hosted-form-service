<template>
  <BaseDialog
    v-model="showDialog"
    type="CONTINUE"
    :show-close-button="true"
    @close-dialog="handleDiscard"
    @continue-dialog="handleRestore"
  >
    <!-- Title -->
    <template #title>
      <div>
        <div class="d-flex align-center">
          <v-icon color="info" class="mr-2" size="20" aria-hidden="true">
            mdi-information
          </v-icon>
          {{ $t('trans.localAutosave.title') }}
        </div>
        <v-divider class="mt-3" />
      </div>
    </template>

    <!-- Body -->
    <template #text>
      <div>
        <p class="text-body-1 mb-3">
          {{ $t('trans.localAutosave.message') }}
        </p>
        <v-divider class="mt-3" />
      </div>
    </template>

    <!-- Buttons -->
    <template #button-text-continue>
      <span>{{ $t('trans.localAutosave.restore') }}</span>
    </template>

    <template #button-text-cancel>
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
