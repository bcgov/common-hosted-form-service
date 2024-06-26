<script>
import { mapState, mapActions } from 'pinia';
import { useI18n } from 'vue-i18n';

import { formService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

export default {
  props: {
    submissionId: {
      required: true,
      type: String,
    },
  },
  setup() {
    const { t, locale } = useI18n({ useScope: 'global' });

    return { t, locale };
  },
  data() {
    return {
      loading: true,
      statuses: [],
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL']),
    headers() {
      return [
        { title: this.$t('trans.statusTable.status'), key: 'code' },
        {
          title: this.$t('trans.statusTable.dateStatusChanged'),
          align: 'start',
          key: 'createdAt',
        },
        { title: this.$t('trans.statusTable.assignee'), key: 'user' },
        { title: this.$t('trans.statusTable.updatedBy'), key: 'createdBy' },
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
          text: this.$t('trans.statusTable.getSubmissionStatusErr'),
          consoleError:
            this.$t('trans.statusTable.getSubmissionStatusConsErr') +
            `${error}`,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
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
