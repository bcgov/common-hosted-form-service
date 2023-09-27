<template>
  <BaseStepper :step="stepper">
    <template #setUpForm>
      <v-form ref="settingsForm" v-model="settingsFormValid">
        <h1 :lang="lang">
          {{ $t('trans.create.formSettings') }}
        </h1>
        <FormSettings />
        <BasePanel class="my-6">
          <template #title>
            <span :lang="lang">{{
              $t('trans.create.disclaimer')
            }}</span></template
          >
          <FormDisclaimer />

          <v-checkbox :rules="disclaimerRules" required>
            <template #label>
              <span :class="{ 'mr-2': isRTL }" :lang="lang">{{
                $t('trans.create.disclaimerStmt')
              }}</span>
            </template>
          </v-checkbox>
        </BasePanel>
      </v-form>
      <v-btn
        class="py-4"
        color="primary"
        :disabled="!settingsFormValid"
        @click="reRenderFormDesigner"
      >
        <span :lang="lang">{{ $t('trans.create.continue') }}</span>
      </v-btn>
    </template>
    <template #designForm>
      <FormDesigner ref="formDesigner" />
      <v-btn class="my-4" outlined @click="step = 1">
        <span :lang="lang">{{ $t('trans.create.back') }}</span>
      </v-btn>
    </template>
  </BaseStepper>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import FormDesigner from '@/components/designer/FormDesigner.vue';
import FormSettings from '@/components/designer/FormSettings.vue';
import FormDisclaimer from '@/components/designer/FormDisclaimer.vue';
import { IdentityMode } from '@/utils/constants';

export default {
  name: 'FormCreate',
  components: {
    FormDesigner,
    FormSettings,
    FormDisclaimer,
  },
  computed: {
    ...mapFields('form', ['form.idps', 'form.isDirty', 'form.userType']),
    ...mapGetters('form', ['isRTL', 'lang']),
    stepper() {
      return this.step;
    },
  },
  data() {
    return {
      step: 1,
      settingsFormValid: false,
      disclaimerRules: [(v) => !!v || this.$t('trans.create.agreementErrMsg')],
    };
  },
  methods: {
    ...mapActions('form', ['listFCProactiveHelp', 'resetForm']),
    reRenderFormDesigner() {
      this.step = 2;
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
      ? next(window.confirm(this.$t('trans.create.confirmPageNav')))
      : next();
  },
};
</script>
