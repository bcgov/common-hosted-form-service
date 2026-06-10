<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import rbacService from '~/services/rbacService';
import { useTenantStore } from '~/store/tenant';

const { locale } = useI18n({ useScope: 'global' });
const router = useRouter();
const tenantStore = useTenantStore();

const props = defineProps({
  f: {
    type: String,
    required: true,
  },
});

const loading = ref(true);
const submitting = ref(false);
const showConfirmDialog = ref(false);
const error = ref(null);

const eligibleTenants = ref([]);
const impact = ref({ teamMembers: [], draftShareAffectedCount: 0 });

const selectedTenantId = ref(null);

const selectedTenant = computed(
  () =>
    eligibleTenants.value.find((t) => t.id === selectedTenantId.value) || null
);

const canSubmit = computed(() => !!selectedTenantId.value);

onMounted(async () => {
  if (!tenantStore.isTenantFeatureEnabled) {
    router.replace({ name: 'UserForms' });
    return;
  }
  await loadPrepareData();
});

async function loadPrepareData() {
  loading.value = true;
  error.value = null;
  try {
    const res = await rbacService.getMigrationPreview(props.f);
    eligibleTenants.value = res.data.eligibleTenants || [];
    impact.value = res.data.impact || {
      teamMembers: [],
      draftShareAffectedCount: 0,
    };
  } catch (err) {
    error.value = err.response?.data?.detail || err.message;
  } finally {
    loading.value = false;
  }
}

async function confirmMigration() {
  submitting.value = true;
  error.value = null;
  try {
    await rbacService.executeMigration(props.f, {
      tenantId: selectedTenantId.value,
    });
    showConfirmDialog.value = false;
    tenantStore.selectTenant(selectedTenant.value);
    router.push({ name: 'FormGroups', query: { f: props.f } });
  } catch (err) {
    error.value = err.response?.data?.detail || err.message;
    showConfirmDialog.value = false;
  } finally {
    submitting.value = false;
  }
}

defineExpose({
  loading,
  submitting,
  eligibleTenants,
  impact,
  selectedTenantId,
  selectedTenant,
  canSubmit,
  confirmMigration,
});
</script>

<template>
  <BaseSecure v-if="tenantStore.isTenantFeatureEnabled">
    <v-container>
      <h1 class="text-h5 mb-4" :lang="locale">
        {{ $t('trans.formMigration.pageTitle') }}
      </h1>

      <v-alert v-if="error" type="error" class="mb-4" closable>
        {{ error }}
      </v-alert>

      <div v-if="loading" class="d-flex justify-center ma-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <template v-else>
        <p class="mb-4" :lang="locale">
          {{ $t('trans.formMigration.description') }}
        </p>

        <v-alert type="info" variant="tonal" class="mb-3" :lang="locale">
          {{ $t('trans.formMigration.groupAccessInfo') }}
        </v-alert>

        <v-alert type="warning" variant="tonal" class="mb-6" :lang="locale">
          {{ $t('trans.formMigration.bceidNotSupported') }}
        </v-alert>

        <v-alert
          v-if="eligibleTenants.length === 0"
          type="warning"
          class="mb-4"
        >
          <span :lang="locale">{{
            $t('trans.formMigration.noEligibleTenants')
          }}</span>
        </v-alert>

        <template v-else>
          <v-select
            v-model="selectedTenantId"
            :items="eligibleTenants"
            item-title="name"
            item-value="id"
            :label="$t('trans.formMigration.selectTenant')"
            :placeholder="$t('trans.formMigration.tenantPlaceholder')"
            class="mb-4"
          />

          <v-card class="mb-6" variant="outlined">
            <v-card-title :lang="locale">
              {{ $t('trans.formMigration.impactTitle') }}
            </v-card-title>
            <v-card-text>
              <div class="mb-4">
                <strong :lang="locale"
                  >{{ $t('trans.formMigration.draftSharesLabel') }}:</strong
                >
                {{ impact.draftShareAffectedCount }}
                <div class="text-caption text-medium-emphasis" :lang="locale">
                  {{ $t('trans.formMigration.draftSharesHint') }}
                </div>
              </div>
              <div>
                <strong :lang="locale"
                  >{{ $t('trans.formMigration.teamMembersLabel') }}:</strong
                >
                {{ impact.teamMembers.length }}
                <div class="text-caption text-medium-emphasis" :lang="locale">
                  {{ $t('trans.formMigration.teamMembersHint') }}
                </div>
                <v-list
                  v-if="impact.teamMembers.length"
                  density="compact"
                  class="mt-2"
                >
                  <v-list-item
                    v-for="member in impact.teamMembers"
                    :key="member.email"
                    :title="member.fullName"
                    :subtitle="member.email"
                  />
                </v-list>
              </div>
            </v-card-text>
          </v-card>

          <div class="d-flex gap-3">
            <v-btn
              color="primary"
              :disabled="!canSubmit"
              :lang="locale"
              @click="showConfirmDialog = true"
            >
              {{ $t('trans.formMigration.transferButton') }}
            </v-btn>
            <v-btn
              variant="outlined"
              :lang="locale"
              :to="{ name: 'FormManage', query: { f } }"
            >
              {{ $t('trans.formMigration.cancelButton') }}
            </v-btn>
          </div>
        </template>
      </template>
    </v-container>

    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card>
        <v-card-title :lang="locale">
          {{ $t('trans.formMigration.confirmTitle') }}
        </v-card-title>
        <v-card-text :lang="locale">
          {{ $t('trans.formMigration.confirmMessage') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            :lang="locale"
            @click="showConfirmDialog = false"
          >
            {{ $t('trans.formMigration.cancelButton') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="submitting"
            :lang="locale"
            @click="confirmMigration"
          >
            {{ $t('trans.formMigration.confirmButton') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </BaseSecure>
</template>
