<script>
import { mapActions, mapState } from 'pinia';
import { useI18n } from 'vue-i18n';

import formService from '~/services/formService.js';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

export default {
  props: {
    submissionId: {
      type: String,
      required: true,
    },
  },
  setup() {
    const { t, locale } = useI18n({ useScope: 'global' });

    return { t, locale };
  },
  data() {
    return {
      dialog: false,
      loading: true,
      history: [],
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL']),
    headers() {
      return [
        {
          title: this.$t('trans.auditHistory.userName'),
          key: 'updatedByUsername',
        },
        { title: this.$t('trans.auditHistory.date'), key: 'actionTimestamp' },
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
          text: this.$t('trans.auditHistory.errorMsg'),
          consoleError:
            this.$t('trans.auditHistory.consoleErrMsg') +
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
  <span :class="{ 'dir-rtl': isRTL }">
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          class="mx-1"
          color="primary"
          v-bind="props"
          size="x-small"
          density="default"
          icon="mdi:mdi-history"
          :title="$t('trans.auditHistory.viewEditHistory')"
          @click="loadHistory"
        />
      </template>
      <span :class="{ 'dir-rtl': isRTL }" :lang="locale">{{
        $t('trans.auditHistory.viewEditHistory')
      }}</span>
    </v-tooltip>

    <v-dialog v-model="dialog" width="900">
      <v-card>
        <v-card-title
          class="text-h5 pb-0"
          :class="{ 'dir-rtl': isRTL }"
          :lang="locale"
          >{{ $t('trans.auditHistory.editHistory') }}</v-card-title
        >
        <v-card-text>
          <hr />
          <p :class="{ 'dir-rtl': isRTL }" :lang="locale">
            {{ $t('trans.auditHistory.auditLogMsg') }}
          </p>

          <v-data-table
            :class="{ 'dir-rtl': isRTL }"
            :headers="headers"
            :items="history"
            :loading="loading"
            :loading-text="$t('trans.auditHistory.loadingText')"
            item-key="id"
            class="status-table"
            :lang="locale"
          >
            <template #[`item.actionTimestamp`]="{ item }">
              {{ $filters.formatDateLong(item.actionTimestamp) }}
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn
            class="mb-5 close-dlg"
            color="primary"
            variant="flat"
            :title="$t('trans.auditHistory.close')"
            @click="dialog = false"
          >
            <span :lang="locale">{{ $t('trans.auditHistory.close') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>
