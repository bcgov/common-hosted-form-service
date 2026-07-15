<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import rbacService from '~/services/rbacService';
import { useTenantStore } from '~/store/tenant';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();
const tenantStore = useTenantStore();

const props = defineProps({
  f: {
    type: String,
    required: true,
  },
});

const EMPTY_IMPACT = {
  team: [],
  submissions: { total: 0, drafts: 0, withShareUsers: 0 },
};

const ROLE_ORDER = [
  'owner',
  'team_manager',
  'form_designer',
  'submission_reviewer',
  'submission_approver',
  'form_submitter',
];

const loading = ref(true);
const submitting = ref(false);
const showConfirmDialog = ref(false);
const error = ref(null);

const eligibleTenants = ref([]);
const impact = ref({ ...EMPTY_IMPACT });
const selectedTenantId = ref(null);

const selectedTenant = computed(
  () =>
    eligibleTenants.value.find((t) => t.id === selectedTenantId.value) || null
);

const canSubmit = computed(() => !!selectedTenantId.value);

// Sorted unique team members
const teamRows = computed(() =>
  [...impact.value.team].sort((a, b) => {
    const ai = Math.min(
      ...a.roles.map((r) => ROLE_ORDER.indexOf(r)).filter((i) => i !== -1),
      99
    );
    const bi = Math.min(
      ...b.roles.map((r) => ROLE_ORDER.indexOf(r)).filter((i) => i !== -1),
      99
    );
    return ai - bi || (a.fullName || '').localeCompare(b.fullName || '');
  })
);

const hasBceidUsers = computed(() => impact.value.team.some((u) => u.isBceid));

const bceidCount = computed(
  () => impact.value.team.filter((u) => u.isBceid).length
);

function roleLabel(role) {
  const map = {
    owner: t('trans.formMigration.roleOwner'),
    team_manager: t('trans.formMigration.roleTeamManager'),
    form_designer: t('trans.formMigration.roleFormDesigner'),
    submission_reviewer: t('trans.formMigration.roleSubmissionReviewer'),
    submission_approver: t('trans.formMigration.roleSubmissionApprover'),
    form_submitter: t('trans.formMigration.roleFormSubmitter'),
  };
  return map[role] || role;
}

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
    impact.value = res.data.impact || { ...EMPTY_IMPACT };
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
  hasBceidUsers,
  bceidCount,
  teamRows,
  confirmMigration,
});
</script>

<template>
  <BaseSecure v-if="tenantStore.isTenantFeatureEnabled">
    <v-container>
      <h1 class="text-h5 mb-1" :lang="locale">
        {{ $t('trans.formMigration.pageTitle') }}
      </h1>
      <p class="text-body-2 text-medium-emphasis mb-4" :lang="locale">
        {{ $t('trans.formMigration.description') }}
      </p>

      <v-alert v-if="error" type="error" class="mb-4" closable>
        {{ error }}
      </v-alert>

      <div v-if="loading" class="d-flex justify-center ma-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <template v-else>
        <!-- No eligible tenants -->
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
          <!-- Tenant selector -->
          <v-select
            v-model="selectedTenantId"
            :items="eligibleTenants"
            item-title="name"
            item-value="id"
            :label="$t('trans.formMigration.selectTenant')"
            :placeholder="$t('trans.formMigration.tenantPlaceholder')"
            class="mb-5"
            variant="outlined"
            density="comfortable"
          />

          <!-- ── Impact panels ── -->
          <div class="text-subtitle-2 font-weight-bold mb-2" :lang="locale">
            {{ $t('trans.formMigration.impactTitle') }}
          </div>

          <!-- Team Members -->
          <v-card class="mb-3" variant="outlined">
            <v-card-title
              class="text-body-1 font-weight-bold pb-0 pt-3 px-4"
              :lang="locale"
            >
              {{ $t('trans.formMigration.teamImpactTitle') }}
              <v-chip
                size="x-small"
                class="ml-2"
                color="primary"
                variant="tonal"
              >
                {{ impact.team.length }}
              </v-chip>
              <v-chip
                v-if="hasBceidUsers"
                size="x-small"
                class="ml-1"
                color="warning"
                variant="tonal"
              >
                {{ bceidCount }} BCeID
              </v-chip>
            </v-card-title>
            <v-card-subtitle class="px-4 pt-1 pb-2 text-caption" :lang="locale">
              {{ $t('trans.formMigration.teamImpactSubtitle') }}
            </v-card-subtitle>

            <v-divider />

            <div
              v-if="teamRows.length === 0"
              class="px-4 py-3 text-body-2 text-medium-emphasis"
            >
              {{ $t('trans.formMigration.noTeamMembers') }}
            </div>

            <v-table v-else density="compact">
              <thead>
                <tr>
                  <th :lang="locale">
                    {{ $t('trans.formMigration.colName') }}
                  </th>
                  <th :lang="locale">
                    {{ $t('trans.formMigration.colEmail') }}
                  </th>
                  <th :lang="locale">
                    {{ $t('trans.formMigration.colRoles') }}
                  </th>
                  <th :lang="locale">{{ $t('trans.formMigration.colIdp') }}</th>
                  <th :lang="locale">
                    {{ $t('trans.formMigration.colStatus') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="member in teamRows" :key="member.email">
                  <td>{{ member.fullName || '—' }}</td>
                  <td class="text-caption">{{ member.email }}</td>
                  <td>
                    <div class="d-flex flex-wrap gap-1 py-1">
                      <v-chip
                        v-for="role in member.roles"
                        :key="role"
                        size="x-small"
                        variant="tonal"
                        color="primary"
                      >
                        {{ roleLabel(role) }}
                      </v-chip>
                    </div>
                  </td>
                  <td>
                    <v-chip
                      size="x-small"
                      :color="member.isBceid ? 'warning' : 'info'"
                      variant="tonal"
                    >
                      {{ member.isBceid ? 'BCeID' : 'IDIR' }}
                    </v-chip>
                  </td>
                  <td>
                    <v-chip
                      v-if="member.isBceid"
                      size="x-small"
                      color="error"
                      variant="tonal"
                      prepend-icon="mdi:mdi-alert-circle-outline"
                    >
                      <span :lang="locale">{{
                        $t('trans.formMigration.statusLosesAccess')
                      }}</span>
                    </v-chip>
                    <v-chip
                      v-else
                      size="x-small"
                      color="warning"
                      variant="tonal"
                      prepend-icon="mdi:mdi-account-group-outline"
                    >
                      <span :lang="locale">{{
                        $t('trans.formMigration.statusNeedsGroup')
                      }}</span>
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>

          <!-- Submissions Stats -->
          <v-card class="mb-3" variant="outlined">
            <v-card-title
              class="text-body-1 font-weight-bold pb-0 pt-3 px-4"
              :lang="locale"
            >
              {{ $t('trans.formMigration.submissionsImpactTitle') }}
            </v-card-title>
            <v-card-subtitle class="px-4 pt-1 pb-2 text-caption" :lang="locale">
              {{ $t('trans.formMigration.submissionsImpactSubtitle') }}
            </v-card-subtitle>
            <v-divider />
            <v-card-text class="pt-3">
              <v-row dense>
                <v-col cols="12" sm="4">
                  <div
                    class="text-center pa-3 rounded"
                    style="background: rgb(var(--v-theme-surface-variant), 0.3)"
                  >
                    <div class="text-h5 font-weight-bold text-primary">
                      {{ impact.submissions.total }}
                    </div>
                    <div
                      class="text-caption font-weight-medium mt-1"
                      :lang="locale"
                    >
                      {{ $t('trans.formMigration.totalSubmissionsLabel') }}
                    </div>
                    <div
                      class="text-caption text-medium-emphasis mt-1"
                      :lang="locale"
                    >
                      {{ $t('trans.formMigration.totalSubmissionsHint') }}
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div
                    class="text-center pa-3 rounded"
                    style="background: rgb(var(--v-theme-surface-variant), 0.3)"
                  >
                    <div class="text-h5 font-weight-bold text-warning">
                      {{ impact.submissions.drafts }}
                    </div>
                    <div
                      class="text-caption font-weight-medium mt-1"
                      :lang="locale"
                    >
                      {{ $t('trans.formMigration.draftsLabel') }}
                    </div>
                    <div
                      class="text-caption text-medium-emphasis mt-1"
                      :lang="locale"
                    >
                      {{ $t('trans.formMigration.draftsHint') }}
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div
                    class="text-center pa-3 rounded"
                    style="background: rgb(var(--v-theme-surface-variant), 0.3)"
                  >
                    <div class="text-h5 font-weight-bold text-info">
                      {{ impact.submissions.withShareUsers }}
                    </div>
                    <div
                      class="text-caption font-weight-medium mt-1"
                      :lang="locale"
                    >
                      {{ $t('trans.formMigration.sharedSubmissionsLabel') }}
                    </div>
                    <div
                      class="text-caption text-medium-emphasis mt-1"
                      :lang="locale"
                    >
                      {{ $t('trans.formMigration.sharedSubmissionsHint') }}
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- What changes after migration -->
          <v-card class="mb-5" variant="outlined">
            <v-card-title
              class="text-body-1 font-weight-bold pb-0 pt-3 px-4"
              :lang="locale"
            >
              {{ $t('trans.formMigration.afterMigrationTitle') }}
            </v-card-title>
            <v-divider class="mt-2" />
            <v-list density="compact" class="py-2">
              <v-list-item
                prepend-icon="mdi:mdi-check-circle-outline"
                color="success"
              >
                <v-list-item-title class="text-body-2" :lang="locale">
                  {{ $t('trans.formMigration.afterSubmissionsKept') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                prepend-icon="mdi:mdi-check-circle-outline"
                color="success"
              >
                <v-list-item-title class="text-body-2" :lang="locale">
                  {{ $t('trans.formMigration.afterExistingSharesKept') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi:mdi-alert-outline" color="warning">
                <v-list-item-title class="text-body-2" :lang="locale">
                  {{ $t('trans.formMigration.afterDraftShareGated') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi:mdi-alert-outline" color="warning">
                <v-list-item-title class="text-body-2" :lang="locale">
                  {{ $t('trans.formMigration.afterTeamRolesStay') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                v-if="hasBceidUsers"
                prepend-icon="mdi:mdi-close-circle-outline"
                color="error"
              >
                <v-list-item-title class="text-body-2" :lang="locale">
                  {{ $t('trans.formMigration.afterBceidLosesAccess') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                prepend-icon="mdi:mdi-information-outline"
                color="info"
              >
                <v-list-item-title class="text-body-2" :lang="locale">
                  {{ $t('trans.formMigration.groupAccessInfo') }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>

          <!-- Actions -->
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

    <!-- Confirm dialog -->
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
