<template>
  <BaseSecure :idp="IDP.IDIR">
    <v-stepper
      v-model="creatorStep"
      class="elevation-0 d-flex flex-column"
      alt-labels
    >
      <v-stepper-header
        style="width: 40%"
        class="elevation-0 px-0 align-self-center"
      >
        <v-stepper-step :complete="creatorStep > 1" step="1" class="pl-1">
          Set up Form
        </v-stepper-step>
        <v-divider />
        <v-stepper-step
          :complete="creatorStep > 2"
          :editable="true"
          step="2"
          class="pr-1"
        >
          Design Form
        </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="creatorStep > 3" step="3" class="pr-1">
          Publish Form
        </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1" class="pa-1">
          <v-form ref="settingsForm" v-model="settingsFormValid">
            <h1>Form Settings</h1>
            <FormSettings />

            <BasePanel class="my-6">
              <template #title>Disclaimer</template>
              <FormDisclaimer />

              <v-checkbox
                :rules="disclaimerRules"
                required
                label="I agree to the disclaimer and statement of responsibility for Form Designers"
              />
            </BasePanel>
          </v-form>
          <v-btn
            class="py-4"
            color="primary"
            :disabled="!settingsFormValid"
            @click="reRenderFormDesigner"
          >
            <span>Continue</span>
          </v-btn>
        </v-stepper-content>
        <v-stepper-content step="2" class="pa-1">
          <FormDesigner ref="formDesigner" />
          <v-btn class="my-4" outlined @click="creatorStep = 1">
            <span>Back</span>
          </v-btn>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </BaseSecure>
</template>

<script>
import { mapActions } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import FormDesigner from '@/components/designer/FormDesigner.vue';
import FormSettings from '@/components/designer/FormSettings.vue';
import FormDisclaimer from '@/components/designer/FormDisclaimer.vue';
import { IdentityMode, IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormCreate',
  props: {
    isDesignView: Boolean,
  },
  components: {
    FormDesigner,
    FormSettings,
    FormDisclaimer,
  },
  computed: {
    ...mapFields('form', ['form.idps', 'form.isDirty', 'form.userType']),
    IDP: () => IdentityProviders,
  },
  data() {
    return {
      creatorStep: 1,
      settingsFormValid: false,
      disclaimerRules: [
        (v) => !!v || 'You must agree to the privacy disclaimer shown above.',
      ],
    };
  },
  methods: {
    ...mapActions('form', ['listFCProactiveHelp', 'resetForm']),
    reRenderFormDesigner() {
      this.creatorStep = 2;
      this.$refs.formDesigner.onFormLoad();
    },
  },
  created() {
    this.resetForm();
  },
  mounted() {
    this.listFCProactiveHelp();
    this.$nextTick(() => {
      this.$refs.formDesigner.onFormLoad();
    });
  },
  watch: {
    idps() {
      if (this.userType === IdentityMode.LOGIN && this.$refs.settingsForm)
        this.$refs.settingsForm.validate();
    },
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
