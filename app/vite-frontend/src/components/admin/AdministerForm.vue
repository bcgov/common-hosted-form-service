<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import VueJsonPretty from 'vue-json-pretty';

import AddOwner from '~/components/admin/AddOwner.vue';
import AdminVersions from '~/components/admin/AdminVersions.vue';
import BaseDialog from '~/components/base/BaseDialog.vue';
import { useAdminStore } from '~/store/admin';

const adminStore = useAdminStore();

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

const formDetails = ref({});
const loading = ref(true);
const restoreInProgress = ref(false);
const showDeleteDialog = ref(false);
const showRestoreDialog = ref(false);

const { form, roles, apiKey } = storeToRefs(adminStore);

async function deleteKey() {
  await adminStore.deleteApiKey(form.value.id);
  showDeleteDialog.value = false;
}

async function restore() {
  restoreInProgress.value = true;
  await adminStore.restoreForm(form.value.id);
  restoreInProgress.value = false;
  showRestoreDialog.value = false;
}

onMounted(async () => {
  await Promise.all([
    await adminStore.readForm(properties.formId),
    await adminStore.readApiDetails(properties.formId),
    await adminStore.readRoles(properties.formId),
  ]);

  formDetails.value = { ...form.value };
  delete formDetails.value.versions;

  loading.value = false;
});
</script>

<template>
  <v-skeleton-loader :loading="loading" type="article">
    <h3>{{ form.name }}</h3>
    <p>{{ form.description }}</p>

    <div v-if="form.active === false" class="text-red mb-6">
      ({{ $t('trans.administerForm.deleted') }})
      <v-btn
        color="primary"
        class="mt-0"
        variant="text"
        size="small"
        @click="showRestoreDialog = true"
      >
        <v-icon class="mr-1" icon="mdi:mdi-wrench"></v-icon>
        <span class="d-none d-sm-flex">{{
          $t('trans.administerForm.restoreForm')
        }}</span>
      </v-btn>
    </div>

    <v-container>
      <v-row no-gutters>
        <v-col md="6">
          <h4>{{ $t('trans.administerForm.formDetails') }}</h4>
          <vue-json-pretty :data="formDetails" />

          <div v-if="apiKey" class="mt-6">
            <h4>{{ $t('trans.administerForm.apiKeyDetails') }}</h4>
            <vue-json-pretty :data="apiKey" />
            <v-btn
              class="mt-6 mb-6"
              color="primary"
              :disabled="!apiKey"
              @click="showDeleteDialog = true"
            >
              <span>{{ $t('trans.administerForm.deleteApiKey') }}</span>
            </v-btn>
          </div>
        </v-col>
        <v-col md="6">
          <h4>{{ $t('trans.administerForm.formUsers') }}</h4>
          <vue-json-pretty :data="roles" />
        </v-col>
      </v-row>
    </v-container>

    <div v-if="form.active" class="mt-12">
      <h4>{{ $t('trans.administerForm.formVersions') }}</h4>
      <AdminVersions />
    </div>

    <div v-if="form.active" class="mt-12">
      <h4>{{ $t('trans.administerForm.assignANewOwner') }}</h4>
      <AddOwner :form-id="form.id" />
    </div>

    <BaseDialog
      v-model="showRestoreDialog"
      type="CONTINUE"
      @close-dialog="showRestoreDialog = false"
      @continue-dialog="restore"
    >
      <template #title>{{
        $t('trans.administerForm.confirmRestore')
      }}</template>
      <template #text>
        <div v-if="restoreInProgress" class="text-center">
          <v-progress-circular indeterminate color="primary" :size="100">
            {{ $t('trans.administerForm.restoring') }}
          </v-progress-circular>
        </div>
        <div v-else>
          {{ $t('trans.administerForm.restore') }}
          <strong>{{ form.name }}</strong>
          {{ $t('trans.administerForm.toActiveState') }}?
        </div>
      </template>
      <template #button-text-continue>
        <span>{{ $t('trans.administerForm.restore') }}</span>
      </template>
    </BaseDialog>

    <!-- Delete confirmation -->
    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="deleteKey"
    >
      <template #title>{{
        $t('trans.administerForm.confirmDeletion')
      }}</template>
      <template #text>{{
        $t('trans.administerForm.confirmDeletionMsg')
      }}</template>
      <template #button-text-continue>
        <span>{{ $t('trans.administerForm.delete') }}</span>
      </template>
    </BaseDialog>
  </v-skeleton-loader>
</template>
