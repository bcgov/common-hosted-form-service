<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import {
  approvalStatusService,
  corsOriginRequestService,
  formService,
} from '~/services';
import { NotificationTypes } from '~/utils/constants';

const { t, locale } = useI18n();

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { form, isRTL } = storeToRefs(formStore);

const corsForm = ref(null);
const dialog = ref({
  title: t('trans.corsOrigin.addNew'),
  item: {
    id: null,
    formId: null,
    origin: null,
    statusCode: null,
  },
  show: false,
});
const approvalStatusCodes = ref([]);
const loading = ref(true);
const corsRequests = ref([]);

const originRules = [
  (value) => !!value || t('trans.corsOrigin.originRequired'),
  /*   (value) => {
    const regex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:\d+)?(\/.*)?$/;
    return regex.test(value) || t('trans.corsOrigin.originInvalid');
  }, */
];

const headers = computed(() => [
  { title: t('trans.corsOrigin.origin'), key: 'origin' },
  { title: t('trans.corsOrigin.statusCode'), key: 'statusCode' },
  { title: t('trans.corsOrigin.actions'), key: 'actions' },
]);

const items = computed(() => corsRequests.value);

onMounted(async () => {
  await getApprovalStatusCodes();
  await fetchCorsOriginRequests();
});

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

async function fetchCorsOriginRequests() {
  loading.value = true;
  try {
    const results = await formService.listCorsOriginRequests(form.value.id);
    corsRequests.value = results.data;
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.corsOrigin.getCorsOriginRequestsErrMsg'),
      consoleError: t('trans.corsOrigin.getCorsOriginRequestsConsErrMsg', {
        error: error.message,
      }),
    });
  } finally {
    loading.value = false;
  }
}

function resetDialog() {
  dialog.value = {
    title: '',
    item: {
      id: null,
      formId: form.value.id,
      origin: null,
      statusCode: null,
    },
    show: false,
  };
}

async function handleDelete(item) {
  try {
    await corsOriginRequestService.deleteCorsOriginRequest(item.id);
    notificationStore.addNotification({
      text: t('trans.corsOrigin.deleteSuccessMsg'),
      ...NotificationTypes.SUCCESS,
    });
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.corsOrigin.deleteErrorMsg'),
      consoleError: t('trans.corsOrigin.deleteErrorConsoleMsg', {
        error: error.message,
      }),
    });
  } finally {
    await fetchCorsOriginRequests();
  }
}

function handleEdit(item) {
  resetDialog();
  dialog.value.item = item;
  dialog.value.title = t('trans.corsOrigin.editTitle');
  dialog.value.show = true;
}

function handleAdd() {
  resetDialog();
  dialog.value.title = t('trans.corsOrigin.addTitle');
  dialog.value.show = true;
}

async function saveItem() {
  if (!corsForm.value.validate()) return;
  const isEdit = dialog.value.item.id;
  try {
    let text;
    if (isEdit) {
      await corsOriginRequestService.updateCorsOriginRequest(dialog.value.item);
      text = t('trans.corsOrigin.updateSuccessMsg');
    } else {
      dialog.value.item.formId = form.value.id;
      await corsOriginRequestService.createCorsOriginRequest(dialog.value.item);
      text = t('trans.corsOrigin.saveSuccessMsg');
    }
    notificationStore.addNotification({
      text: text,
      ...NotificationTypes.SUCCESS,
    });
    resetDialog();
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.corsOrigin.saveErrorMsg'),
      consoleError: t('trans.corsOrigin.saveErrorConsoleMsg', {
        error: error.message,
      }),
    });
  } finally {
    await fetchCorsOriginRequests();
  }
}

function getStatusColour(statusCode) {
  switch (statusCode) {
    case 'APPROVED':
      return 'green';
    case 'DENIED':
      return 'red';
    case 'PENDING':
      return 'yellow';
    default:
      return 'grey';
  }
}
</script>
<template>
  <div
    class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
  >
    <div>
      <h3 class="mt-3" :lang="locale">
        {{ $t('trans.corsOrigin.disclaimer') }}
      </h3>
      <ul :class="isRTL ? 'mr-6' : null">
        <li :lang="locale">{{ t('trans.corsOrigin.infoA') }}</li>
        <li :lang="locale">
          {{ $t('trans.corsOrigin.infoB') }}
        </li>
        <li :lang="locale">
          {{ $t('trans.corsOrigin.infoC') }}
        </li>
      </ul>
    </div>
    <div>
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            color="primary"
            class="mx-1"
            icon="mdi:mdi-plus"
            v-bind="props"
            variant="text"
            @click="handleAdd()"
          ></v-btn>
        </template>
        <span :lang="locale">{{ $t('trans.corsOrigin.addTitle') }}</span>
      </v-tooltip>
    </div>
  </div>

  <v-data-table-server
    :headers="headers"
    :items="items"
    :items-length="items.length"
    :loading="loading"
    :no-data-text="$t('trans.corsOrigin.noData')"
  >
    <template #item.statusCode="{ item }">
      <v-chip :color="getStatusColour(item.statusCode)">{{
        item.statusCode
      }}</v-chip>
    </template>
    <!-- Actions -->
    <template #item.actions="{ item }">
      <span>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              class="mx-1"
              icon
              v-bind="props"
              variant="text"
              :title="$t('trans.corsOrigin.edit')"
              @click="handleEdit(item)"
            >
              <v-icon icon="mdi:mdi-pencil"></v-icon>
            </v-btn>
          </template>
          <span :lang="locale">{{ $t('trans.corsOrigin.edit') }}</span>
        </v-tooltip>
      </span>
      <span>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">
              <v-btn
                color="red"
                class="mx-1"
                icon
                variant="text"
                :title="$t('trans.corsOrigin.delete')"
                @click="handleDelete(item)"
              >
                <v-icon icon="mdi:mdi-delete"></v-icon>
              </v-btn>
            </span>
          </template>
          <span :lang="locale">{{ $t('trans.corsOrigin.delete') }}</span>
        </v-tooltip>
      </span>
    </template>
  </v-data-table-server>

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
      {{ dialog.title }}
    </template>
    <template #text>
      <v-form ref="corsForm" @submit="saveItem()" @submit.prevent>
        <v-text-field
          v-model="dialog.item.origin"
          autofocus
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.corsOrigin.origin')"
          data-text="text-origin"
          :rules="originRules"
          :lang="locale"
        />
      </v-form>
    </template>
    <template #actions>
      <v-btn @click="dialog.show = false">{{
        $t('trans.corsOrigin.dialogClose')
      }}</v-btn>
    </template>
  </BaseDialog>
</template>
