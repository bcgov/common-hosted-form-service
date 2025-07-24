<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import FormModuleSettings from '~/components/formModule/FormModuleSettings.vue';
import FormModuleVersionSettings from '~/components/formModuleVersion/FormModuleVersionSettings.vue';
import { useFormModuleVersion } from '~/composables/formModule';
import { useFormModuleStore } from '~/store/formModule';
import { useNotificationStore } from '~/store/notification';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();

const formModuleStore = useFormModuleStore();
const notificationStore = useNotificationStore();

const { formModule } = storeToRefs(formModuleStore);

const settingsFormModule = ref(null);

const {
  saving,
  valid: settingsFormModuleValid,
  submitFormModuleVersion,
} = useFormModuleVersion();

watch(
  () => formModule.value.identityProviders,
  () => {
    if (formModule.value.idpTypes.length < 1 && settingsFormModuleValid.value) {
      settingsFormModule.value.validate();
    }
  }
);

async function handleSubmit() {
  try {
    await formModuleStore.createFormModule({
      pluginName: formModule.value.pluginName,
      identityProviders: formModule.value.idpTypes.map((i) => ({ code: i })),
    });

    await submitFormModuleVersion();

    router.push({
      name: 'FormModuleManage',
      query: {
        fm: formModule.value.id,
      },
    });
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formModuleImport.createFormModuleVersionErr'),
      consoleError: t('trans.formModuleImport.createFormModuleVersionConsErr', {
        error: error,
      }),
    });
  }
}

Promise.all([
  formModuleStore.resetFormModule(),
  formModuleStore.resetFormModuleVersion(),
]);

onBeforeRouteLeave((_to, _from, next) => {
  formModuleStore.isDirty
    ? next(window.confirm(t('trans.formModuleAddVersion.confirmLeave')))
    : next();
});
</script>

<template>
  <v-container>
    <h1 class="mt-6" :lang="locale">
      {{ $t('trans.formModuleImport.importFormModule') }}
    </h1>
    <v-form ref="settingsFormModule" v-model="settingsFormModuleValid">
      <FormModuleSettings />
      <FormModuleVersionSettings />
    </v-form>
    <v-btn
      size="large"
      color="primary"
      :disabled="!settingsFormModuleValid"
      :loading="saving"
      @click="handleSubmit"
    >
      {{ $t('trans.formModuleImport.submit') }}
    </v-btn>
  </v-container>
</template>
