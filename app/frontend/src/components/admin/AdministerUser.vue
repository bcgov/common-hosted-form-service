<template>
  <div>
    <h3>{{ user.fullName }}</h3>
    <h4>User Details</h4>
    <pre>{{ user }}</pre>

    <v-btn color="primary" text small :href="userUrl" target="_blank">
      <span>Open SSO console</span>
    </v-btn>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'AdministerUser',
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapGetters('admin', ['user']),
    userUrl() {
      return `${this.$config.keycloak.serverUrl}/admin/${this.$config.keycloak.realm}/console/#/realms/${this.$config.keycloak.realm}/users/${this.user.keycloakId}`;
    },
  },
  methods: {
    ...mapActions('admin', ['readUser']),
  },
  async mounted() {
    await this.readUser(this.userId);
  },
};
</script>
