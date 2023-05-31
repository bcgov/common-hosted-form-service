<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import BaseCopyToClipboard from '~/components/base/BaseCopyToClipboard.vue';
import BaseDialog from '~/components/base/BaseDialog.vue';
import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';

const loading = ref(false);
const showConfirmationDialog = ref(false);
const showDeleteDialog = ref(false);
const showSecret = ref(false);

const formStore = useFormStore();

const { apiKey, form, permissions } = storeToRefs(formStore);

const canDeleteKey = computed(
  () =>
    permissions.value.includes(FormPermissions.FORM_API_DELETE) && apiKey.value
);
const canGenerateKey = computed(() =>
  permissions.value.includes(FormPermissions.FORM_API_CREATE)
);
const canReadSecret = computed(
  () =>
    permissions.value.includes(FormPermissions.FORM_API_READ) && apiKey.value
);
const secret = computed(() =>
  apiKey?.value?.secret ? apiKey.value.secret : undefined
);

async function createKey() {
  loading.value = true;
  await formStore.generateApiKey(form.value.id);
  showSecret.value = false;
  loading.value = false;
  showConfirmationDialog.value = false;
}

async function deleteKey() {
  loading.value = true;
  await formStore.deleteApiKey(form.value.id);
  loading.value = false;
  showDeleteDialog.value = false;
}

async function readKey() {
  loading.value = true;
  await formStore.readApiKey(form.value.id);
  loading.value = false;
}

function showHideKey() {
  showSecret.value = !showSecret.value;
}

if (canGenerateKey.value) {
  readKey();
}
</script>

<template>
  <div>
    <div v-if="!canGenerateKey" class="mt-3 mb-6">
      <v-icon class="mr-1" color="primary" icon="mdi:mdi-information"></v-icon>
      You must be the <strong>Form Owner</strong> to manage API Keys.
    </div>
    <h3 class="mt-3">Disclaimer</h3>
    <ul>
      <li>
        Ensure that your API key secret is stored in a secure location (i.e. key
        vault).
      </li>
      <li>
        Your API key grants unrestricted access to your form. Do not give out
        your API key to anyone.
      </li>
      <li>
        The API key should ONLY be used for automated system interactions. Do
        not use your API key for user based access.
      </li>
    </ul>

    <v-skeleton-loader :loading="loading" type="button">
      <v-row class="mt-5">
        <v-col cols="12" sm="4" lg="3" xl="2">
          <v-btn
            block
            color="primary"
            :disabled="!canGenerateKey"
            @click="showConfirmationDialog = true"
          >
            <span>{{ apiKey ? 'Regenerate' : 'Generate' }} api key</span>
          </v-btn>
        </v-col>
        <v-col cols="12" sm="5" xl="3">
          <v-text-field
            density="compact"
            hide-details
            label="Secret"
            variant="outlined"
            solid
            readonly
            :type="showSecret ? 'text' : 'password'"
            :model-value="secret"
          />
        </v-col>
        <v-col cols="12" sm="3">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                :disabled="!canReadSecret"
                icon
                size="small"
                v-bind="props"
                @click="showHideKey"
              >
                <v-icon v-if="showSecret" icon="mdi:mdi-eye-off"></v-icon>
                <v-icon v-else icon="mdi:mdi-eye"></v-icon>
              </v-btn>
            </template>
            <span v-if="showSecret">Hide Secret</span>
            <span v-else>Show Secret</span>
          </v-tooltip>

          <BaseCopyToClipboard
            :disabled="!canReadSecret || !showSecret"
            class="ml-2"
            :copy-text="secret"
            snack-bar-text="Secret copied to clipboard"
            tooltip-text="Copy secret to clipboard"
          />

          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="red"
                :disabled="!canDeleteKey"
                icon
                size="small"
                v-bind="props"
                @click="showDeleteDialog = true"
              >
                <v-icon icon="mdi:mdi-delete"></v-icon>
              </v-btn>
            </template>
            <span>Delete Key</span>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-skeleton-loader>

    <!-- Generate/regen confirmation -->
    <BaseDialog
      v-model="showConfirmationDialog"
      type="CONTINUE"
      @close-dialog="showConfirmationDialog = false"
      @continue-dialog="createKey"
    >
      <template #title>Confirm Key Generation</template>
      <template #text>
        <span v-if="!apiKey">
          Create an API Key for this form?<br />
          Ensure you follow the Disclaimer on this page.
        </span>
        <span v-else>
          Regenerate the API Key? <br />
          <strong>Continuing will delete your current API Key access</strong>.
        </span>
      </template>
      <template #button-text-continue>
        <span>{{ apiKey ? 'Regenerate' : 'Generate' }} Key</span>
      </template>
    </BaseDialog>

    <!-- Delete confirmation -->
    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="deleteKey"
    >
      <template #title>Confirm Deletion</template>
      <template #text>Are you sure you wish to delete your API Key?</template>
      <template #button-text-continue>
        <span>Delete</span>
      </template>
    </BaseDialog>
  </div>
</template>
