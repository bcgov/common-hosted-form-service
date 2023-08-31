<script>
import { mapActions, mapState } from 'pinia';
import VueJsonPretty from 'vue-json-pretty';

import BaseCopyToClipboard from '~/components/base/BaseCopyToClipboard.vue';
import { i18n } from '~/internationalization';
import { rbacService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

export default {
  components: {
    BaseCopyToClipboard,
    VueJsonPretty,
  },
  data() {
    return {
      apiRes: '',
    };
  },
  computed: {
    ...mapState(useAuthStore, ['fullName', 'token', 'tokenParsed', 'userName']),
    ...mapState(useFormStore, ['lang']),
  },
  created() {
    this.getUser();
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    async getUser() {
      try {
        const user = await rbacService.getCurrentUser();
        this.apiRes = user.data;
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.developer.notificationMsg'),
          consoleError:
            i18n.t('trans.developer.notificationConsErr') +
            `: ${error.message}`,
        });
      }
    },
  },
};
</script>

<template>
  <div>
    <h2 class="mt-4">Developer Resources</h2>
    <v-row no-gutters>
      <v-col cols="6">
        <h3>Keycloak</h3>
        <br />
        <h4 :lang="lang">{{ $t('trans.developer.user') }}</h4>
        <strong :lang="lang">{{ $t('trans.developer.name') }}:</strong>
        {{ fullName }}
        <br />
        <strong :lang="lang">{{ $t('trans.developer.userName') }}:</strong>
        {{ userName }}
        <br />
        <br />
        <h4 :lang="lang">
          {{ $t('trans.developer.JWTContents') }}
          <BaseCopyToClipboard
            :text-to-copy="JSON.stringify(tokenParsed)"
            :snack-bar-text="$t('trans.developer.JWTContentsSBTxt')"
            :tooltip-text="$t('trans.developer.JWTContentsTTTxt')"
          />
        </h4>
        <vue-json-pretty :data="tokenParsed" />
        <h4 :lang="lang">
          {{ $t('trans.developer.JWTToken') }}
          <BaseCopyToClipboard
            :text-to-copy="token"
            :snack-bar-text="$t('trans.developer.JWTTokenSBTxt')"
            :tooltip-text="$t('trans.developer.JWTTokenTTTxt')"
            :lang="lang"
          />
        </h4>
        <div style="word-break: break-all">{{ token }}</div>
      </v-col>
      <v-col cols="5" offset="1">
        <h3 :lang="lang">{{ $t('trans.developer.chefsAPI') }}</h3>
        <br />
        <h4>
          <BaseCopyToClipboard
            :text-to-copy="JSON.stringify(apiRes)"
            :snack-bar-text="$t('trans.developer.RBACSBTxt')"
            :tooltip-text="$t('trans.developer.RBACTTTxt')"
            :lang="lang"
          />
        </h4>
        <vue-json-pretty :data="apiRes" />
      </v-col>
    </v-row>
  </div>
</template>
