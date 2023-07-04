<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <h1 class="my-6 text-center" :class="{ 'dir-rtl': isRTL }">
      {{ $t('trans.create.createNewForm') }}
    </h1>
    <v-stepper v-model="creatorStep" class="elevation-0">
      <v-stepper-header class="elevation-0 px-0">
        <v-stepper-step
          :complete="creatorStep > 1"
          step="1"
          class="pl-1"
          :class="{ 'dir-rtl': isRTL }"
        >
          {{ $t('trans.create.setUpForm') }}
        </v-stepper-step>
        <v-divider />
        <v-stepper-step
          :complete="creatorStep > 2"
          step="2"
          class="pr-1"
          :class="{ 'dir-rtl': isRTL }"
        >
          {{ $t('trans.create.designForm') }}
        </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1" class="pa-1" :class="{ 'dir-rtl': isRTL }">
          <v-form ref="settingsForm" v-model="settingsFormValid">
            <h1 :class="{ 'dir-rtl': isRTL }">
              {{ $t('trans.create.formSettings') }}
            </h1>
            <FormSettings />

            <BasePanel class="my-6" :class="{ 'dir-rtl': isRTL }">
              <template #title>{{ $t('trans.create.disclaimer') }}</template>
              <FormDisclaimer />

              <v-checkbox
                :rules="disclaimerRules"
                required
                :label="$t('trans.create.disclaimerStmt')"
              />
            </BasePanel>
          </v-form>
          <v-btn
            class="py-4"
            color="primary"
            :disabled="!settingsFormValid"
            @click="reRenderFormDesigner"
          >
            <span :class="{ 'dir-rtl': isRTL }">{{
              $t('trans.create.continue')
            }}</span>
          </v-btn>
        </v-stepper-content>
        <v-stepper-content step="2" class="pa-1">
          <FormDesigner ref="formDesigner" />
          <v-btn class="my-4" outlined @click="creatorStep = 1">
            <span :class="{ 'dir-rtl': isRTL }">{{
              $t('trans.create.back')
            }}</span>
          </v-btn>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </BaseSecure>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import FormDesigner from '@/components/designer/FormDesigner.vue';
import FormSettings from '@/components/designer/FormSettings.vue';
import FormDisclaimer from '@/components/designer/FormDisclaimer.vue';
import { IdentityMode, IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormCreate',
  components: {
    FormDesigner,
    FormSettings,
    FormDisclaimer,
  },
  computed: {
    ...mapFields('form', ['form.idps', 'form.isDirty', 'form.userType']),
    ...mapGetters('form', ['isRTL']),
    IDP: () => IdentityProviders,
  },
  data() {
    return {
      creatorStep: 1,
      settingsFormValid: false,
      disclaimerRules: [(v) => !!v || this.$t('trans.create.confirmPageNav')],
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
      ? next(window.confirm(this.$t('trans.create.agreementErrMsg')))
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
.dir-rtl {
  direction: rtl !important;
  text-align: right;
}
</style>
