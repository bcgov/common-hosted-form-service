<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { formService } from '~/services';
import { useNotificationStore } from '~/store/notification';

const { t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  submissionId: {
    required: true,
    type: String,
  },
});

const notificationStore = useNotificationStore();

const statuses = ref([]);
const loading = ref(true);

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

onMounted(() => {
  getData();
});
</script>

<template>
  <v-container>
    <v-data-table
      disable-pagination
      :hide-default-footer="true"
      :headers="headers"
      :items="statuses"
      :loading="loading"
      :loading-text="$t('trans.statusTable.loadingText')"
      item-key="statusId"
      class="status-table"
    >
      <template #item.createdAt="{ item }">
        <span>{{ $filters.formatDate(item.columns.createdAt) }}</span>
      </template>

      <template #item.user="{ item }">{{
        item.columns.user ? item.columns.user.fullName : ''
      }}</template>
    </v-data-table>
  </v-container>
</template>

<style scoped>
.status-table :deep(tbody tr:nth-of-type(odd)) {
  background-color: #f5f5f5;
}
.status-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
