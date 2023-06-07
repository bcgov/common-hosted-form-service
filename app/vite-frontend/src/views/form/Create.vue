<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseSecure from '~/components/base/BaseSecure.vue';
import BasePanel from '~/components/base/BasePanel.vue';
import FormDesigner from '~/components/designer/FormDesigner.vue';
import FormDisclaimer from '~/components/designer/FormDisclaimer.vue';
import FormSettings from '~/components/designer/FormSettings.vue';
import { IdentityProviders } from '~/utils/constants';

const { t } = useI18n({ useScope: 'global' });

const IDP = computed(() => IdentityProviders);

const step = ref(1);
const settingsForm = ref(null);
const settingsFormValid = ref(false);
const disclaimerCheckbox = ref(false);
const disclaimerRules = [(v) => !!v || t('trans.create.confirmPageNav')];

onMounted(() => {
  if (settingsForm?.value) {
    settingsForm.value.validate();
  }
});
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
