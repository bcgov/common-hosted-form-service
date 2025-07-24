<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import FormModuleVersionSettings from '~/components/formModuleVersion/FormModuleVersionSettings.vue';
import { formModuleService } from '~/services';
import { useFormModuleStore } from '~/store/formModule';
import { useNotificationStore } from '~/store/notification';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();

const formModuleStore = useFormModuleStore();
const notificationStore = useNotificationStore();

const { formModule, formModuleVersion } = storeToRefs(formModuleStore);

const settingsFormModule = ref(null);
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

onBeforeRouteLeave((_to, _from, next) => {
  formModule.isDirty
    ? next(window.confirm(t('trans.formModuleAddVersion.confirmLeave')))
    : next();
});

async function submitFormModule() {
  try {
    saving.value = true;
    await formModuleStore.setDirtyFlag(false);

    let euris = [];

    let configValue = null;
    if (formModuleVersion.value.config) {
      try {
        configValue = JSON.parse(formModuleVersion.value.config);
        console.log(configValue);
      } catch (error) {
        notificationStore.addNotification({
          text: t('trans.formModuleAddVersion.invalidConfigErrMsg'),
          consoleError: t(
            'trans.formModuleAddVersion.invalidConfigConsErrMsg',
            {
              error: error.message,
            }
          ),
        });
        saving.value = false;
        return;
      }
    }

    let formModuleVersionData = {
      config: configValue,
      externalUris: euris.concat(
        formModuleVersion.value.externalUris.map((i) => i.uri)
      ),
    };

    await formModuleService.createFormModuleVersion(
      formModule.value.id,
      formModuleVersionData
    );

    router.push({
      name: 'FormModuleManage',
      query: {
        fm: formModule.value.id,
      },
    });
  } catch (error) {
    await formModuleStore.setDirtyFlag(true);
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
      @click="submitFormModule"
    >
      {{ $t('trans.formModuleAddVersion.submit') }}
    </v-btn>
  </v-container>
</template>

<style lang="scss" scoped></style>
