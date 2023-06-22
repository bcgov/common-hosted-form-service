<script setup>
defineProps({
  modelValue: {
    default: false,
    type: Boolean,
  },
  type: {
    default: null,
    type: String,
  },
  showCloseButton: {
    default: false,
    type: Boolean,
  },
  width: {
    default: '500',
    type: String,
  },
  enableCustomButton: {
    default: false,
    type: Boolean,
  },
});

const emit = defineEmits([
  'update:modelValue',
  'close-dialog',
  'continue-dialog',
  'delete-dialog',
  'custom-dialog',
]);

function closeDialog() {
  emit('close-dialog');
}

function continueDialog() {
  emit('continue-dialog');
}

function deleteDialog() {
  emit('delete-dialog');
}

function customDialog() {
  emit('custom-dialog');
}
</script>

<template>
  <v-dialog
    :max-width="width"
    persistent
    :model-value="modelValue"
    @click:outside="closeDialog"
    @keydown.esc="closeDialog"
  >
    <v-card>
      <div>
        <div v-if="showCloseButton">
          <v-spacer />
          <v-icon
            color="primary"
            class="float-right m-3"
            icon="mdi-close"
            @click="closeDialog"
          ></v-icon>
        </div>
        <v-card-title class primary-title>
          <slot name="title"></slot>
        </v-card-title>
        <v-card-text>
          <div class="dialog-icon">
            <slot name="icon">
              <v-icon size="medium">default-icon</v-icon>
            </slot>
          </div>
          <div class="dialog-text">
            <slot name="text">{{ $t('trans.baseDialog.defaultText') }}</slot>
          </div>
        </v-card-text>
      </div>
      <v-card-actions class="justify-center">
        <div v-if="type === 'OK'">
          <v-btn
            class="mb-5"
            color="primary"
            variant="flat"
            @click="closeDialog"
          >
            <slot name="button-text">
              <span>{{ $t('trans.baseDialog.ok') }}</span>
            </slot>
          </v-btn>
        </div>
        <div v-else-if="type === 'CONTINUE'">
          <v-btn
            data-test="continue-btn-continue"
            class="mb-5 mr-5"
            color="primary"
            variant="flat"
            @click="continueDialog"
          >
            <slot name="button-text-continue">
              <span>{{ $t('trans.baseDialog.continue') }}</span>
            </slot>
          </v-btn>
          <v-btn
            data-test="continue-btn-cancel"
            class="mb-5"
            variant="outlined"
            @click="closeDialog"
          >
            <slot name="button-text-cancel">
              <span>{{ $t('trans.baseDialog.cancel') }}</span>
            </slot>
          </v-btn>
        </div>
        <div v-else-if="type === 'SAVEDDELETE'">
          <v-btn
            class="mb-5 mr-5"
            color="primary"
            variant="flat"
            @click="continueDialog"
          >
            <slot name="button-text-continue">
              <span>{{ $t('trans.baseDialog.continue') }}</span>
            </slot>
          </v-btn>
          <v-btn class="mb-5" variant="outlined" @click="deleteDialog">
            <slot name="button-text-delete">
              <span>{{ $t('trans.baseDialog.cancel') }}</span>
            </slot>
          </v-btn>
        </div>
        <div v-else-if="type === 'CUSTOM'">
          <v-btn
            class="mb-5 mr-5"
            color="primary"
            variant="flat"
            @click="continueDialog"
          >
            <slot name="button-text-continue">
              <span>{{ $t('trans.baseDialog.continue') }}</span>
            </slot>
          </v-btn>
          <v-btn
            v-if="enableCustomButton"
            class="mb-5 mr-5"
            color="primary"
            variant="flat"
            @click="customDialog"
          >
            <slot name="button-text-custom">
              <span>{{ $t('trans.baseDialog.custom') }}</span>
            </slot>
          </v-btn>
          <v-btn class="mb-5" variant="outlined" @click="closeDialog">
            <slot name="button-text-cancel">
              <span>{{ $t('trans.baseDialog.cancel') }}</span>
            </slot>
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.v-card__text {
  display: flex !important;
  padding: 1.5rem;
}
.dialog-icon {
  margin-right: 1rem;
  object-fit: contain;
  align-self: flex-start;
}
.dialog-text {
  flex: 1 1 auto;
  width: 90%;
}
</style>
