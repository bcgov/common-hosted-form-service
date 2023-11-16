<script>
import { mapActions, mapState } from 'pinia';

import BaseStepper from '~/components/base/BaseStepper.vue';
import BasePanel from '~/components/base/BasePanel.vue';
import FormDesigner from '~/components/designer/FormDesigner.vue';
import FormDisclaimer from '~/components/designer/FormDisclaimer.vue';
import FormSettings from '~/components/designer/FormSettings.vue';
import { i18n } from '~/internationalization';
import { useFormStore } from '~/store/form';
import { IdentityMode, IdentityProviders } from '~/utils/constants';

export default {
  components: {
    BaseStepper,
    BasePanel,
    FormDesigner,
    FormSettings,
    FormDisclaimer,
  },
  beforeRouteLeave(_to, _from, next) {
    this.form.isDirty
      ? next(window.confirm(i18n.t('trans.create.confirmPageNav')))
      : next();
  },
  data() {
    return {
      step: 1,
      settingsFormValid: false,
      disclaimerCheckbox: false,
      disclaimerRules: [(v) => !!v || i18n.t('trans.create.agreementErrMsg')],
    };
  },
  computed: {
    ...mapState(useFormStore, ['form', 'isRTL', 'lang']),
    IDP: () => IdentityProviders,
    stepper() {
      return this.step;
    },
  },
  watch: {
    form() {
      if (this.form.userType === IdentityMode.LOGIN && this.$refs.settingsForm)
        this.$refs.settingsForm.validate();
    },
  },
  created() {
    this.resetForm();
  },
  async mounted() {
    await this.listFCProactiveHelp();
    this.$nextTick(() => {
      this.onFormLoad();
    });
  },
  methods: {
    ...mapActions(useFormStore, ['listFCProactiveHelp', 'resetForm']),
    reRenderFormDesigner() {
      this.step = 2;
      this.onFormLoad();
    },
    onFormLoad() {
      if (this.$refs?.formDesigner) this.$refs.formDesigner.onFormLoad();
    },
  },
};
</script>

<template>
  <BaseStepper :step="stepper">
    <template #setUpForm>
      <v-form ref="settingsForm" v-model="settingsFormValid">
        <h1 :lang="lang">
          {{ $t('trans.create.formSettings') }}
        </h1>
        <FormSettings />

        <BasePanel class="my-6">
          <template #title
            ><span :lang="lang">{{
              $t('trans.create.disclaimer')
            }}</span></template
          >
          <FormDisclaimer />

          <v-checkbox
            v-model="disclaimerCheckbox"
            :rules="disclaimerRules"
            required="true"
          >
            <template #label>
              <span :class="{ 'mr-2': isRTL }" :lang="lang">{{
                $t('trans.create.disclaimerStmt')
              }}</span>
            </template>
          </v-checkbox>
        </BasePanel>
      </v-form>
      <v-btn
        :disabled="!settingsFormValid"
        color="primary"
        data-test="continue-btn"
        @click="reRenderFormDesigner()"
      >
        {{ $t('trans.create.continue') }}
      </v-btn>
    </template>
    <template #designForm>
      <FormDesigner ref="formDesigner" />
      <v-btn variant="outlined" data-test="back-btn" @click="step = 1">
        <span :lang="lang">{{ $t('trans.create.back') }}</span>
      </v-btn>
    </template>
  </BaseStepper>
</template>
