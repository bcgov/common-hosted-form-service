<template>
  <div>
    <h2 class="mt-4">Developer Resources</h2>
    <v-row no-gutters>
      <v-col cols="6">
        <h3>Keycloak</h3>
        <br />
        <h4>{{ $t('trans.developer.user') }}</h4>
        <strong>{{ $t('trans.developer.name') }}:</strong>
        {{ fullName }}
        <br />
        <strong>{{ $t('trans.developer.userName') }}:</strong>
        {{ userName }}
        <br />
        <br />
        <h4>
          {{ $t('trans.developer.JWTContents') }}
          <BaseCopyToClipboard
            :copyText="JSON.stringify(tokenParsed)"
            :snackBarText="$t('trans.developer.JWTContentsSBTxt')"
            :tooltipText="$t('trans.developer.JWTContentsTTTxt')"
          />
        </h4>
        <vue-json-pretty :data="tokenParsed" />
        <h4>
          {{ $t('trans.developer.JWTToken') }}
          <BaseCopyToClipboard
            :copyText="token"
            :snackBarText="$t('trans.developer.JWTTokenSBTxt')"
            :tooltipText="$t('trans.developer.JWTTokenTTTxt')"
          />
        </h4>
        <div style="word-break: break-all">{{ token }}</div>
      </v-col>
      <v-col cols="5" offset="1">
        <h3>{{ $t('trans.developer.chefsAPI') }}</h3>
        <br />
        <h4>
          /rbac/current
          <BaseCopyToClipboard
            :copyText="JSON.stringify(apiRes)"
            :snackBarText="$t('trans.developer.RBACSBTxt')"
            :tooltipText="$t('trans.developer.RBACTTTxt')"
          />
        </h4>
        <vue-json-pretty :data="apiRes" />
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { rbacService } from '@/services';

import VueJsonPretty from 'vue-json-pretty';

export default {
  name: 'Developer',
  components: {
    VueJsonPretty,
  },
  data() {
    return {
      apiRes: '',
    };
  },
  computed: {
    ...mapGetters('auth', ['fullName', 'token', 'tokenParsed', 'userName']),
  },
  created() {
    this.getUser();
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    async getUser() {
      try {
        const user = await rbacService.getCurrentUser();
        this.apiRes = user.data;
      } catch (error) {
        this.addNotification({
          message: this.$t('trans.developer.notificationMsg'),
          consoleError:
            this.$t('trans.developer.notificationConsErr') +
            `: ${error.message}`,
        });
      }
    },
  },
};
</script>
