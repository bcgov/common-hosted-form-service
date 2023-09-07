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
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.create.setUpForm') }}
          </span>
        </v-stepper-step>
        <v-divider />
        <v-stepper-step
          :complete="creatorStep > 2"
          :editable="true"
          step="2"
          class="pr-1"
        >
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.create.designForm') }}
          </span>
        </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="creatorStep > 3" step="3" class="pr-1">
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.create.publishForm') }}
          </span>
        </v-stepper-step>
      </v-stepper-header>
      <v-stepper-items>
        <v-stepper-content step="2" class="pa-1">
          <FormDesigner
            class="mt-6"
            :draftId="d"
            :formId="f"
            :saved="sv"
            :versionId="v"
            @create-stepper="creatorStep = 1"
          />
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </BaseSecure>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import FormDesigner from '@/components/designer/FormDesigner.vue';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormDesign',
  components: {
    FormDesigner,
  },
  data() {
    return {
      creatorStep: 2,
    };
  },
  props: {
    d: String,
    f: String,
    sv: Boolean,
    v: String,
    svs: String,
    nv: {
      type: Boolean,
      default: false,
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.formDesigner.onFormLoad();
    });
  },

  methods: {
    ...mapActions('form', ['listFCProactiveHelp', 'deleteCurrentForm']),
  },
  computed: {
    ...mapGetters('form', ['form', 'isRTL', 'lang']),
    IDP: () => IdentityProviders,
  },
  beforeRouteLeave(_to, _from, next) {
    this.form.isDirty
      ? next(
          window.confirm(
            'Do you really want to leave this page? Changes you made will not be saved.'
          )
        )
      : next();
  },
  beforeMount() {
    this.listFCProactiveHelp();
  },
};
</script>
