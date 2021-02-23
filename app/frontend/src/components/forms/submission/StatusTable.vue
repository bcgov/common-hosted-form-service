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
      <template #[`item.createdAt`]="{ item }">
        <v-tooltip bottom :disabled="item.code.toUpperCase() === 'SUBMITTED'">
          <template v-slot:activator="{ on }">
            <span v-on="on">{{ item.createdAt | formatDate }}</span>
          </template>
          <span>Status updated by {{ item.createdBy }}</span>
        </v-tooltip>
      </template>

      <template #[`item.user`]="{ item }">{{
        item.user ? item.user.fullName : ''
      }}</template>

      <template #[`item.actionDate`]="{ item }">{{
        item.actionDate | formatDate
      }}</template>
    </v-data-table>
  </v-container>
</template>

<script>
import { mapActions } from 'vuex';
import formService from '@/services/formService';

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
      { text: 'Status', value: 'code' },
      { text: 'Date Status Changed', align: 'start', value: 'createdAt' },
      { text: 'Assignee', value: 'user' },
      { text: 'Effective Date', value: 'actionDate' },
    ],
    statuses: [],
    loading: true,
  }),
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
  mounted() {
    this.getData();
  },
};
</script>

<style scoped>
.status-table >>> tbody tr:nth-of-type(odd) {
  background-color: #f5f5f5;
}
.status-table >>> thead tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
