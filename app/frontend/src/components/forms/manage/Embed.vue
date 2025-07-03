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
const loadingRequests = ref(false);
const submitting = ref(false);
const valid = ref(false);
const newDomain = ref('');
const allowedDomains = ref([]);
const requestedDomains = ref([]);

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
    title: 'Created At',
    key: 'createdAt',
  },
  {
    title: 'Actions',
    value: 'actions',
    sortable: false,
  },
]);

const requestHeaders = ref([
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
    title: 'Reason',
    key: 'reason',
  },
]);

const canUpdate = computed(() => {
  return permissions.value.includes(FormPermissions.FORM_UPDATE);
});

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
    loadingRequests.value = true;

    // Fetch allowed domains
    const allowedResponse = await embedService.listAllowedDomains(
      properties.formId
    );
    allowedDomains.value = allowedResponse.data;

    // Fetch requested domains
    const requestedResponse = await embedService.listRequestedDomains(
      properties.formId
    );
    requestedDomains.value = requestedResponse.data;
  } catch (error) {
    notificationStore.addNotification({
      text: 'An error occurred while fetching embed settings.',
      consoleError: error,
    });
  } finally {
    loading.value = false;
    loadingRequests.value = false;
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
      consoleError: error,
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
    case 'approved':
      return 'success';
    case 'denied':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'grey';
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
        :items="allowedDomains"
        :loading="loading"
        disable-sort
      >
        <template #item.actions="{ item }">
          <v-btn
            size="small"
            color="error"
            :disabled="!canUpdate"
            @click="removeDomain(item)"
          />
        </template>
      </v-data-table>
      <v-data-table
        :headers="requestHeaders"
        :items="requestedDomains"
        :loading="loadingRequests"
        disable-sort
      >
        <template #item.status="{ item }">
          <v-chip :color="getStatusColour(item.status)">
            {{ item.status }}
          </v-chip>
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
