<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

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
      settingsFormModuleValid.value = false;
    }
  }
);

onBeforeRouteLeave((_to, _from, next) => {
  formModule.isDirty
    ? next(window.confirm(t('trans.formModuleAddVersion.confirmLeave')))
    : next();
});

async function handleSubmit() {
  try {
    await submitFormModuleVersion();

    router.push({
      name: 'FormModuleManage',
      query: {
        fm: formModule.value.id,
      },
    });
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formModuleAddVersion.createFormModuleVersionErr'),
      consoleError: t(
        'trans.formModuleAddVersion.createFormModuleVersionConsErr',
        {
          error: error,
        }
      ),
    });
  }
}

formModuleStore.resetFormModuleVersion();
</script>

<template>
  <v-container>
    <h1 class="mt-6" :lang="locale">
      {{ $t('trans.formModuleAddVersion.addFormModuleVersion') }}
    </h1>
    <v-form ref="settingsFormModule" v-model="settingsFormModuleValid">
      <FormModuleVersionSettings />
    </v-form>
    <v-btn
      class="py-4"
      color="primary"
      :disabled="!settingsFormModuleValid"
      :lang="locale"
      :loading="saving"
      @click="handleSubmit"
    >
      {{ $t('trans.formModuleAddVersion.submit') }}
    </v-btn>
  </v-container>
</template>
