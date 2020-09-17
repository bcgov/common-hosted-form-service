<template>
  <v-container>
    <h1 class="text-center">User</h1>
    <h2>Design TBD (dev only stuff??)</h2>
    <br />
    <br />
    <v-row no-gutters>
      <v-col cols="6">
        <h3>From Keycloak</h3>
        <br />
        <h4>User</h4>
        <strong>Name:</strong>
        {{ fullName }}
        <br />
        <strong>USerName:</strong>
        {{ userName }}
        <br />
        <br />
        <h4>JWT</h4>
        <pre>{{ tokenParsed }}</pre>
        <div style="word-break: break-all">{{ token }}</div>
      </v-col>
      <v-col cols="5" offset="1">
        <h3>From API</h3>
        <br />
        <strong>/rbac/current</strong>
        <pre>
        {{ apiRes }}
        </pre>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';

import rbacService from '@/services/rbacService';

export default {
  name: 'User',
  data() {
    return {
      apiRes: '',
    };
  },
  computed: {
    ...mapGetters('auth', [
      'hasResourceRoles',
      'userName',
      'token',
      'tokenParsed',
      'fullName',
    ]),
  },
  methods: {
    async getUser() {
      try {
        const user = await rbacService.getCurrentUser();
        this.apiRes = user.data;
      } catch (error) {
        alert('Failed to get user from RBAC, see console');
        console.error(`Error getting User from RBAC: ${error.message}`); // eslint-disable-line no-console
      }
    },
  },
  created() {
    this.getUser();
  }
};
</script>
