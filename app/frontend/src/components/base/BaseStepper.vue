<script>
import { mapState } from 'pinia';
import { useFormStore } from '~/store/form';
import { IdentityProviders } from '~/utils/constants';

export default {
  name: 'BaseStepper',
  props: {
    step: {
      type: Number,
      default: 1,
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
    <v-stepper v-model="creatorStep">
      <v-stepper-header>
        <v-stepper-item :complete="creatorStep > 1" value="1" :lang="lang">
          <slot name="setUpFormTitle">
            {{ $t('trans.baseStepper.setUpForm') }}
          </slot>
        </v-stepper-item>
        <v-divider />
        <v-stepper-item :complete="creatorStep > 2" value="1" :lang="lang">
          <slot name="setUpFormTitle">
            {{ $t('trans.baseStepper.designForm') }}
          </slot>
        </v-stepper-item>
        <v-divider />
        <v-stepper-item :complete="creatorStep > 3" value="1" :lang="lang">
          <slot name="setUpFormTitle">
            {{ $t('trans.baseStepper.manageForm') }}
          </slot>
        </v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <v-stepper-window-item value="1">
          <div>
            <slot name="setUpForm"></slot>
          </div>
        </v-stepper-window-item>
        <v-stepper-window-item value="2">
          <div>
            <slot name="designForm"></slot>
          </div>
        </v-stepper-window-item>
        <v-stepper-window-item value="3">
          <div>
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
</style>

step
