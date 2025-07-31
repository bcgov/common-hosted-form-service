<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { approvalStatusService } from '~/services';
import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const { locale, t } = useI18n({ useScope: 'global' });

const dialog = ref({
  title: '',
  item: {
    id: null,
    origin: null,
    statusCode: null,
    comment: null,
  },
  show: false,
});
const loading = ref(true);
const approvalStatusCodes = ref([]);
const search = ref('');

const adminStore = useAdminStore();
const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { isRTL } = storeToRefs(formStore);
const { corsOriginRequestList } = storeToRefs(adminStore);

const headers = computed(() => [
  {
    title: t('trans.adminCorsApprovalTable.formId'),
    key: 'formId',
  },
  {
    title: t('trans.adminCorsApprovalTable.origin'),
    align: 'start',
    key: 'origin',
  },
  {
    title: t('trans.adminCorsApprovalTable.createdAt'),
    key: 'createdAt',
  },
  {
    title: t('trans.adminCorsApprovalTable.statusCode'),
    key: 'statusCode',
  },
  {
    title: t('trans.adminCorsApprovalTable.actions'),
    align: 'end',
    key: 'actions',
    filterable: false,
    sortable: false,
  },
]);

const items = computed(() => corsOriginRequestList.value);

async function getApprovalStatusCodes() {
  loading.value = true;
  try {
    const result = await approvalStatusService.listApprovalStatusCodes();
    approvalStatusCodes.value = result.data;
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.approvalStatus.getApprovalStatusCodesErrMsg'),
      consoleError: t('trans.approvalStatus.getApprovalStatusCodesConsErrMsg', {
        error: error.message,
      }),
    });
  } finally {
    loading.value = false;
  }
}

async function refreshCorsOriginRequests() {
  loading.value = true;
  await adminStore.listCorsOriginRequests();
  loading.value = false;
}

onMounted(async () => {
  await getApprovalStatusCodes();
  await refreshCorsOriginRequests();
});

function resetDialog() {
  dialog.value.title = '';
  dialog.value.item = {
    id: null,
    origin: null,
    statusCode: null,
    comment: null,
  };
  dialog.value.show = false;
}

function handleEdit(item) {
  resetDialog();
  dialog.value.item = { ...item };
  dialog.value.title = t('trans.adminCorsApprovalTable.editTitle');
  dialog.value.show = true;
}

async function saveItem() {
  try {
    loading.value = true;
    await adminStore.updateCorsOriginRequest(dialog.value.item);
    await refreshCorsOriginRequests();
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.adminCorsApprovalTable.saveItemErrMsg'),
      consoleError: t('trans.adminCorsApprovalTable.saveItemConsErrMsg', {
        error: error.message,
      }),
    });
  } finally {
    dialog.value.show = false;
    loading.value = false;
  }
}
</script>
<template>
  <div>
    <v-row no-gutters>
      <v-col cols="12" sm="4">
        <!-- search input -->
        <div :class="{ 'text-right': isRTL }">
          <v-text-field
            v-model="search"
            density="compact"
            variant="underlined"
            append-inner-icon="mdi-magnify"
            single-line
            :label="$t('trans.adminCorsApprovalTable.search')"
            class="pb-5"
            :class="{ label: isRTL }"
            :loading="loading"
          />
        </div>
      </v-col>
    </v-row>

    <v-data-table
      class="form-modules-table"
      :headers="headers"
      item-key="title"
      :items="items"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.adminCorsApprovalTable.loadingText')"
      :no-data-text="$t('trans.adminCorsApprovalTable.noDataText')"
    >
      <template #[`item.actions`]="{ item }">
        <span>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                class="mx-1"
                icon="mdi:mdi-pencil"
                v-bind="props"
                variant="text"
                :title="$t('trans.adminCorsApprovalTable.edit')"
                @click="handleEdit(item)"
              />
            </template>
            <span :lang="locale">{{
              $t('trans.adminCorsApprovalTable.edit')
            }}</span>
          </v-tooltip>
        </span>
      </template>
    </v-data-table>

    <BaseDialog
      v-model="dialog.show"
      eager
      type="CONTINUE"
      show-close-button
      :class="{ 'dir-rtl': isRTL }"
      width="1200"
      @continue-dialog="saveItem"
      @close-dialog="dialog.show = false"
    >
      <template #title>
        <h3>{{ dialog.title }}</h3>
      </template>
      <template #text>
        <v-form ref="corsForm" @submit="saveItem()" @submit.prevent>
          <v-text-field
            v-model="dialog.item.origin"
            aria-readonly="true"
            :readonly="true"
            density="compact"
            solid
            variant="outlined"
            :label="$t('trans.adminCorsApprovalTable.origin')"
            :lang="locale"
          />

          <v-select
            v-model="dialog.item.statusCode"
            :items="approvalStatusCodes"
            item-title="display"
            item-value="code"
            :label="$t('trans.adminCorsApprovalTable.display')"
            density="compact"
            solid
            variant="outlined"
            :lang="locale"
          />
        </v-form>
      </template>
    </BaseDialog>
  </div>
</template>
