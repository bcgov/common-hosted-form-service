<script setup>
import _ from 'lodash';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';
import BaseDialog from '~/components/base/BaseDialog.vue';

const { t, locale } = useI18n({ useScope: 'global' });

const loading = ref(true);
const search = ref('');
const editDialog = ref({
  title: '',
  item: {
    id: null,
    ministry: null,
    formName: null,
    domain: null,
    status: null,
    reason: null,
  },
  show: false,
  history: [],
});

const firstDataLoad = ref(true);
const forceTableRefresh = ref(0);
const debounceInput = ref(null);
const debounceTime = ref(300);
const currentPage = ref(1);
const itemsPP = ref(10);
const domainHistoryMap = ref(new Map());

const adminStore = useAdminStore();
const formStore = useFormStore();

const { formEmbedDomainsList, formEmbedDomainsTotal } = storeToRefs(adminStore);
const { isRTL } = storeToRefs(formStore);

const headers = computed(() => [
  {
    title: t('trans.adminFormEmbed.domain'),
    align: 'start',
    key: 'domain',
  },
  {
    title: t('trans.adminFormEmbed.formName'),
    align: 'start',
    key: 'formName',
  },
  {
    title: t('trans.adminFormEmbed.ministry'),
    align: 'start',
    key: 'ministry',
  },
  {
    title: t('trans.adminFormEmbed.ministryName'),
    align: 'start',
    key: 'ministryName',
  },
  {
    title: t('trans.adminFormEmbed.status'),
    key: 'status',
  },
  {
    title: t('trans.adminFormEmbed.reason'),
    key: 'reason',
  },
  {
    title: t('trans.adminFormEmbed.requestedBy'),
    key: 'requestedBy',
  },
  {
    title: t('trans.adminFormEmbed.requestedAt'),
    key: 'requestedAt',
  },
  {
    title: t('trans.adminFormEmbed.actions'),
    align: 'end',
    key: 'actions',
    filterable: false,
    sortable: false,
  },
]);

const items = computed(() =>
  formEmbedDomainsList.value.map((x) => ({
    ...x,
    ministryName: getMinistryName(x),
    history: domainHistoryMap.value.get(x.id) || [],
  }))
);

async function getRequests() {
  loading.value = true;
  adminStore.getFormEmbedDomains({
    paginationEnabled: true,
    page: currentPage.value - 1,
    itemsPerPage: itemsPP.value,
    search: search.value,
    searchEnabled: search.value.length > 0,
  });
  loading.value = false;
}

onMounted(async () => {
  loading.value = true;
  await getRequests();
  debounceInput.value = _.debounce(async () => {
    forceTableRefresh.value += 1;
  }, debounceTime.value);
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
      ministry: null,
      formName: null,
      domain: null,
      status: null,
      reason: null,
    },
    show: false,
  };
}

function handleEdit(item) {
  resetEditDialog();
  editDialog.value.item = { ...item };
  editDialog.value.item.ministryText = getMinistryName(item);
  editDialog.value.title = t('trans.adminFormEmbed.editTitle');
  editDialog.value.show = true;
}

async function handleDelete(item) {
  loading.value = true;
  await adminStore.removeFormEmbedDomainRequest(item.id);
  resetEditDialog();
  await getRequests();
  loading.value = false;
}

async function saveItem() {
  const itemId = editDialog.value.item.id;
  const reviewData = {
    status: editDialog.value.item.status,
    reason: editDialog.value.item.reason,
  };

  await adminStore.updateFormEmbedDomainRequest(
    editDialog.value.item.id,
    reviewData
  );

  // Reset and close on success
  resetEditDialog();

  loading.value = true;
  await getRequests();
  const history = await adminStore.getFormEmbedDomainHistory(itemId);
  domainHistoryMap.value.set(itemId, history);
  loading.value = false;
}

async function updateOptions(options) {
  const { page, itemsPerPage } = options;
  if (page) {
    currentPage.value = page;
  }
  if (itemsPerPage) {
    itemsPP.value = itemsPerPage;
  }
  if (!firstDataLoad.value) {
    await getRequests();
  }
  firstDataLoad.value = false;
}

async function handleSearch(value) {
  search.value = value;
  if (value === '') {
    await getRequests();
  } else {
    debounceInput.value();
  }
}

async function handleExpand(item, isExpanded, toggleExpand) {
  if (!isExpanded(item)) {
    loading.value = true;
    const history = await adminStore.getFormEmbedDomainHistory(item.raw.id);
    domainHistoryMap.value.set(item.raw.id, history);
    toggleExpand(item);
    loading.value = false;
  } else {
    toggleExpand(item);
  }
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
            :label="$t('trans.adminFormEmbed.search')"
            append-inner-icon="mdi-magnify"
            single-line
            hide-details
            class="pb-5"
            :class="{ 'dir-rtl': isRTL, label: isRTL }"
            :lang="locale"
            @update:modelValue="handleSearch"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table-server
      class="submissions-table"
      hover
      :headers="headers"
      item-key="domain"
      :items="items"
      :items-per-page="itemsPP"
      :items-length="
        formEmbedDomainsTotal === undefined ? 0 : formEmbedDomainsTotal
      "
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.adminFormEmbed.loadingText')"
      :lang="locale"
      show-expand
      @update:options="updateOptions"
    >
      <template #item.domain="{ item }">
        {{ item.domain }}
      </template>
      <template #item.formName="{ item }">
        {{ item.formName }}
      </template>
      <template #item.ministry="{ item }">
        {{ item.ministry }}
      </template>
      <template #item.ministryName="{ item }">
        {{ getMinistryName(item) }}
      </template>
      <template #item.status="{ item }">
        {{ item.status }}
      </template>
      <template #item.reason="{ item }">
        {{ item.reason }}
      </template>
      <template #item.requestedBy="{ item }">
        {{ item.requestedBy }}
      </template>
      <template #item.requestedAt="{ item }">
        {{ item.requestedAt }}
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
                :title="$t('trans.adminFormEmbed.edit')"
                @click="handleEdit(item)"
              >
                <v-icon icon="mdi:mdi-pencil"></v-icon>
              </v-btn>
            </template>
            <span :lang="locale">{{ $t('trans.adminFormEmbed.edit') }}</span>
          </v-tooltip>
        </span>
        <span>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="red"
                class="mx-1"
                icon
                v-bind="props"
                variant="text"
                :title="$t('trans.adminFormEmbed.delete')"
                @click="handleDelete(item)"
              >
                <v-icon icon="mdi:mdi-delete"></v-icon>
              </v-btn>
            </template>
            <span :lang="locale">{{ $t('trans.adminFormEmbed.delete') }}</span>
          </v-tooltip>
        </span>
      </template>
      <template
        #item.data-table-expand="{ internalItem, isExpanded, toggleExpand }"
      >
        <v-btn
          :append-icon="
            isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'
          "
          class="text-none"
          color="medium-emphasis"
          size="small"
          variant="text"
          border
          slim
          @click="handleExpand(internalItem, isExpanded, toggleExpand)"
        >
          {{
            isExpanded(internalItem)
              ? $t('trans.formDesigner.collapse')
              : $t('trans.adminFormEmbed.viewHistory')
          }}
        </v-btn>
      </template>
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="py-2">
            <v-sheet rounded="lg" border>
              <v-table density="compact">
                <tbody class="bg-surface-light">
                  <tr>
                    <td>{{ $t('trans.adminFormEmbed.previousStatus') }}</td>
                    <td>{{ $t('trans.adminFormEmbed.newStatus') }}</td>
                    <td>{{ $t('trans.adminFormEmbed.reason') }}</td>
                    <td>{{ $t('trans.adminFormEmbed.createdBy') }}</td>
                    <td>{{ $t('trans.adminFormEmbed.createdAt') }}</td>
                  </tr>
                </tbody>
                <tbody>
                  <tr v-for="(historyItem, index) in item.history" :key="index">
                    <td>{{ historyItem.previousStatus }}</td>
                    <td>{{ historyItem.newStatus }}</td>
                    <td>{{ historyItem.reason }}</td>
                    <td>{{ historyItem.statusChangedBy }}</td>
                    <td>{{ historyItem.statusChangedAt }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-sheet>
          </td>
        </tr>
      </template>
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
      <v-form ref="form" @submit="saveItem()" @submit.prevent>
        <v-text-field
          v-model="editDialog.item.ministry"
          aria-readonly="true"
          :readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminFormEmbed.ministry')"
          :lang="locale"
        />

        <v-text-field
          v-model="editDialog.item.formName"
          aria-readonly="true"
          :readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminFormEmbed.formName')"
          :lang="locale"
        />

        <v-text-field
          v-model="editDialog.item.domain"
          aria-readonly="true"
          :readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminFormEmbed.domain')"
          :lang="locale"
        />

        <v-select
          v-model="editDialog.item.status"
          :items="['PENDING', 'APPROVED', 'DENIED']"
          item-title="status"
          item-value="status"
          :label="$t('trans.adminFormEmbed.status')"
          density="compact"
          solid
          variant="outlined"
          :lang="locale"
        ></v-select>

        <v-text-field
          v-model="editDialog.item.reason"
          aria-readonly="true"
          density="compact"
          solid
          variant="outlined"
          :label="$t('trans.adminFormEmbed.reason')"
          :lang="locale"
        />
      </v-form>
    </template>
    <template #button-text-continue>
      <span :lang="locale">{{ $t('trans.adminFormEmbed.save') }}</span>
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
