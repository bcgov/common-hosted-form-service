<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions, NotificationTypes } from '~/utils/constants';
import { embedService } from '~/services';

const { locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    required: true,
    type: String,
  },
});

const newDomainForm = ref(null);
const loading = ref(false);
const submitting = ref(false);
const valid = ref(false);
const newDomain = ref('');
const domains = ref([]);
const domainHistoryMap = ref(new Map());

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { permissions, isRTL } = storeToRefs(formStore);

const headers = ref([
  {
    title: 'Domain',
    align: 'start',
    key: 'domain',
  },
  {
    title: 'Requested At',
    key: 'requestedAt',
  },
  {
    title: 'Status',
    key: 'status',
  },
  {
    title: 'Actions',
    value: 'actions',
    align: 'end',
    sortable: false,
  },
]);

const canUpdate = computed(() => {
  return permissions.value.includes(FormPermissions.FORM_UPDATE);
});

const items = computed(() =>
  domains.value.map((x) => ({
    ...x,
    history: domainHistoryMap.value.get(x.id) || [],
  }))
);

const domainRules = ref([
  (v) => {
    const pattern =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+$/;
    return pattern.test(v) || 'Enter a valid domain (e.g., example.com)';
  },
]);

onMounted(() => {
  fetchData();
});

async function fetchData() {
  try {
    loading.value = true;

    // Fetch allowed domains
    const response = await embedService.listDomains(properties.formId);
    domains.value = response.data;
  } catch (error) {
    notificationStore.addNotification({
      text: 'An error occurred while fetching embed settings.',
      consoleError: error,
    });
  } finally {
    loading.value = false;
  }
}

async function requestDomain() {
  if (!newDomainForm.value.validate()) return;

  try {
    submitting.value = true;

    await embedService.requestDomain(properties.formId, {
      domain: newDomain.value,
    });

    notificationStore.addNotification({
      text: 'Domain request submitted successfully.',
      ...NotificationTypes.SUCCESS,
    });

    newDomain.value = '';
    newDomainForm.value.resetValidation();
    await fetchData();
  } catch (error) {
    notificationStore.addNotification({
      text: 'Failed to submit domain request.',
      consoleError: error.response.data.title,
    });
  } finally {
    submitting.value = false;
  }
}

async function removeDomain(domain) {
  try {
    await embedService.removeDomain(properties.formId, domain.id);

    notificationStore.addNotification({
      text: 'Domain removed successfully.',
      ...NotificationTypes.SUCCESS,
    });

    await fetchData();
  } catch (error) {
    notificationStore.addNotification({
      text: 'Failed to remove domain.',
      consoleError: error,
    });
  }
}

function getStatusColour(status) {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'DENIED':
      return 'error';
    case 'PENDING':
      return 'warning';
    default:
      return 'grey';
  }
}

async function handleExpand(item, isExpanded, toggleExpand) {
  if (!isExpanded(item)) {
    try {
      const history = await embedService.getDomainHistory(
        properties.formId,
        item.raw.id
      );
      domainHistoryMap.value.set(item.raw.id, history.data);
      toggleExpand(item);
    } catch (error) {
      notificationStore.addNotification({
        text: 'Failed to fetch domain history.',
        consoleError: error,
      });
    } finally {
      loading.value = false;
    }
  } else {
    toggleExpand(item);
  }
}
</script>

/* c8 ignore start */
<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div v-if="!canUpdate" class="mt-3 mb-6">
      <v-icon class="mr-1" color="primary" icon="mdi:mdi-information"></v-icon>
      <span :lang="locale" v-html="$t('trans.apiKey.formOwnerKeyAcess')"></span>
    </div>
    <h3 class="mt-3" :lang="locale">
      {{ $t('trans.apiKey.disclaimer') }}
    </h3>
    <ul :class="isRTL ? 'mr-6' : null">
      <li :lang="locale">
        Ensure that you have permission to embed this CHEFS form in your domain
      </li>
    </ul>
    <v-skeleton-loader :loading="loading" type="button" class="bgtrans">
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        show-expand
      >
        <template #item.status="{ item }">
          <v-chip :color="getStatusColour(item.status)">
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
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
                  :disabled="!canUpdate"
                  @click="removeDomain(item)"
                >
                  <v-icon icon="mdi:mdi-delete" />
                </v-btn>
              </template>
              <span :lang="locale">{{
                $t('trans.adminFormEmbed.delete')
              }}</span>
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
            {{ isExpanded(internalItem) ? 'Collapse' : 'View History' }}
          </v-btn>
        </template>
        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="py-2">
              <v-sheet rounded="lg" border>
                <v-table density="compact">
                  <tbody class="bg-surface-light">
                    <tr>
                      <td>Previous Status</td>
                      <td>New Status</td>
                      <td>Reason</td>
                      <td>Created By</td>
                      <td>Created At</td>
                    </tr>
                  </tbody>
                  <tbody>
                    <tr
                      v-for="(historyItem, index) in item.history"
                      :key="index"
                    >
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
      </v-data-table>
      <v-form ref="newDomainForm" v-model="valid">
        <v-text-field
          v-model="newDomain"
          label="Domain"
          placeholder="example.com"
          :rules="[(v) => !!v || 'Domain is required', domainRules]"
          hint="Enter the domain without protocol (e.g., example.com)"
          persistent-hint
          required
        />
        <v-btn
          :disabled="!valid"
          :loading="submitting"
          class="mt-4"
          @click="requestDomain"
        >
          Request Domain
        </v-btn>
      </v-form>
    </v-skeleton-loader>
  </div>
</template>
/* c8 ignore end */
