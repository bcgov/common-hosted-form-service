<template>
  <v-dialog
    :max-width="width"
    persistent
    v-bind:value="value"
    @click:outside="closeDialog"
    @keydown.esc="closeDialog"
  >
    <v-card>
      <div class="dialog-body">
        <div v-if="showCloseButton">
          <v-spacer />
          <v-icon color="primary" class="float-right m-3" @click="closeDialog"
            >close</v-icon
          >
        </div>
        <v-card-title class primary-title>
          <slot name="title"></slot>
        </v-card-title>
        <v-card-text>
          <div class="dialog-icon">
            <slot name="icon">
              <v-icon medium>default-icon</v-icon>
            </slot>
          </div>
          <div class="dialog-text">
            <slot name="text">{{ $t('trans.baseDialog.defaultText') }}</slot>
          </div>
        </v-card-text>
      </div>
      <v-card-actions class="justify-center">
        <div v-if="type === 'OK'">
          <v-btn class="mb-5" color="primary" depressed @click="closeDialog">
            <slot name="button-text">
              <span>{{ $t('trans.baseDialog.ok') }}</span>
            </slot>
          </v-btn>
        </div>
        <div v-else-if="type === 'CONTINUE'">
          <v-btn
            class="mb-5 mr-5"
            color="primary"
            depressed
            @click="continueDialog"
          >
            <slot name="button-text-continue">
              <span>{{ $t('trans.baseDialog.continue') }}</span>
            </slot>
          </v-btn>
          <v-btn class="mb-5" outlined @click="closeDialog">
            <slot name="button-text-cancel">
              <span>{{ $t('trans.baseDialog.cancel') }}</span>
            </slot>
          </v-btn>
        </div>
        <div v-else-if="type === 'SAVEDDELETE'">
          <v-btn
            class="mb-5 mr-5"
            color="primary"
            depressed
            @click="continueDialog"
          >
            <slot name="button-text-continue">
              <span>{{ $t('trans.baseDialog.continue') }}</span>
            </slot>
          </v-btn>
          <v-btn class="mb-5" outlined @click="deleteDialog">
            <slot name="button-text-delete">
              <span>{{ $t('trans.baseDialog.cancel') }}</span>
            </slot>
          </v-btn>
        </div>
        <div v-else-if="type === 'CUSTOM'">
          <v-btn
            class="mb-5 mr-5"
            color="primary"
            depressed
            @click="continueDialog"
          >
            <slot name="button-text-continue">
              <span>{{ $t('trans.baseDialog.continue') }}</span>
            </slot>
          </v-btn>
          <v-btn
            class="mb-5 mr-5"
            color="primary"
            depressed
            @click="customDialog"
            v-if="enableCustomButton"
          >
            <slot name="button-text-custom">
              <span>{{ $t('trans.baseDialog.custom') }}</span>
            </slot>
          </v-btn>
          <v-btn class="mb-5" outlined @click="closeDialog">
            <slot name="button-text-cancel">
              <span>{{ $t('trans.baseDialog.cancel') }}</span>
            </slot>
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'BaseDialog',
  methods: {
    closeDialog() {
      this.$emit('close-dialog');
    },
    continueDialog() {
      this.$emit('continue-dialog');
    },
    deleteDialog() {
      this.$emit('delete-dialog');
    },
    customDialog() {
      this.$emit('custom-dialog');
    },
  },
  props: {
    value: {
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
  },
};
</script>

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
