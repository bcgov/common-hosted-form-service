<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const { t, locale } = useI18n({ useScope: 'global' });

const showSecret = ref(false);
const subscriptionForm = ref(null);
const subscriptionFormValid = ref(false);
/* c8 ignore start */
const endpointUrlRules = ref([
  (v) => !!v || t('trans.formSettings.validEndpointRequired'),
  (v) =>
    (v &&
      new RegExp(
        /^(ht|f)tp(s?):\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g
      ).test(v)) ||
    t('trans.formSettings.validEndpointRequired'),
]);
const endpointTokenRules = ref([
  (v) => !!v || t('trans.formSettings.validBearerTokenRequired'),
]);
/* c8 ignore end */

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { form, subscriptionData } = storeToRefs(formStore);

async function updateSettings() {
  try {
    const { valid } = await subscriptionForm.value.validate();
    if (valid) {
      let subData = {
        ...subscriptionData.value,
        formId: form.value.id,
      };
      await formStore.updateSubscription({
        formId: form.value.id,
        subscriptionData: subData,
      });

      formStore.readFormSubscriptionData(form.value.id);
    }
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.subscribeEvent.saveSettingsErrMsg'),
      consoleError: t('trans.subscribeEvent.updateSettingsConsoleErrMsg', {
        formId: form.value.id,
        error: error,
      }),
    });
  }
}

function showHideKey() {
  showSecret.value = !showSecret.value;
}

defineExpose({ showHideKey, showSecret, updateSettings });
</script>

<template>
  <v-container class="px-0">
    <template #title>
      <span :lang="locale">
        {{ $t('trans.formSettings.eventSubscription') }}
      </span>
    </template>
    <v-form
      ref="subscriptionForm"
      v-model="subscriptionFormValid"
      lazy-validation
    >
      <v-row class="mt-5">
        <v-col cols="12" md="8" sm="12" lg="8" xl="8">
          <v-text-field
            v-model="subscriptionData.endpointUrl"
            :label="$t('trans.subscribeEvent.endpointUrl')"
            :lang="locale"
            :placeholder="$t('trans.subscribeEvent.urlPlaceholder')"
            density="compact"
            flat
            solid
            variant="outlined"
            :rules="endpointUrlRules"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="8" sm="12" lg="8" xl="8">
          <v-text-field
            v-model="subscriptionData.key"
            :label="$t('trans.subscribeEvent.key')"
            :lang="locale"
            density="compact"
            flat
            solid
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="8" sm="12" xl="8" lg="8">
          <v-text-field
            v-model="subscriptionData.endpointToken"
            :label="$t('trans.subscribeEvent.endpointToken')"
            :lang="locale"
            density="compact"
            flat
            solid
            variant="outlined"
            :rules="endpointTokenRules"
            :type="
              showSecret
                ? $t('trans.subscribeEvent.text')
                : $t('trans.subscribeEvent.password')
            "
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="3">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                :icon="showSecret ? 'mdi:mdi-eye-off' : 'mdi:mdi-eye'"
                size="x-small"
                v-bind="props"
                density="default"
                :title="
                  showSecret
                    ? $t('trans.shareForm.hideSecret')
                    : $t('trans.subscribeEvent.showSecret')
                "
                @click="showHideKey"
              />
            </template>
            <span v-if="showSecret" :lang="locale">
              {{ $t('trans.subscribeEvent.hideSecret') }}
            </span>
            <span v-else :lang="locale">{{
              $t('trans.subscribeEvent.showSecret')
            }}</span>
          </v-tooltip>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-btn
            class="mr-5"
            color="primary"
            :title="$t('trans.subscribeEvent.save')"
            @click="updateSettings"
          >
            <span :lang="locale">{{ $t('trans.subscribeEvent.save') }}</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>
