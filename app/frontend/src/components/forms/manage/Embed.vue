<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormPermissions, NotificationTypes } from '~/utils/constants';
import { embedService } from '~/services';

const { t, locale } = useI18n({ useScope: 'global' });

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
const domainStatuses = ref([]);
const domainHistoryMap = ref(new Map());

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { permissions, isRTL } = storeToRefs(formStore);

const headers = ref([
  {
    title: t('trans.formEmbed.domain'),
    align: 'start',
    key: 'domain',
  },
  {
    title: t('trans.formEmbed.requestedAt'),
    key: 'requestedAt',
  },
  {
    title: t('trans.formEmbed.status'),
    key: 'status',
  },
  {
    title: t('trans.formEmbed.actions'),
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
    return pattern.test(v) || t('trans.formEmbed.domainRules');
  },
]);

onMounted(() => {
  fetchDomainStatuses();
  fetchData();
});

async function fetchDomainStatuses() {
  try {
    const response = await embedService.getFormEmbedDomainStatusCodes(
      properties.formId
    );
    domainStatuses.value = response.data;
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formEmbed.getStatusCodesErr'),
      consoleError: t('trans.formEmbed.getStatusCodesConsErr', {
        error: error,
      }),
    });
  }
}

async function fetchData() {
  try {
    loading.value = true;

    // Fetch allowed domains
    const response = await embedService.listDomains(properties.formId);
    domains.value = response.data;
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formEmbed.listDomainsErr'),
      consoleError: t('trans.formEmbed.listDomainsConsErr', {
        error: error,
      }),
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
      text: t('trans.formEmbed.requestDomainSuccess'),
      ...NotificationTypes.SUCCESS,
    });

    newDomain.value = '';
    newDomainForm.value.resetValidation();
    await fetchData();
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formEmbed.requestDomainErr'),
      consoleError: t('trans.formEmbed.requestDomainConsErr', {
        error: error,
      }),
    });
  } finally {
    submitting.value = false;
  }
}

async function removeDomain(domain) {
  try {
    await embedService.removeDomain(properties.formId, domain.id);

    notificationStore.addNotification({
      text: t('trans.formEmbed.removeDomainSuccess'),
      ...NotificationTypes.SUCCESS,
    });

    await fetchData();
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formEmbed.removeDomainErr'),
      consoleError: t('trans.formEmbed.removeDomainConsErr', {
        error: error,
      }),
    });
  }
}

function getStatusColour(status) {
  // Define a default mapping that can be used before the API data is loaded
  const defaultMapping = {
    APPROVED: 'success',
    DENIED: 'error',
    PENDING: 'warning',
    SUBMITTED: 'info',
  };

  // If we have statuses from the API, find the matching status
  if (Array.isArray(domainStatuses.value) && domainStatuses.value.length > 0) {
    // Find the status in the array
    const statusObj = domainStatuses.value.find((s) => s.code === status);

    // If found, map it to a color based on the code
    if (statusObj) {
      return defaultMapping[statusObj.code] || 'grey';
    }
  }

  // Fall back to the default mapping if API data isn't available yet
  return defaultMapping[status] || 'grey';
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
        text: t('trans.formEmbed.getDomainHistoryErr'),
        consoleError: t('trans.formEmbed.getDomainHistoryConsErr', {
          error: error,
        }),
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
      <li :lang="locale">{{ $t('trans.formEmbed.disclaimer') }}</li>
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
                  :title="$t('trans.formEmbed.delete')"
                  :disabled="!canUpdate"
                  @click="removeDomain(item)"
                >
                  <v-icon icon="mdi:mdi-delete" />
                </v-btn>
              </template>
              <span :lang="locale">{{ $t('trans.formEmbed.delete') }}</span>
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
                : $t('trans.formEmbed.viewHistory')
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
                      <td>{{ $t('trans.formEmbed.previousStatus') }}</td>
                      <td>{{ $t('trans.formEmbed.newStatus') }}</td>
                      <td>{{ $t('trans.formEmbed.reason') }}</td>
                      <td>{{ $t('trans.formEmbed.createdBy') }}</td>
                      <td>{{ $t('trans.formEmbed.createdAt') }}</td>
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
          :label="$t('trans.formEmbed.domain')"
          placeholder="example.com"
          :rules="[
            (v) => !!v || $t('trans.formEmbed.emptyFieldRules'),
            domainRules,
          ]"
          :hint="$t('trans.formEmbed.newDomainHint')"
          persistent-hint
          required
        />
        <v-btn
          :disabled="!valid"
          :loading="submitting"
          class="mt-4"
          @click="requestDomain"
        >
          {{ $t('trans.formEmbed.requestDomain') }}
        </v-btn>
      </v-form>
    </v-skeleton-loader>
  </div>
</template>
/* c8 ignore end */
