<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';
import BaseDialog from '~/components/base/BaseDialog.vue';

const { t } = useI18n({ uesScope: 'global' });

const loading = ref(true);
const search = ref('');
const editDialog = ref({
  title: '',
  item: {
    id: null,
    formName: null,
    ministry: null,
    ministryText: null,
    name: null,
    endpointUrl: null,
    code: null,
    allowSendUserToken: false,
    sendApiKey: false,
  },
  show: false,
});

const adminStore = useAdminStore();
const formStore = useFormStore();

const { externalAPIList, externalAPIStatusCodes } = storeToRefs(adminStore);
const { isRTL, lang } = storeToRefs(formStore);

const headers = computed(() => [
  {
    title: t('trans.adminAPIsTable.ministry'),
    align: 'start',
    key: 'ministry',
  },
  {
    title: t('trans.adminAPIsTable.ministryName'),
    align: 'start',
    key: 'ministryName',
    // we don't want to see this (too long)
    // but we need it for searching, so it needs to be in the DOM
    headerProps: {
      class: 'hidden',
    },
    cellProps: {
      class: 'hidden',
    },
  },
  {
    title: t('trans.adminAPIsTable.formName'),
    align: 'start',
    key: 'formName',
  },
  {
    title: t('trans.adminAPIsTable.formId'),
    align: 'start',
    key: 'formId',
  },
  {
    title: t('trans.adminAPIsTable.name'),
    align: 'start',
    key: 'name',
  },
  {
    title: t('trans.adminAPIsTable.display'),
    align: 'start',
    key: 'display',
  },
  {
    title: t('trans.adminAPIsTable.actions'),
    align: 'end',
    key: 'actions',
    filterable: false,
    sortable: false,
  },
]);

const items = computed(() =>
  externalAPIList.value.map((x) => ({
    ...x,
    ministryName: getMinistryName(x),
  }))
);

onMounted(async () => {
  await adminStore.getExternalAPIStatusCodes();
  await adminStore.getExternalAPIs();
  loading.value = false;
});

function getMinistryName(item) {
  return item?.ministry ? t(`trans.ministries.${item.ministry}`) : '';
}

function resetEditDialog() {
  editDialog.value = {
    title: '',
    item: {
      id: null,
      formName: null,
      ministry: null,
      name: null,
      endpointUrl: null,
      code: null,
      allowSendUserToken: false,
      sendApiKey: false,
    },
    show: false,
  };
}

function handleEdit(item) {
  resetEditDialog();
  editDialog.value.item = { ...item };
  editDialog.value.item.ministryText = getMinistryName(item);
  editDialog.value.title = t('trans.adminAPIsTable.editTitle');
  editDialog.value.show = true;
}

async function saveItem() {
  await adminStore.updateExternalAPI(
    editDialog.value.item.id,
    editDialog.value.item
  );

  // reset and close on success...
  resetEditDialog();
  // reload data...
  loading.value = true;
  await adminStore.getExternalAPIs();
  loading.value = false;
}
</script>

<template>
  <div>
    <v-row no-gutters>
      <v-spacer />
      <v-col cols="12">
        <!-- search input -->
        <div
          class="submissions-search"
          :class="isRTL ? 'float-left' : 'float-right'"
        >
          <v-text-field
            v-model="search"
            density="compact"
            variant="underlined"
            :label="$t('trans.adminAPIsTable.search')"
            append-inner-icon="mdi-magnify"
            single-line
            hide-details
            class="pb-5"
            :class="{ 'dir-rtl': isRTL, label: isRTL }"
            :lang="lang"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      hover
      :headers="headers"
      item-key="title"
      :items="items"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.adminAPIsTable.loadingText')"
      :lang="lang"
    >
      <template #item.ministry="{ item }">
        {{ item.ministry }}
      </template>
      <template #item.ministryName="{ item }">
        {{ getMinistryName(item) }}
      </template>
      <template #item.formName="{ item }">
        {{ item.formName }}
      </template>
      <template #item.endpointUrl="{ item }">
        {{ item.formId }}
      </template>
      <template #item.name="{ item }">
        {{ item.name }}
      </template>
      <template #item.display="{ item }">
        {{ item.display }}
      </template>
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
                :title="$t('trans.adminAPIsTable.edit')"
                @click="handleEdit(item)"
              >
                <v-icon icon="mdi:mdi-pencil"></v-icon>
              </v-btn>
            </template>
            <span :lang="lang">{{ $t('trans.adminAPIsTable.edit') }}</span>
          </v-tooltip>
        </span>
      </template>
    </v-data-table>
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
      <v-form ref="form" @submit="saveItem()" @submit.prevent>
        <v-text-field
          v-model="editDialog.item.ministryText"
          aria-readonly="true"
          :readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminAPIsTable.ministry')"
          :lang="lang"
        />

        <v-text-field
          v-model="editDialog.item.formName"
          aria-readonly="true"
          :readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminAPIsTable.formName')"
          :lang="lang"
        />

        <v-text-field
          v-model="editDialog.item.name"
          aria-readonly="true"
          :readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminAPIsTable.name')"
          :lang="lang"
        />

        <v-text-field
          v-model="editDialog.item.endpointUrl"
          aria-readonly="true"
          :readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminAPIsTable.endpointUrl')"
          :lang="lang"
        />

        <v-select
          v-model="editDialog.item.code"
          :items="externalAPIStatusCodes"
          item-title="display"
          item-value="code"
          :label="$t('trans.adminAPIsTable.display')"
          density="compact"
          solid
          variant="outlined"
          :lang="lang"
        ></v-select>
        <v-checkbox
          v-model="editDialog.item.allowSendUserToken"
          class="my-0 pt-0"
        >
          <template #label>
            <span :class="{ 'mr-2': isRTL }" :lang="lang">
              {{ $t('trans.adminAPIsTable.allowSendUserToken') }}
            </span>
          </template>
        </v-checkbox>
        <v-checkbox
          v-model="editDialog.item.sendApiKey"
          class="my-0 pt-0"
          disabled
        >
          <template #label>
            <span :class="{ 'mr-2': isRTL }" :lang="lang">
              {{ $t('trans.externalAPI.formSendApiKey') }}
            </span>
          </template>
        </v-checkbox>
      </v-form>
    </template>
    <template #button-text-continue>
      <span :lang="lang">{{ $t('trans.externalAPI.save') }}</span>
    </template>
  </BaseDialog>
</template>
<style scoped>
/* TODO: Global Style! */
.submissions-search {
  width: 100%;
}
@media (min-width: 600px) {
  .submissions-search {
    max-width: 20em;
    float: right;
  }
}
@media (max-width: 599px) {
  .submissions-search {
    padding-left: 16px;
    padding-right: 16px;
  }
}

.submissions-table {
  clear: both;
}
@media (max-width: 1263px) {
  .submissions-table :deep(th) {
    vertical-align: top;
  }
}
.submissions-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
