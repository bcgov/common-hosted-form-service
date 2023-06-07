<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import formService from '~/services/formService.js';
import { useNotificationStore } from '~/store/notification';

const properties = defineProps({
  submissionId: {
    type: String,
    required: true,
  },
});

const { t } = useI18n({ useScope: 'global' });
const notificationStore = useNotificationStore();

const dialog = ref(false);
const loading = ref(true);
const history = ref([]);

const headers = computed(() => [
  {
    title: t('trans.auditHistory.userName'),
    key: 'updatedByUsername',
  },
  { title: t('trans.auditHistory.date'), key: 'actionTimestamp' },
]);

async function loadHistory() {
  loading.value = true;
  dialog.value = true;
  try {
    const response = await formService.listSubmissionEdits(
      properties.submissionId
    );
    history.value = response.data;
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.auditHistory.errorMsg'),
      consoleError:
        t('trans.auditHistory.consoleErrMsg') +
        `${properties.submissionId}: ${error}`,
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <span>
    <v-tooltip location="bottom">
      <template #activator="{ props }">
        <v-btn
          class="mx-1"
          color="primary"
          icon
          size="small"
          v-bind="props"
          @click="loadHistory"
        >
          <v-icon icon="mdi:mdi-history"></v-icon>
        </v-btn>
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
