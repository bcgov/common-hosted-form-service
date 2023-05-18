<template>
  <div>
    <h2 class="mt-4">Developer Resources</h2>
    <v-row no-gutters>
      <v-col cols="6">
        <h3>Keycloak</h3>
        <br />
        <h4>User</h4>
        <strong>Name:</strong>
        {{ fullName }}
        <br />
        <strong>UserName:</strong>
        {{ userName }}
        <br />
        <br />
        <h4>
          JWT Contents
          <BaseCopyToClipboard
            :copyText="JSON.stringify(tokenParsed)"
            snackBarText="JWT Contents copied to clipboard"
            tooltipText="Copy JWT Contents to clipboard"
          />
        </h4>
        <vue-json-pretty :data="tokenParsed" />
        <h4>
          JWT Token
          <BaseCopyToClipboard
            :copyText="token"
            snackBarText="JWT Token copied to clipboard"
            tooltipText="Copy JWT Token to clipboard"
          />
        </h4>
        <div style="word-break: break-all">{{ token }}</div>
      </v-col>
      <v-col cols="5" offset="1">
        <h3>CHEFS API</h3>
        <br />
        <h4>
          /rbac/current
          <BaseCopyToClipboard
            :copyText="JSON.stringify(apiRes)"
            snackBarText="RBAC Response copied to clipboard"
            tooltipText="Copy RBAC Response to clipboard"
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
          message: 'Failed to get user from RBAC, see console',
          consoleError: `Error getting User from RBAC: ${error.message}`,
        });
      }
    },
  },
};
</script>
