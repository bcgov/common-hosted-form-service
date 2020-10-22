<template>
  <BaseSecure>
    <h1 class="my-6 text-center">Create New Form</h1>
    <v-stepper v-model="creatorStep" class="elevation-0">
      <v-stepper-header class="elevation-0 px-0">
        <v-stepper-step :complete="creatorStep > 1" step="1" class="pl-1">
          Set up Form
        </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="creatorStep > 2" step="2" class="pr-1">
          Design Form
        </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1" class="pa-1">
          <v-form ref="settingsForm" v-model="settingsFormValid">
            <h1>Form Settings</h1>
            <FormSettings />
          </v-form>
          <v-btn
            class="py-4"
            color="primary"
            :disabled="!settingsFormValid"
            @click="creatorStep = 2"
          >
            <span>Continue</span>
          </v-btn>
        </v-stepper-content>

        <v-stepper-content step="2" class="pa-1">
          <FormDesigner />
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
import { IdentityMode } from '@/utils/constants';

export default {
  name: 'FormCreate',
  components: {
    FormDesigner,
    FormSettings,
  },
  computed: mapFields('form', ['form.idps', 'form.userType']),
  data() {
    return {
      creatorStep: 1,
      settingsFormValid: false,
    };
  },
  methods: mapActions('form', ['resetForm']),
  created() {
    this.resetForm();
  },
  watch: {
    idps() {
      if (this.userType === IdentityMode.LOGIN && this.$refs.settingsForm)
        this.$refs.settingsForm.validate();
    },
  },
  beforeRouteLeave(to, from, next) {
    const answer = window.confirm('Do you really want to leave this page?');
    if (answer) {
      next();
    } else {
      next(false);
    }
  },
};
</script>
