<template>
  <v-container>
    <v-data-table
      disable-pagination
      :hide-default-footer="true"
      :headers="headers"
      :items="statuses"
      :loading="loading"
      :loading-text="this.$t('trans.statusTable.loadingText')"
      item-key="statusId"
      class="status-table"
    >
      <template #[`item.createdAt`]="{ item }">
        <span>{{ item.createdAt | formatDate }}</span>
      </template>

      <template #[`item.user`]="{ item }">{{
        item.user ? item.user.fullName : ''
      }}</template>
    </v-data-table>
  </v-container>
</template>

<script>
import { mapActions } from 'vuex';
import { formService } from '@/services';

export default {
  name: 'StatusTable',
  props: {
    submissionId: {
      required: true,
      type: String,
    },
  },
  data: () => ({
    statuses: [],
    loading: true,
  }),
  computed: {
    headers() {
      return [
        { text: this.$t('trans.statusTable.status'), value: 'code' },
        {
          text: this.$t('trans.statusTable.dateStatusChanged'),
          align: 'start',
          value: 'createdAt',
        },
        { text: this.$t('trans.statusTable.assignee'), value: 'user' },
        { text: this.$t('trans.statusTable.updatedBy'), value: 'createdBy' },
      ];
    },
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
          message: this.$t('trans.statusTable.getSubmissionStatusErr'),
          consoleError:
            this.$t('trans.statusTable.getSubmissionStatusConsErr') +
            `${error}`,
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
