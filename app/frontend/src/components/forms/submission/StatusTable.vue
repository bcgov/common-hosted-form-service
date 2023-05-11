<template>
  <v-container>
    <v-data-table
      disable-pagination
      :hide-default-footer="true"
      :headers="headers"
      :items="statuses"
      :loading="loading"
      loading-text="Loading... Please wait"
      item-key="statusId"
      class="status-table"
    >
      <template v-slot:item.createdAt="{ item }">
        <span>{{ $filters.formatDate(item.raw.createdAt) }}</span>
      </template>

      <template v-slot:item.user="{ item }">{{
        item.user ? item.raw.user.fullName : ''
      }}</template>
    </v-data-table>
  </v-container>
</template>

<script>
import { mapActions } from 'vuex';
import { formService } from '@src/services';

export default {
  name: 'StatusTable',
  props: {
    submissionId: {
      required: true,
      type: String,
    },
  },
  data: () => ({
    headers: [
      { title: 'Status', key: 'code' },
      { title: 'Date Status Changed', align: 'start', key: 'createdAt' },
      { title: 'Assignee', key: 'user' },
      { title: 'Updated By', key: 'createdBy' },
    ],
    statuses: [],
    loading: true,
  }),
  mounted() {
    this.getData();
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    async getData() {
      this.loading = true;
      try {
        const response = await formService.getSubmissionStatuses(
          this.submissionId
        );
        this.statuses = response.data;
      } catch (error) {
        this.addNotification({
          message: 'An error occured while trying to fetch statuses.',
          consoleError: `Error adding note: ${error}`,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.status-table :deep(tbody) tr:nth-of-type(odd) {
  background-color: #f5f5f5;
}
.status-table :deep(thead) tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
