<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { formService } from '~/services';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';
import BaseDialog from '~/components/base/BaseDialog.vue';

const { locale, t } = useI18n({ useScope: 'global' });

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { form, isRTL } = storeToRefs(formStore);

const loading = ref(false);
const externalAPIStatusCodes = ref([]);
const items = ref([]);
const editDialog = ref({
  title: '',
  item: {
    id: null,
    formId: null,
    name: null,
    endpointUrl: null,
    code: null,
    sendApiKey: false,
    apiKeyHeader: null,
    apiKey: null,
    sendUserToken: false,
    userTokenHeader: null,
    userTokenBearer: false,
    sendUserInfo: false,
  },
  show: false,
});
const externalApisForm = ref(null);

const nameRules = ref([
  (v) => !!v || t('trans.externalAPI.formNameReq'),
  (v) => (v && v.length <= 255) || t('trans.externalAPI.formNameMaxChars'),
]);
const endpointUrlRules = ref([
  (v) => !!v || t('trans.externalAPI.validEndpointRequired'),
  (v) =>
    (v &&
      new RegExp(
        /^(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?$/gim
      ).test(v)) ||
    t('trans.externalAPI.validEndpointRequired'),
]);
const apiKeyHeaderRules = ref([
  (v) => {
    if (editDialog.value.item.sendApiKey) {
      return !!v || t('trans.externalAPI.apiKeyFieldRequired');
    }
    return true;
  },
]);
const userTokenHeaderRules = ref([
  (v) => {
    if (editDialog.value.item.sendUserToken) {
      return !!v || t('trans.externalAPI.userTokenFieldRequired');
    }
    return true;
  },
]);

const headers = computed(() => [
  { title: 'Name', key: 'name' },
  { title: 'URL', key: 'endpointUrl' },
  { title: 'Status', key: 'code' },
  { title: 'Actions', key: 'actions', align: 'end' },
]);
const techdocsLink = computed(
  () =>
    'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Getting-Live-Data-in-Your-Forms/'
);

onMounted(async () => {
  await getExternalAPIStatusCodes();
  await fetchExternalAPIs();
});

async function fetchExternalAPIs() {
  loading.value = true;
  try {
    const result = await formService.externalAPIList(form.value.id);
    // Clear existing items before adding new ones
    items.value = [];
    resetEditDialog();

    // Iterate through each item in the result
    result.data.forEach((rec) => {
      items.value.push(rec);
    });
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.externalAPI.fetchListError'),
      consoleError: t('trans.externalAPI.fetchListError', {
        error: e.message,
      }),
    });
  } finally {
    loading.value = false;
  }
}

async function getExternalAPIStatusCodes() {
  try {
    const result = await formService.externalAPIStatusCodes(form.value.id);
    externalAPIStatusCodes.value = result.data;
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.externalAPI.fetchStatusListError'),
      consoleError: t('trans.externalAPI.fetchStatusListError', {
        error: e.message,
      }),
    });
  }
}

function resetEditDialog() {
  editDialog.value = {
    title: '',
    item: {
      id: null,
      formId: form.value.id,
      name: null,
      endpointUrl: null,
      code: null,
      sendApiKey: false,
      apiKeyHeader: null,
      apiKey: null,
      allowSendUserToken: false,
      sendUserToken: false,
      userTokenHeader: null,
      userTokenBearer: false,
      sendUserInfo: false,
    },
    show: false,
  };
}

async function handleDelete(item) {
  try {
    await formService.externalAPIDelete(form.value.id, item.id);
    notificationStore.addNotification({
      text: t('trans.externalAPI.deleteSuccess'),
      ...NotificationTypes.SUCCESS,
    });
  } catch (e) {
    notificationStore.addNotification({
      text: t('trans.externalAPI.deleteError'),
      consoleError: t('trans.externalAPI.deleteError', {
        error: e.message,
      }),
    });
  } finally {
    fetchExternalAPIs();
  }
}

function handleEdit(item) {
  resetEditDialog();
  editDialog.value.item = item;
  editDialog.value.title = t('trans.externalAPI.editTitle');
  editDialog.value.show = true;
}

function handleNew() {
  resetEditDialog();
  editDialog.value.title = t('trans.externalAPI.createTitle');
  editDialog.value.show = true;
}

async function saveItem() {
  const { valid } = await externalApisForm.value.validate();
  if (valid) {
    const isEdit = editDialog.value.item.id;
    try {
      if (isEdit) {
        await formService.externalAPIUpdate(
          form.value.id,
          editDialog.value.item.id,
          editDialog.value.item
        );
        notificationStore.addNotification({
          text: t('trans.externalAPI.editSuccess'),
          ...NotificationTypes.SUCCESS,
        });
      } else {
        await formService.externalAPICreate(
          form.value.id,
          editDialog.value.item
        );
        notificationStore.addNotification({
          text: t('trans.externalAPI.createSuccess'),
          ...NotificationTypes.SUCCESS,
        });
      }
      // reset and close on success...
      resetEditDialog();
    } catch (e) {
      const msg = isEdit
        ? 'trans.externalAPI.editError'
        : 'trans.externalAPI.createError';
      notificationStore.addNotification({
        text: t(msg),
        consoleError: t(msg, {
          error: e.message,
        }),
      });
    } finally {
      await fetchExternalAPIs();
    }
  }
}
</script>

<template>
  <div
    class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
  >
    <!-- page title -->
    <div>
      {{ $t('trans.externalAPI.info') }}
    </div>
    <div>
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            color="primary"
            class="mx-1"
            icon
            v-bind="props"
            variant="text"
            :title="$t('trans.externalAPI.create')"
            @click="handleNew()"
          >
            <v-icon icon="mdi:mdi-plus-circle"></v-icon>
          </v-btn>
        </template>
        <span :lang="locale">{{ $t('trans.externalAPI.create') }}</span>
      </v-tooltip>

      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-icon
            color="primary"
            class="mx-1"
            :class="{ 'mx-1': isRTL }"
            v-bind="props"
            icon="mdi:mdi-help-circle-outline"
          ></v-icon>
        </template>
        <span>
          <a
            :href="techdocsLink"
            class="preview_info_link_field_white"
            target="_blank"
            :hreflang="locale"
          >
            {{ $t('trans.formSettings.learnMore') }}
            <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline"></v-icon>
          </a>
        </span>
      </v-tooltip>
    </div>
  </div>
  <div>
    <span style="display: inline-block" class="mt-2"> </span>
    <v-data-table-server
      class="submissions-table mt-2"
      :headers="headers"
      :loading="loading"
      :items="items"
      :items-length="items.length"
    >
      <!-- Preview/Download File -->
      <template #item.name="{ item }">{{ item.name }}</template>
      <template #item.endpointUrl="{ item }">{{ item.endpointUrl }}</template>
      <template #item.code="{ item }">{{
        externalAPIStatusCodes.find((x) => x.code === item.code)['display']
      }}</template>
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
                :title="$t('trans.externalAPI.edit')"
                @click="handleEdit(item)"
              >
                <v-icon icon="mdi:mdi-pencil"></v-icon>
              </v-btn>
            </template>
            <span :lang="locale">{{ $t('trans.externalAPI.edit') }}</span>
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
                  :title="$t('trans.externalAPI.delete')"
                  @click="handleDelete(item)"
                >
                  <v-icon icon="mdi:mdi-delete"></v-icon>
                </v-btn>
              </span>
            </template>
            <span :lang="locale">{{ $t('trans.externalAPI.delete') }}</span>
          </v-tooltip>
        </span>
      </template>
      <!-- Empty footer, remove if allowing multiple templates -->
      <template #bottom></template>
    </v-data-table-server>
  </div>

  <BaseDialog
    v-model="editDialog.show"
    eager
    type="CONTINUE"
    show-close-button
    :class="{ 'dir-rtl': isRTL }"
    :title="editDialog.title"
    width="1200"
    @continue-dialog="saveItem"
    @close-dialog="editDialog.show = false"
    ><template #title>{{ editDialog.title }}</template>
    <template #text>
      <v-form ref="externalApisForm" @submit="saveItem()" @submit.prevent>
        <v-row class="mt-4">
          <v-col cols="4">
            <v-text-field
              v-model="editDialog.item.name"
              autofocus
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formName')"
              data-test="text-name"
              :rules="nameRules"
              :lang="locale"
            />
          </v-col>
          <v-col cols="8">
            <v-text-field
              v-model="editDialog.item.endpointUrl"
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formEndpointUrl')"
              data-test="text-endpointUrl"
              :rules="endpointUrlRules"
              :lang="locale"
            />
          </v-col>
        </v-row>
        <v-row v-if="editDialog.item.id" class="mt-0">
          <v-col cols="4"></v-col>
          <v-col cols="8">
            <v-select
              v-if="editDialog.item.id"
              v-model="editDialog.item.code"
              :items="externalAPIStatusCodes"
              item-title="display"
              item-value="code"
              aria-readonly="true"
              :readonly="true"
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formStatus')"
              data-test="text-code"
              :lang="locale"
          /></v-col>
        </v-row>
        <!-- API Key -->
        <hr />
        <v-row>
          <v-col cols="12" class="pb-0"
            ><v-checkbox v-model="editDialog.item.sendApiKey" class="my-0 pt-0">
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="locale">
                  {{ $t('trans.externalAPI.formSendApiKey') }}
                </span>
              </template>
            </v-checkbox></v-col
          >
        </v-row>
        <v-row class="mt-0">
          <v-col cols="4"
            ><v-text-field
              v-model="editDialog.item.apiKeyHeader"
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formApiKeyHeader')"
              data-test="text-apiKeyHeader"
              :lang="locale"
              :rules="apiKeyHeaderRules"
          /></v-col>
          <v-col cols="8">
            <v-text-field
              v-model="editDialog.item.apiKey"
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formApiKey')"
              data-test="text-apiKey"
              :lang="locale"
              :rules="apiKeyHeaderRules"
          /></v-col>
        </v-row>
        <!-- User Information -->
        <hr />
        <v-row>
          <v-col cols="4" class="pb-0"
            ><v-checkbox
              v-model="editDialog.item.sendUserInfo"
              class="my-0 pt-0"
            >
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="locale">
                  {{ $t('trans.externalAPI.formSendUserInfo') }}
                </span>
              </template>
            </v-checkbox></v-col
          >
        </v-row>
        <!-- User Token -->
        <hr v-if="editDialog.item.allowSendUserToken" />
        <v-row v-if="editDialog.item.allowSendUserToken">
          <v-col cols="4" class="pb-0">
            <v-checkbox
              v-model="editDialog.item.sendUserToken"
              class="my-0 pt-0"
            >
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="locale">
                  {{ $t('trans.externalAPI.formSendUserToken') }}
                </span>
              </template>
            </v-checkbox></v-col
          >
          <v-col cols="8" class="pb-0">
            <v-checkbox
              v-model="editDialog.item.userTokenBearer"
              class="my-0 pt-0"
            >
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="locale">
                  {{ $t('trans.externalAPI.formUserTokenBearer') }}
                </span>
              </template>
            </v-checkbox></v-col
          >
        </v-row>
        <v-row v-if="editDialog.item.allowSendUserToken" class="mt-0">
          <v-col cols="4"></v-col>
          <v-col cols="8">
            <v-text-field
              v-model="editDialog.item.userTokenHeader"
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formUserTokenHeader')"
              data-test="text-userTokenHeader"
              :lang="locale"
              :rules="userTokenHeaderRules"
          /></v-col>
        </v-row>
      </v-form>
    </template>
    <template #button-text-continue>
      <span :lang="locale">{{ $t('trans.externalAPI.save') }}</span>
    </template>
  </BaseDialog>
</template>

<style scoped>
.action-icon:not(:last-child) {
  margin-right: 20px;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.submissions-table {
  clear: both;
}

@media (max-width: 1263px) {
  .submissions-table :deep(th) {
    vertical-align: top;
  }
}
.submissions-table :deep(thead) tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
