<script setup>
import { storeToRefs } from 'pinia';
import VueJsonPretty from 'vue-json-pretty';
import { useI18n } from 'vue-i18n';
import { onBeforeMount, ref } from 'vue';

import BaseCopyToClipboard from '~/components/base/BaseCopyToClipboard.vue';
import { rbacService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useNotificationStore } from '~/store/notification';

const { t, locale } = useI18n({ useScope: 'global' });

const apiRes = ref('');

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const { fullName, token, tokenParsed, userName } = storeToRefs(authStore);

onBeforeMount(async () => {
  await getUser();
});

async function getUser() {
  try {
    const user = await rbacService.getCurrentUser();
    apiRes.value = user.data;
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.developer.notificationMsg'),
      consoleError:
        t('trans.developer.notificationConsErr') + `: ${error.message}`,
    });
  }
}
</script>

<template>
  <div>
    <h2 class="mt-4">Developer Resources</h2>
    <v-row no-gutters>
      <v-col cols="6">
        <h3>Keycloak</h3>
        <br />
        <h4 :lang="locale">{{ $t('trans.developer.user') }}</h4>
        <strong :lang="locale">{{ $t('trans.developer.name') }}:</strong>
        {{ fullName }}
        <br />
        <strong :lang="locale">{{ $t('trans.developer.userName') }}:</strong>
        {{ userName }}
        <br />
        <br />
        <h4 :lang="locale">
          {{ $t('trans.developer.JWTContents') }}
          <BaseCopyToClipboard
            :text-to-copy="JSON.stringify(tokenParsed)"
            :snack-bar-text="$t('trans.developer.JWTContentsSBTxt')"
            :tooltip-text="$t('trans.developer.JWTContentsTTTxt')"
          />
        </h4>
        <vue-json-pretty :data="tokenParsed" />
        <h4 :lang="locale">
          {{ $t('trans.developer.JWTToken') }}
          <BaseCopyToClipboard
            :text-to-copy="token"
            :snack-bar-text="$t('trans.developer.JWTTokenSBTxt')"
            :tooltip-text="$t('trans.developer.JWTTokenTTTxt')"
            :lang="locale"
          />
        </h4>
        <div style="word-break: break-all">{{ token }}</div>
      </v-col>
      <v-col cols="5" offset="1">
        <h3 :lang="locale">{{ $t('trans.developer.chefsAPI') }}</h3>
        <br />
        <h4>
          <BaseCopyToClipboard
            :text-to-copy="JSON.stringify(apiRes)"
            :snack-bar-text="$t('trans.developer.RBACSBTxt')"
            :tooltip-text="$t('trans.developer.RBACTTTxt')"
            :lang="locale"
          />
        </h4>
        <vue-json-pretty :data="apiRes" />
      </v-col>
    </v-row>
  </div>
</template>
