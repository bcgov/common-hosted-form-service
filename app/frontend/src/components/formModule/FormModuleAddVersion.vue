<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';

import FormModuleVersionSettings from '~/components/formModuleVersion/FormModuleVersionSettings.vue';
import { formModuleService } from '~/services';
import { useFormModuleStore } from '/store/formModule';
import { useNotificationsStore } from '~/store/notifications';

const { t, locale } = useI18n({ useScope: 'global' });

const formModuleStore = useFormModuleStore();
const notificationStore = useNotificationsStore();

const { formModule, formModuleVersion } = storeToRefs(formModuleStore);

const settingsFormModuleValid = ref(false);
const saving = ref(false);

watch(
  () => formModule.value.identityProviders,
  () => {
    if (formModule.value.idpTypes.length < 1 && settingsFormModuleValid.value) {
      settingsFormModuleValid.value = false;
    }
  }
);

async function submitFormModule() {
  try {
    saving.value = true;
    await formModule.setDirtyFlag(false);

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
      formModule.value.id,
      formModuleVersionData
    );
  } catch (error) {
    await formModule.setDirtyFlag(true);
    notificationStore.addNotification({
      text: t('trans.formModuleAddVersion.createFormModuleVersionErr'),
      consoleError: t(
        'trans.formModuleAddVersion.createFormModuleVersionConsErr',
        {
          error: error,
        }
      ),
    });
  } finally {
    saving.value = false;
  }
}

formModuleStore.resetFormModule();

onBeforeRouteLeave((_to, _from, next) => {
  formModule.isDirty
    ? next(window.confirm(t('trans.formModuleAddVersion.confirmLeave')))
    : next();
});
</script>
<template>
  <v-container>
    <h1 class="mt-6" :lang="locale">
      {{ $t('trans.formModuleAddVersion.importFormModule') }}
    </h1>
    <v-form ref="settingsFormModule" v-model="settingsFormModuleValid">
      <FormModuleVersionSettings />
    </v-form>
    <v-btn
      class="py-4"
      color="primary"
      :disabled="!settingsFormModuleValid"
      @click="submitFormModule"
    >
      ${{ t('trans.formModuleAddVersion.submit') }}
    </v-btn>
  </v-container>
</template>
<style lang="scss" scoped></style>
