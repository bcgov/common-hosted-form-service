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
    this.form.isDirty
      ? next(window.confirm(i18n.t('trans.create.confirmPageNav')))
      : next();
  },
  data() {
    return {
      creatorStep: 0,
      settingsFormValid: false,
      disclaimerCheckbox: false,
      disclaimerRules: [(v) => !!v || i18n.t('trans.create.agreementErrMsg')],
    };
  },
  computed: {
    ...mapState(useFormStore, ['form', 'isRTL', 'lang']),
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
      this.onFormLoad();
    });
  },
  methods: {
    ...mapActions(useFormStore, ['listFCProactiveHelp', 'resetForm']),
    reRenderFormDesigner() {
      this.creatorStep = 1;
      this.onFormLoad();
    },
    onFormLoad() {
      if (this.$refs?.formDesigner) this.$refs.formDesigner.onFormLoad();
    },
  },
};
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR]" :class="{ 'dir-rtl': isRTL }">
    <h1 class="my-6 text-center" :lang="lang">
      {{ $t('trans.create.createNewForm') }}
    </h1>
    <v-stepper v-model="creatorStep">
      <v-stepper-header>
        <v-stepper-item
          :complete="creatorStep > 0"
          :title="$t('trans.create.createNewForm')"
          value="1"
          :lang="lang"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          :complete="creatorStep > 1"
          :title="$t('trans.create.designForm')"
          value="2"
          :lang="lang"
        ></v-stepper-item>
      </v-stepper-header>
      <v-stepper-window>
        <v-stepper-window-item value="1">
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
        </v-stepper-window-item>
        <v-stepper-window-item value="2">
          <FormDesigner ref="formDesigner" />
          <v-btn
            variant="outlined"
            data-test="back-btn"
            @click="creatorStep = 0"
          >
            <span :lang="lang">{{ $t('trans.create.back') }}</span>
          </v-btn>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </BaseSecure>
</template>

<style lang="scss" scoped>
.v-stepper.v-sheet {
  box-shadow: none !important;
  border-radius: 0 !important;
}

.v-stepper-header {
  box-shadow: none !important;
}
</style>
