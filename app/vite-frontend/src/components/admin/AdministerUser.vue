<script setup>
import { computed, onMounted } from 'vue';

import { useAppStore } from '~/store/app';
import { useAdminStore } from '~/store/admin';
import { storeToRefs } from 'pinia';

const appStore = useAppStore();
const adminStore = useAdminStore();

const properties = defineProps({
  userId: {
    type: String,
    required: true,
  },
});

const { config } = storeToRefs(appStore);
const { user } = storeToRefs(adminStore);

const userUrl = computed(
  () =>
    `${config.value.keycloak.serverUrl}/admin/${config.value.keycloak.realm}/console/#/realms/${config.value.keycloak.realm}/users/${user.value.keycloakId}`
);

onMounted(async () => {
  await adminStore.readUser(properties.userId);
});
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
