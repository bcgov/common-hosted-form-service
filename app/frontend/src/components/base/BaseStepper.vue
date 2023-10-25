<script>
import { mapState } from 'pinia';
import BaseSecure from '~/components/base/BaseSecure.vue';
import { useFormStore } from '~/store/form';
import { IdentityProviders } from '~/utils/constants';

export default {
  name: 'BaseStepper',
  components: {
    BaseSecure,
  },
  props: {
    step: {
      type: Number,
      required: true,
    },
  },
  computed: {
    ...mapState(useFormStore, ['lang', 'isRTL']),
    IDP: () => IdentityProviders,
    creatorStep() {
      return this.step;
    },
  },
};
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR]" :class="{ 'dir-rtl': isRTL }">
    <v-stepper
      v-model="creatorStep"
      alt-labels
      class="elevation-0 d-flex flex-column"
    >
      <v-stepper-header class="elevation-0 px-0 align-self-center">
        <v-stepper-item
          :complete="creatorStep > 1"
          :step="creatorStep"
          :value="1"
          :lang="lang"
          class="pl-1 pr-1"
        >
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            <slot name="setUpFormTitle">
              {{ $t('trans.baseStepper.setUpForm') }}
            </slot>
          </span>
        </v-stepper-item>
        <v-divider />
        <v-stepper-item
          :complete="creatorStep > 2"
          :step="creatorStep"
          :value="2"
          :lang="lang"
          class="pl-1 pr-1"
        >
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            <slot name="designFormTitle">
              {{ $t('trans.baseStepper.designForm') }}
            </slot>
          </span>
        </v-stepper-item>
        <v-divider />
        <v-stepper-item
          :complete="creatorStep === 3"
          :step="creatorStep"
          :value="3"
          :lang="lang"
          class="pl-1 pr-1"
        >
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            <slot name="manageFormTitle">
              {{ $t('trans.baseStepper.manageForm') }}
            </slot>
          </span>
        </v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <v-stepper-window-item :value="1" class="pa-1">
          <div class="mt-4">
            <slot name="setUpForm"></slot>
          </div>
        </v-stepper-window-item>
        <v-stepper-window-item :value="2" class="pa-1">
          <div class="mt-4">
            <slot name="designForm"></slot>
          </div>
        </v-stepper-window-item>
        <v-stepper-window-item :value="3" class="pa-1">
          <div class="mt-4">
            <slot name="manageForm"></slot>
          </div>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </BaseSecure>
</template>

<style lang="scss" scoped>
/* unset 'overflow: hidden' from all parents of FormDesigner, so FormDesigner's 'sticky' components menu sticks. */
.v-stepper,
.v-stepper__items,
.v-stepper ::v-deep .v-stepper__wrapper {
  overflow: initial !important;
}

.v-stepper,
.v-stepper-window {
  overflow: initial !important;
}

.v-stepper.v-sheet {
  box-shadow: none !important;
}

.v-stepper-header {
  box-shadow: none !important;
  width: 60%;
}
</style>

step
