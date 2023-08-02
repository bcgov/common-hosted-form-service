<script>
import { mapActions } from 'pinia';
import { i18n } from '~/internationalization';
import formService from '~/services/formService.js';
import { useNotificationStore } from '~/store/notification';

export default {
  props: {
    submissionId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      dialog: false,
      loading: true,
      history: [],
    };
  },
  computed: {
    headers() {
      return [
        {
          title: i18n.t('trans.auditHistory.userName'),
          key: 'updatedByUsername',
        },
        { title: i18n.t('trans.auditHistory.date'), key: 'actionTimestamp' },
      ];
    },
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    async loadHistory() {
      this.loading = true;
      this.dialog = true;
      try {
        const response = await formService.listSubmissionEdits(
          this.submissionId
        );
        this.history = response.data;
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.auditHistory.errorMsg'),
          consoleError:
            i18n.t('trans.auditHistory.consoleErrMsg') +
            `${this.submissionId}: ${error}`,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          class="mx-1"
          color="primary"
          v-bind="props"
          size="x-small"
          density="default"
          icon="mdi:mdi-history"
          @click="loadHistory"
        />
      </template>
      <span>{{ $t('trans.auditHistory.viewEditHistory') }}</span>
    </v-tooltip>

    <v-dialog v-model="dialog" width="900">
      <v-card>
        <v-card-title class="text-h5 pb-0">{{
          $t('trans.auditHistory.editHistory')
        }}</v-card-title>
        <v-card-text>
          <hr />
          <p>
            {{ $t('trans.auditHistory.auditLogMsg') }}
          </p>

          <v-data-table
            :headers="headers"
            :items="history"
            :loading="loading"
            :loading-text="$t('trans.auditHistory.loadingText')"
            item-key="id"
            class="status-table"
          >
            <template #[`item.actionTimestamp`]="{ item }">
              {{ $filters.formatDateLong(item.columns.actionTimestamp) }}
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn class="mb-5 close-dlg" color="primary" @click="dialog = false">
            <span>{{ $t('trans.auditHistory.close') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>
