<template>
  <BaseSecure>
    <router-link :to="{ name: 'UserForms' }">
      <v-btn color="primary" class="mr-2">
        <span>MY FORMS</span>
      </v-btn>
    </router-link>
    <router-link :to="{ name: 'UserHistory' }">
      <v-btn color="primary" class="mr-2">
        <span>HISTORY</span>
      </v-btn>
    </router-link>
    <h1 class="text-center">User</h1>
    <h2>Design TBD (dev only stuff??)</h2>
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
  </BaseSecure>
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
  created() {
    this.getUser();
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
};
</script>
