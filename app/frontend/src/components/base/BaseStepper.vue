<template>
  <BaseSecure :idp="[IDP.IDIR]" :class="{ 'dir-rtl': isRTL }">
    <v-stepper
      v-model="creatorStep"
      class="elevation-0 d-flex flex-column"
      alt-labels
    >
      <v-stepper-header
        style="width: 40%"
        class="elevation-0 px-0 align-self-center"
      >
        <v-stepper-step :complete="creatorStep > 1" step="1" class="pl-1 pr-1">
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.baseStepper.setUpForm') }}
          </span>
        </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="creatorStep > 2" step="2" class="pl-1 pr-1">
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.baseStepper.designForm') }}
          </span>
        </v-stepper-step>
        <v-divider />
        <v-stepper-step
          :complete="creatorStep === 3"
          step="3"
          class="pl-1 pr-1"
        >
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.baseStepper.manageForm') }}
          </span>
        </v-stepper-step>
      </v-stepper-header>
      <v-stepper-items>
        <v-stepper-content step="1" class="pa-1">
          <div class="mt-4">
            <slot name="setUpForm"></slot>
          </div>
        </v-stepper-content>
        <v-stepper-content step="2" class="pa-1">
          <div class="mt-4">
            <slot name="designForm"></slot>
          </div>
        </v-stepper-content>
        <v-stepper-content step="3" class="pa-1">
          <div class="mt-4">
            <slot name="manageForm"></slot>
          </div>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </BaseSecure>
</template>
<script>
import { mapGetters } from 'vuex';
import { IdentityProviders } from '@/utils/constants';
export default {
  name: 'BaseStepper',
  props: {
    step: Number,
  },
  computed: {
    ...mapGetters('form', ['lang', 'isRTL']),
    IDP: () => IdentityProviders,
    creatorStep() {
      return this.step;
    },
  },
};
</script>
<style lang="scss" scoped>
/* unset 'overflow: hidden' from all parents of FormDesigner, so FormDesigner's 'sticky' components menu sticks. */
.v-stepper,
.v-stepper__items,
.v-stepper ::v-deep .v-stepper__wrapper {
  overflow: initial !important;
}
</style>

step
