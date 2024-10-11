<script setup>
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAdminStore } from '~/store/admin';

const { locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  userId: {
    type: String,
    required: true,
  },
});

const adminStore = useAdminStore();

const { user } = storeToRefs(adminStore);

onMounted(async () => {
  await adminStore.readUser(properties.userId);
});
</script>

<template>
  <div>
    <h3>{{ user.fullName }}</h3>
    <h4 :lang="locale">{{ $t('trans.administerUser.userDetails') }}</h4>
    <pre>{{ user }}</pre>
  </div>
</template>
