<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import formService from '~/services/formService.js';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  submissionId: {
    type: String,
    required: true,
  },
});

const notificationStore = useNotificationStore();

const editHistoryDialog = ref(false);
const loading = ref(true);
const history = ref([]);

const { isRTL } = storeToRefs(useFormStore());

/* c8 ignore start */
const headers = computed(() => {
  return [
    {
      title: t('trans.auditHistory.userName'),
      key: 'updatedByUsername',
    },
    { title: t('trans.auditHistory.date'), key: 'actionTimestamp' },
  ];
});
/* c8 ignore end */

async function loadHistory() {
  loading.value = true;
  editHistoryDialog.value = true;
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

defineExpose({ loadHistory });
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

    <v-dialog v-model="editHistoryDialog" width="900">
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
            @click="editHistoryDialog = false"
          >
            <span :lang="locale">{{ $t('trans.auditHistory.close') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>
