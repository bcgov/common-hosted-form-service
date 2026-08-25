<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
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
const updatingStale = ref(false);

onMounted(async () => {
  await adminStore.readUser(properties.userId);
});

async function updateStale(stale) {
  updatingStale.value = true;
  try {
    await adminStore.updateUser(properties.userId, { stale });
  } finally {
    updatingStale.value = false;
  }
}
</script>

<template>
  <div>
    <h3>{{ user.fullName }}</h3>
    <h4 :lang="locale">{{ $t('trans.administerUser.userDetails') }}</h4>
    <v-switch
      data-test="stale-user-switch"
      color="warning"
      :disabled="updatingStale"
      label="Mark as Stale"
      :loading="updatingStale"
      :model-value="Boolean(user.stale)"
      @update:model-value="updateStale"
    />
    <pre>{{ user }}</pre>
  </div>
</template>
