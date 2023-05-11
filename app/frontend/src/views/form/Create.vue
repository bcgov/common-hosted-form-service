<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <h1 class="my-6 text-center">Create New Form</h1>
    <BaseStepper :creatorStep="creatorStep" class="elevation-0">
      <BaseStepperHeader class="elevation-0 px-0">
        <BaseStepperStep :complete="creatorStep > 1" :step="1" class="pl-1">
          Set up Form
        </BaseStepperStep>
        <span class="divider"></span>
        <BaseStepperStep :complete="creatorStep > 2" :step="2" class="pl-1">
          Design Form
        </BaseStepperStep>
      </BaseStepperHeader>

      <BaseStepperItems>
        <BaseStepperContent :step="1" class="pa-1">
          <v-form ref="settingsForm" v-model="settingsFormValid">
            <h1>Form Settings</h1>
            <FormSettings />

            <BasePanel class="my-6">
              <template #title>Disclaimer</template>
              <FormDisclaimer />

              <v-checkbox
                v-model="checkbox"
                :rules="disclaimerRules"
                required="true"
                label="I agree to the disclaimer and statement of responsibility for Form Designers"
              />
            </BasePanel>
          </v-form>
          <v-btn class="py-4" color="primary" @click="reRenderFormDesigner">
            <span>Continue</span>
          </v-btn>
        </BaseStepperContent>
        <BaseStepperContent :step="2" class="pa-1">
          <FormDesigner ref="formDesigner" />
          <v-btn class="my-4" variant="outlined" @click="creatorStep = 1">
            <span>Back</span>
          </v-btn>
        </BaseStepperContent>
      </BaseStepperItems>
    </BaseStepper>
  </BaseSecure>
</template>

<script>
import { nextTick } from 'vue';
import { mapActions } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import FormDesigner from '@src/components/designer/FormDesigner.vue';
import FormSettings from '@src/components/designer/FormSettings.vue';
import FormDisclaimer from '@src/components/designer/FormDisclaimer.vue';
import { IdentityMode, IdentityProviders } from '@src/utils/constants';

export default {
  name: 'FormCreate',
  components: {
    FormDesigner,
    FormSettings,
    FormDisclaimer,
  },
  beforeRouteLeave(_to, _from, next) {
    this.isDirty
      ? next(
          window.confirm(
            'Do you really want to leave this page? Changes you made will not be saved.'
          )
        )
      : next();
  },
  data() {
    return {
      creatorStep: 1,
      settingsFormValid: false,
      checkbox: false,
      disclaimerRules: [
        (v) => !!v || 'You must agree to the privacy disclaimer shown above.',
      ],
    };
  },
  computed: {
    ...mapFields('form', ['form.idps', 'form.isDirty', 'form.userType']),
    IDP: () => IdentityProviders,
  },
  watch: {
    idps() {
      if (this.userType === IdentityMode.LOGIN && this.$refs.settingsForm) {
        this.$refs.settingsForm.validate();
      }
    },
  },
  created() {
    this.resetForm();
  },
  mounted() {
    this.listFCProactiveHelp();
    nextTick(() => {
      this.$refs.formDesigner.onFormLoad();
    });
  },
  methods: {
    ...mapActions('form', ['listFCProactiveHelp', 'resetForm']),
    reRenderFormDesigner() {
      this.creatorStep = 2;
      this.$refs.formDesigner.onFormLoad();
    },
  },
};
</script>

<style lang="scss" scoped>
/* unset 'overflow: hidden' from all parents of FormDesigner, so FormDesigner's 'sticky' components menu sticks. */
.v-stepper,
.v-stepper__items,
.v-stepper ::deep .v-stepper__wrapper {
  overflow: initial !important;
}
span.divider {
  flex-grow: 1;
  border-bottom: 1px solid lightgray;
  margin: 10px 0px;
}
</style>
