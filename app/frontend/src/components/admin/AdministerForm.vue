<script setup>
import { storeToRefs } from 'pinia';
import VueJsonPretty from 'vue-json-pretty';
import { useI18n } from 'vue-i18n';

import AddOwner from '~/components/admin/AddOwner.vue';
import AdminVersions from '~/components/admin/AdminVersions.vue';
import BaseDialog from '~/components/base/BaseDialog.vue';
import { useAdminStore } from '~/store/admin';
import { onMounted, ref } from 'vue';

const { locale } = useI18n({ useScope: 'global' });

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

const adminStore = useAdminStore();

const { form, roles, apiKey } = storeToRefs(adminStore);

onMounted(async () => {
  await Promise.all([
    adminStore.readForm(properties.formId),
    adminStore.readApiDetails(properties.formId),
    adminStore.readRoles(properties.formId),
  ]);

  formDetails.value = { ...form.value };
  delete formDetails.value.versions;

  loading.value = false;
});

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
</script>

<template>
  <v-skeleton-loader :loading="loading" type="article" class="bgtrans">
    <h3>{{ form.name }}</h3>
    <p>{{ form.description }}</p>

    <div v-if="form.active === false" class="text-red mb-6" :lang="locale">
      ({{ $t('trans.administerForm.deleted') }})
      <v-btn
        color="primary"
        class="mt-0"
        variant="text"
        size="small"
        :title="$t('trans.administerForm.restoreForm')"
        @click="showRestoreDialog = true"
      >
        <v-icon class="mr-1" icon="mdi:mdi-wrench"></v-icon>
        <span class="d-none d-sm-flex" :lang="locale">{{
          $t('trans.administerForm.restoreForm')
        }}</span>
      </v-btn>
    </div>

    <v-container>
      <v-row no-gutters>
        <v-col md="6">
          <h4 :lang="locale">
            {{ $t('trans.administerForm.formDetails') }}
          </h4>
          <vue-json-pretty :data="formDetails" />

          <div v-if="apiKey" class="mt-6">
            <h4 :lang="locale">
              {{ $t('trans.administerForm.apiKeyDetails') }}
            </h4>
            <vue-json-pretty :data="apiKey" />
            <v-btn
              class="mt-6 mb-6"
              color="primary"
              :disabled="!apiKey"
              :title="$t('trans.administerForm.deleteApiKey')"
              @click="showDeleteDialog = true"
            >
              <span :lang="locale">{{
                $t('trans.administerForm.deleteApiKey')
              }}</span>
            </v-btn>
          </div>
        </v-col>
        <v-col md="6">
          <h4 :lang="locale">
            {{ $t('trans.administerForm.formUsers') }}
          </h4>
          <vue-json-pretty :data="roles" />
        </v-col>
      </v-row>
    </v-container>

    <div v-if="form.active" class="mt-12">
      <h4 :lang="locale">
        {{ $t('trans.administerForm.formVersions') }}
      </h4>
      <AdminVersions />
    </div>

    <div v-if="form.active" class="mt-12">
      <h4 :lang="locale">{{ $t('trans.administerForm.assignANewOwner') }}</h4>
      <AddOwner :form-id="form.id" />
    </div>

    <BaseDialog
      v-model="showRestoreDialog"
      type="CONTINUE"
      @close-dialog="showRestoreDialog = false"
      @continue-dialog="restore"
    >
      <template #title
        ><span :lang="locale">{{
          $t('trans.administerForm.confirmRestore')
        }}</span></template
      >
      <template #text>
        <div v-if="restoreInProgress" class="text-center">
          <v-progress-circular
            indeterminate
            color="primary"
            :size="100"
            :lang="locale"
          >
            {{ $t('trans.administerForm.restoring') }}
          </v-progress-circular>
        </div>
        <div v-else :lang="locale">
          {{ $t('trans.administerForm.restore') }}
          <strong>{{ form.name }}</strong>
          {{ $t('trans.administerForm.toActiveState') }}?
        </div>
      </template>
      <template #button-text-continue>
        <span :lang="locale">{{ $t('trans.administerForm.restore') }}</span>
      </template>
    </BaseDialog>

    <!-- Delete confirmation -->
    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="deleteKey"
    >
      <template #title
        ><span :lang="locale">{{
          $t('trans.administerForm.confirmDeletion')
        }}</span></template
      >
      <template #text
        ><span :lang="locale">{{
          $t('trans.administerForm.confirmDeletionMsg')
        }}</span>
      </template>
      <template #button-text-continue
        ><span :lang="locale">{{ $t('trans.administerForm.delete') }}</span>
      </template>
    </BaseDialog>
  </v-skeleton-loader>
</template>
