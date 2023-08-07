<template>
  <span :class="{ 'dir-rtl': isRTL }">
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          class="mx-1"
          @click="loadHistory"
          color="primary"
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>history</v-icon>
        </v-btn>
      </template>
      <span :class="{ 'dir-rtl': isRTL }" :lang="lang">{{
        $t('trans.auditHistory.viewEditHistory')
      }}</span>
    </v-tooltip>

    <v-dialog v-model="dialog" width="900">
      <v-card>
        <v-card-title
          class="text-h5 pb-0"
          :class="{ 'dir-rtl': isRTL }"
          :lang="lang"
          >{{ $t('trans.auditHistory.editHistory') }}</v-card-title
        >
        <v-card-text>
          <hr />
          <p :class="{ 'dir-rtl': isRTL }" :lang="lang">
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
            :lang="lang"
          >
            <template #[`item.actionTimestamp`]="{ item }">
              {{ item.actionTimestamp | formatDateLong }}
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn class="mb-5 close-dlg" color="primary" @click="dialog = false">
            <span :lang="lang">{{ $t('trans.auditHistory.close') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import formService from '@/services/formService.js';

export default {
  name: 'AuditHistory',
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
          text: this.$t('trans.auditHistory.userName'),
          value: 'updatedByUsername',
        },
        { text: this.$t('trans.auditHistory.date'), value: 'actionTimestamp' },
      ];
    },
    ...mapGetters('form', ['isRTL', 'lang']),
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
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
          message: this.$t('trans.auditHistory.errorMsg'),
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
