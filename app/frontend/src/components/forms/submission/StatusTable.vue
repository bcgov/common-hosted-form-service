<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { formService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  submissionId: {
    required: true,
    type: String,
  },
});

const loading = ref(true);
const statuses = ref([]);

const notificationStore = useNotificationStore();

const { isRTL } = storeToRefs(useFormStore());

const headers = computed(() => {
  return [
    { title: t('trans.statusTable.status'), key: 'code' },
    {
      title: t('trans.statusTable.dateStatusChanged'),
      align: 'start',
      key: 'createdAt',
    },
    { title: t('trans.statusTable.assignee'), key: 'user' },
    { title: t('trans.statusTable.updatedBy'), key: 'createdBy' },
  ];
});

onMounted(async () => {
  await getData();
});

async function getData() {
  loading.value = true;
  try {
    const response = await formService.getSubmissionStatuses(
      properties.submissionId
    );
    statuses.value = response.data;
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.statusTable.getSubmissionStatusErr'),
      consoleError:
        t('trans.statusTable.getSubmissionStatusConsErr') + `${error}`,
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container :class="{ 'dir-rtl': isRTL }">
    <v-data-table
      disable-pagination
      hover
      :hide-default-footer="true"
      :headers="headers"
      :items="statuses"
      :loading="loading"
      :loading-text="$t('trans.statusTable.loadingText')"
      item-key="statusId"
      class="status-table"
      :lang="locale"
    >
      <template #item.createdAt="{ item }">
        <span>{{ $filters.formatDate(item.createdAt) }}</span>
      </template>

      <template #item.user="{ item }">{{
        item.user ? item.user.fullName : ''
      }}</template>
    </v-data-table>
  </v-container>
</template>

<style scoped>
.status-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
