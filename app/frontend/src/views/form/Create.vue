<template>
  <div>
    <h1 class="my-6 text-center">Create New Form</h1>
    <!-- TODO: Lift stepper logic here and use newer separated components! -->
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
            <FormSettings />
          </v-form>
          <v-btn
            color="primary"
            :disabled="!settingsFormValid"
            @click="creatorStep = 2"
          >
            <span>Continue</span>
          </v-btn>
        </v-stepper-content>

        <v-stepper-content step="2" class="pa-0">
          <v-btn
            outlined
            @click="creatorStep = 1"
          >
            <span>Back</span>
          </v-btn>
          FormBuilder.vue (TBD)
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
    <FormCreator />
  </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields';

import FormCreator from '@/components/designer/FormCreator.vue';
import FormSettings from '@/components/designer/FormSettings.vue';

export default {
  name: 'FormCreate',
  components: {
    FormCreator,
    FormSettings,
  },
  computed: mapFields('form', ['form.idps']),
  data() {
    return {
      creatorStep: 1,
      settingsFormValid: false,
    };
  },
  watch: {
    idps() {
      if (this.$refs.settingsForm) this.$refs.settingsForm.validate();
    },
  },
};
</script>
