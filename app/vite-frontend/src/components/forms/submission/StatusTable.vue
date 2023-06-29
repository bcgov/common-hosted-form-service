<script>
import { mapActions } from 'pinia';
import { i18n } from '~/internationalization';

import { formService } from '~/services';
import { useNotificationStore } from '~/store/notification';

export default {
  props: {
    submissionId: {
      required: true,
      type: String,
    },
  },
  data() {
    return {
      loading: true,
      statuses: [],
    };
  },
  computed: {
    headers() {
      return [
        { title: i18n.t('trans.statusTable.status'), key: 'code' },
        {
          title: i18n.t('trans.statusTable.dateStatusChanged'),
          align: 'start',
          key: 'createdAt',
        },
        { title: i18n.t('trans.statusTable.assignee'), key: 'user' },
        { title: i18n.t('trans.statusTable.updatedBy'), key: 'createdBy' },
      ];
    },
  },
  async mounted() {
    await this.getData();
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    async getData() {
      this.loading = true;
      try {
        const response = await formService.getSubmissionStatuses(
          this.submissionId
        );
        this.statuses = response.data;
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.statusTable.getSubmissionStatusErr'),
          consoleError:
            i18n.t('trans.statusTable.getSubmissionStatusConsErr') + `${error}`,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
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
