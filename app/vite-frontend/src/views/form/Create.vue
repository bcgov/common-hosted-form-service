<script setup>
import { computed, onMounted, ref } from 'vue';
import BaseSecure from '~/components/base/BaseSecure.vue';
import BasePanel from '~/components/base/BasePanel.vue';
import FormDesigner from '~/components/designer/FormDesigner.vue';
import FormDisclaimer from '~/components/designer/FormDisclaimer.vue';
import FormSettings from '~/components/designer/FormSettings.vue';
import { IdentityProviders } from '~/utils/constants';

const IDP = computed(() => IdentityProviders);

const step = ref(1);
const settingsForm = ref(null);
const settingsFormValid = ref(false);
const disclaimerCheckbox = ref(false);
const disclaimerRules = [
  (v) => !!v || 'You must agree to the privacy disclaimer shown above.',
];

onMounted(() => {
  if (settingsForm?.value) {
    settingsForm.value.validate();
  }
});
</script>

<template>
  <BaseSecure :idp="[IDP.IDIR]">
    <h1 class="my-6 text-center">Create New Form</h1>
    <v-container v-if="step === 1" class="elevation-0">
      <v-form ref="settingsForm" v-model="settingsFormValid">
        <FormSettings />

        <BasePanel class="my-6">
          <template #title>Disclaimer</template>
          <FormDisclaimer />

          <v-checkbox
            v-model="disclaimerCheckbox"
            :rules="disclaimerRules"
            required="true"
            label="I agree to the disclaimer and statement of responsibility for Form Designers"
          />
        </BasePanel>
      </v-form>
      <v-btn :disabled="!settingsFormValid" color="primary" @click="step = 2"
        >Continue</v-btn
      >
    </v-container>
    <v-container v-if="step === 2">
      <FormDesigner ref="formDesigner" />
      <v-btn variant="outlined" @click="step = 1">Back</v-btn>
    </v-container>
  </BaseSecure>
</template>
