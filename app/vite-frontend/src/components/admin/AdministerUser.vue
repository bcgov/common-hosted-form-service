<script>
import { useAppStore } from '~/store/app';
import { useAdminStore } from '~/store/admin';
import { mapActions, mapState } from 'pinia';

export default {
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapState(useAppStore, ['config']),
    ...mapState(useAdminStore, ['user']),
    userUrl() {
      return `${this.config.keycloak.serverUrl}/admin/${this.config.keycloak.realm}/console/#/realms/${this.config.keycloak.realm}/users/${this.user.keycloakId}`;
    },
  },
  async mounted() {
    await this.readUser(this.userId);
  },
  methods: {
    ...mapActions(useAdminStore, ['readUser']),
  },
};
</script>

<template>
  <div>
    <h3>{{ user.fullName }}</h3>
    <h4>{{ $t('trans.administerUser.userDetails') }}</h4>
    <pre>{{ user }}</pre>

    <v-btn
      color="primary"
      variant="text"
      size="small"
      :href="userUrl"
      target="_blank"
    >
      <span>{{ $t('trans.administerUser.openSSOConsole') }}</span>
    </v-btn>
  </div>
</template>
