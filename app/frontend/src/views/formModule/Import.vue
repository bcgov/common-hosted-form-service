<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import FormModuleSettings from '~/components/formModule/FormModuleSettings.vue';
import FormModuleVersionSettings from '~/components/formModuleVersion/FormModuleVersionSettings.vue';
import { formModuleService } from '~/services';
import { useFormModuleStore } from '~/store/formModule';
import { useNotificationsStore } from '~/store/notifications';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();

const formModuleStore = useFormModuleStore();
const notificationStore = useNotificationsStore();

const { formModule, formModuleVersion } = storeToRefs(formModuleStore);

const settingsFormModule = ref(null);
const settingsFormModuleValid = ref(false);
const saving = ref(false);

watch(
  () => formModule.value.identityProviders,
  () => {
    if (formModule.value.idpTypes.length < 1 && settingsFormModuleValid.value) {
      settingsFormModule.value.validate();
    }
  }
);

async function submitFormModule() {
  try {
    saving.value = true;
    await formModuleStore.setDirtyFlag(false);

    let idps = [];

    let formModuleData = {
      pluginName: formModule.value.pluginName,
      identityProviders: idps.concat(
        formModule.value.idpTypes.map((i) => ({ code: i }))
      ),
    };

    const formModuleResponse = await formModuleService.createFormModule(
      formModuleData
    );

    let euris = [];

    if (!formModuleVersion.value.importData)
      formModuleVersion.value.importData = '';

    let formModuleVersionData = {
      importData: formModuleVersion.value.importData,
      externalUris: euris.concat(
        formModuleVersion.value.externalUris.map((i) => i.uri)
      ),
    };

    await formModuleService.createFormModuleVersion(
      formModuleResponse.data.id,
      formModuleVersionData
    );

    router.push({
      name: 'FormModuleManage',
      query: {
        fm: formModuleResponse.data.id,
      },
    });
  } catch (error) {
    await formModuleStore.setDirtyFlag(true);
    notificationStore.addNotification({
      text: t('trans.formModuleImport.createFormModuleVersionErr'),
      consoleError: t('trans.formModuleImport.createFormModuleVersionConsErr', {
        error: error,
      }),
    });
  } finally {
    saving.value = false;
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
      class="py-4"
      color="primary"
      :disabled="!settingsFormModuleValid"
      @click="submitFormModule"
    >
      {{ $t('trans.formModuleImport.submit') }}
    </v-btn>
  </v-container>
</template>

<style lang="scss" scoped></style>
