<script setup>
import moment from 'moment';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { onMounted, ref } from 'vue';

import { useAppStore } from '~/store/app';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { encryptionKeyService } from '~/services';

const { t, locale } = useI18n({ useScope: 'global' });
const appStore = useAppStore();
const formStore = useFormStore();
const notificationStore = useNotificationStore();
const { form, isRTL } = storeToRefs(formStore);

const algorithms = ref([]);
const techdocsLink =
  'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Event-Stream-Service/';

onMounted(async () => {
  await fetchAlgorithms();
});

async function fetchAlgorithms() {
  try {
    algorithms.value = [];
    const result = await encryptionKeyService.listEncryptionAlgorithms();
    algorithms.value = result.data;
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.formSettings.fetchEncryptionAlgorithmListError'),
      consoleError: t('trans.formSettings.fetchEncryptionAlgorithmListError', {
        error: e.message,
      }),
    });
  }
}

async function generateKey() {
  let generatedKey;
  // when we have more algorithms, move this into some kind of service...
  if (form.value.eventStreamConfig.encryptionKey.algorithm === 'aes-256-gcm') {
    //const data = crypto.getRandomValues(new Uint8Array(16));
    //const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    //generatedKey = Array.from(new Uint8Array(hashBuffer))
    //  .map((b) => b.toString(16).padStart(2, '0'))
    //  .join('');
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    const rawKey = await window.crypto.subtle.exportKey('raw', key);
    generatedKey = Array.from(new Uint8Array(rawKey))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  form.value.eventStreamConfig.encryptionKey.key = generatedKey;
}

/* c8 ignore start */
// eslint-disable-next-line no-unused-vars
const encryptionKeyRules = ref([
  (v) => {
    if (form.value.eventStreamConfig.enablePrivateStream) {
      let x = v;
      if (v && Object.prototype.toString.call(v) === '[object String]') {
        if (v.trim().length === 0) {
          x = null;
        }
      }
      return !!x || t('trans.formSettings.encryptionKeyReq');
    }
  },
]);
/* c8 ignore stop */
defineExpose({
  fetchAlgorithms,
  generateKey,
  encryptionKeyRules,
});
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="locale">{{
        $t('trans.formSettings.eventStreamTitle')
      }}</span></template
    >

    <div class="mb-6 ml-1 font-weight-bold" :lang="locale">
      {{ $t('trans.formSettings.eventStreamMessage') }}
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-icon
            color="primary"
            class="mx-1"
            :class="{ 'mx-1': isRTL }"
            v-bind="props"
            icon="mdi:mdi-help-circle-outline"
          ></v-icon>
        </template>
        <span>
          <a
            :href="techdocsLink"
            class="preview_info_link_field_white"
            target="_blank"
            :hreflang="locale"
          >
            {{ $t('trans.formSettings.learnMore') }}
            <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline"></v-icon>
          </a>
        </span>
      </v-tooltip>
    </div>
    <div class="mb-6 ml-1" :lang="locale">
      <h3>{{ $t('trans.formSettings.natsConfiguration') }}</h3>
      <div class="ml-4">
        <span>
          <span :lang="locale" class="font-weight-bold"
            >{{ $t('trans.formSettings.serversLabel') }}:
          </span>
          <span class="ml-2" data-test="consumerservers">{{
            appStore.config?.eventStreamService?.consumerservers
          }}</span>
        </span>
        <br />
        <span>
          <span :lang="locale" class="font-weight-bold"
            >{{ $t('trans.formSettings.streamNameLabel') }}:
          </span>
          <span class="ml-2" data-test="streamName">{{
            appStore.config?.eventStreamService?.streamName
          }}</span>
        </span>
        <br />
        <span>
          <span :lang="locale" class="font-weight-bold"
            >{{ $t('trans.formSettings.sourceLabel') }}:
          </span>
          <span class="ml-2" data-test="source">{{
            appStore.config?.eventStreamService?.source
          }}</span>
        </span>
        <br />
        <span>
          <span :lang="locale" class="font-weight-bold"
            >{{ $t('trans.formSettings.domainLabel') }}:
          </span>
          <span class="ml-2" data-test="domain">{{
            appStore.config?.eventStreamService?.domain
          }}</span>
        </span>
      </div>
    </div>
    <div class="mt-6 ml-1" :lang="locale">
      <h3>{{ $t('trans.formSettings.publishConfiguration') }}</h3>
    </div>
    <v-row class="pl-6 m-0">
      <v-col cols="12" md="6" class="pl-0 pr-0 pb-0">
        <v-checkbox
          v-model="form.eventStreamConfig.enablePublicStream"
          hide-details="auto"
          class="my-0"
        >
          <template #label>
            <span
              :class="{ 'mr-2': isRTL }"
              :lang="locale"
              v-html="$t('trans.formSettings.enablePublicStream')"
            ></span>
          </template>
        </v-checkbox>
      </v-col>
    </v-row>
    <v-row class="pl-6 m-0">
      <v-col cols="12" md="6" class="pl-0 pr-0 pb-0">
        <v-checkbox
          v-model="form.eventStreamConfig.enablePrivateStream"
          hide-details="auto"
          class="my-0"
        >
          <template #label>
            <span
              :class="{ 'mr-2': isRTL }"
              :lang="locale"
              v-html="$t('trans.formSettings.enablePrivateStream')"
            ></span>
          </template>
        </v-checkbox>
      </v-col>
      <v-col cols="12" md="6" class="pl-0 pr-0 pb-0"> </v-col>
    </v-row>
    <v-expand-transition>
      <v-row v-if="form.eventStreamConfig.enablePrivateStream" class="pl-6 m-0">
        <v-col cols="12" md="8" class="pl-0 pr-0 pb-0">
          <v-select
            v-model="form.eventStreamConfig.encryptionKey.algorithm"
            :items="algorithms"
            item-title="display"
            item-value="code"
            :label="$t('trans.formSettings.encryptionKeyAlgorithm')"
            density="compact"
            solid
            variant="outlined"
            :lang="locale"
            :rules="encryptionKeyRules"
          ></v-select
        ></v-col>
        <v-col cols="12" md="8" class="pl-0 pr-0 pb-0">
          <v-text-field
            v-model="form.eventStreamConfig.encryptionKey.key"
            density="compact"
            solid
            variant="outlined"
            :label="$t('trans.formSettings.encryptionKey')"
            :lang="locale"
            :rules="encryptionKeyRules"
          />
        </v-col>
        <v-col cols="12" md="4" class="pl-4 pr-0 pb-0 pt-4">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                :disabled="!form.eventStreamConfig.enablePrivateStream"
                v-bind="props"
                size="x-small"
                density="default"
                :icon="'mdi:mdi-auto-fix'"
                :title="$t('trans.formSettings.encryptionKeyGenerate')"
                @click="generateKey"
              />
            </template>
            <span :lang="locale">{{
              $t('trans.formSettings.encryptionKeyGenerate')
            }}</span>
          </v-tooltip>
          <BaseCopyToClipboard
            :disabled="!form.eventStreamConfig.encryptionKey.key"
            class="mx-2"
            :text-to-copy="form.eventStreamConfig.encryptionKey.key"
            :snack-bar-text="$t('trans.formSettings.encryptionKeyCopySnackbar')"
            :tooltip-text="$t('trans.formSettings.encryptionKeyCopyTooltip')"
            :lang="locale"
          />
        </v-col>
      </v-row>
    </v-expand-transition>
    <v-row class="pl-6 m-0">
      <v-col cols="12" class="pl-0 pr-0 pb-0">
        <span v-if="form.eventStreamConfig.updatedBy">
          <span :lang="locale" class="font-weight-bold"
            >{{ $t('trans.formSettings.eventStreamUpdatedBy') }}:
          </span>
          <span
            >{{ form.eventStreamConfig.updatedBy }} @
            {{
              moment(
                new Date(form.eventStreamConfig.updatedAt),
                'YYYY-MM-DD HH:MM:SS'
              )
            }}</span
          >
        </span>
      </v-col>
      <v-col cols="12" class="pl-0 pr-0 pb-0">
        <span v-if="form.eventStreamConfig.encryptionKey.updatedBy">
          <span :lang="locale" class="font-weight-bold"
            >{{ $t('trans.formSettings.encryptionKeyUpdatedBy') }}:
          </span>
          <span
            >{{ form.eventStreamConfig.encryptionKey.updatedBy }} @
            {{
              moment(
                new Date(form.eventStreamConfig.encryptionKey.updatedAt),
                'YYYY-MM-DD HH:MM:SS'
              )
            }}</span
          >
        </span>
      </v-col>
    </v-row>
  </BasePanel>
</template>
