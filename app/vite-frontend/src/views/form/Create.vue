<script>
import { mapActions, mapState } from 'pinia';
import BaseSecure from '~/components/base/BaseSecure.vue';
import BasePanel from '~/components/base/BasePanel.vue';
import FormDesigner from '~/components/designer/FormDesigner.vue';
import FormDisclaimer from '~/components/designer/FormDisclaimer.vue';
import FormSettings from '~/components/designer/FormSettings.vue';
import { i18n } from '~/internationalization';
import { useFormStore } from '~/store/form';
import { IdentityMode, IdentityProviders } from '~/utils/constants';

export default {
  components: {
    BaseSecure,
    BasePanel,
    FormDesigner,
    FormSettings,
    FormDisclaimer,
  },
  beforeRouteLeave(_to, _from, next) {
    this.isDirty
      ? next(window.confirm(i18n.t('trans.create.agreementErrMsg')))
      : next();
  },
  data() {
    return {
      step: 1,
      settingsFormValid: false,
      disclaimerCheckbox: false,
      disclaimerRules: [(v) => !!v || i18n.t('trans.create.confirmPageNav')],
    };
  },
  computed: {
    ...mapState(useFormStore, ['form']),
    IDP: () => IdentityProviders,
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
  mounted() {
    this.listFCProactiveHelp();
    this.$nextTick(() => {
      if (this.$refs?.formDesigner) this.$refs.formDesigner.onFormLoad();
    });
  },
  methods: {
    ...mapActions(useFormStore, ['listFCProactiveHelp', 'resetForm']),
    reRenderFormDesigner() {
      this.step = 2;
      if (this.$refs?.formDesigner) this.$refs.formDesigner.onFormLoad();
    },
  },
};
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <h1 class="my-6 text-center">{{ $t('trans.create.createNewForm') }}</h1>
    <v-container v-if="step === 1" class="elevation-0">
      <v-form ref="settingsForm" v-model="settingsFormValid">
        <FormSettings />

        <BasePanel class="my-6">
          <template #title>{{ $t('trans.create.disclaimer') }}</template>
          <FormDisclaimer />

          <v-checkbox
            v-model="disclaimerCheckbox"
            :rules="disclaimerRules"
            required="true"
            :label="$t('trans.create.disclaimerStmt')"
          />
        </BasePanel>
      </v-form>
      <v-btn :disabled="!settingsFormValid" color="primary" @click="step = 2">{{
        $t('trans.create.continue')
      }}</v-btn>
    </v-container>
    <v-container v-if="step === 2">
      <FormDesigner ref="formDesigner" />
      <v-btn variant="outlined" @click="step = 1">{{
        $t('trans.create.back')
      }}</v-btn>
    </v-container>
  </BaseSecure>
</template>
