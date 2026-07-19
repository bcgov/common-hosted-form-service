<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import GroupPicker from '~/components/forms/migrate/GroupPicker.vue';
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
const error = ref(null);
const showRefreshButton = ref(false);

const eligibleTenants = ref([]);
const impact = ref({ ...EMPTY_IMPACT });
const selectedTenantId = ref(null);

const loadingGroups = ref(false);
const allTenantGroups = ref([]);
const assignedGroups = ref([]);
const teamMemberGroups = ref([]);

const confirmed = ref(false);

const selectedTenant = computed(
  () =>
    eligibleTenants.value.find((t) => t.id === selectedTenantId.value) || null
);

const availableGroups = computed(() => {
  const assignedIds = new Set(assignedGroups.value.map((g) => g.id));
  return allTenantGroups.value.filter((g) => !assignedIds.has(g.id));
});

const canSubmit = computed(() => !!selectedTenantId.value && confirmed.value);

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

const teamMemberGroupMap = computed(() => {
  const map = new Map();
  for (const m of teamMemberGroups.value) map.set(m.email, m.groupIds);
  return map;
});

const teamRowsWithStatus = computed(() => {
  const assignedIds = new Set(assignedGroups.value.map((g) => g.id));
  const groupNameMap = new Map(
    allTenantGroups.value.map((g) => [g.id, g.name])
  );
  const tenantLoaded = teamMemberGroups.value.length > 0;

  return teamRows.value.map((member) => {
    if (member.isBceid) {
      return { ...member, transferStatus: 'loses_access', memberGroups: [] };
    }
    if (!tenantLoaded) {
      return { ...member, transferStatus: 'needs_group', memberGroups: [] };
    }
    const memberGroupIds = teamMemberGroupMap.value.get(member.email) || [];
    const memberGroups = memberGroupIds.map((id) => ({
      id,
      name: groupNameMap.get(id) || id,
      isAssigned: assignedIds.has(id),
    }));
    if (memberGroupIds.length === 0) {
      return { ...member, transferStatus: 'no_membership', memberGroups: [] };
    }
    const retained = memberGroupIds.some((id) => assignedIds.has(id));
    return {
      ...member,
      transferStatus: retained ? 'retained' : 'needs_assignment',
      memberGroups,
    };
  });
});

// Count members losing access — used for the BCeID warning chip
const atRiskCount = computed(
  () =>
    teamRowsWithStatus.value.filter(
      (m) =>
        m.transferStatus === 'loses_access' ||
        m.transferStatus === 'needs_assignment' ||
        m.transferStatus === 'no_membership'
    ).length
);

function rowStatusClass(status) {
  if (status === 'retained') return 'row-retained';
  if (status === 'loses_access') return 'row-error';
  if (status === 'needs_assignment' || status === 'no_membership')
    return 'row-warning';
  return '';
}

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
  await loadPreviewData();
});

async function loadPreviewData() {
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

watch(selectedTenantId, async (tenantId) => {
  allTenantGroups.value = [];
  assignedGroups.value = [];
  teamMemberGroups.value = [];
  confirmed.value = false;
  if (!tenantId) return;
  await loadTenantGroups(tenantId);
});

async function loadTenantGroups(tenantId) {
  loadingGroups.value = true;
  try {
    const res = await rbacService.getMigrationTenantGroups(props.f, tenantId);
    allTenantGroups.value = res.data.groups || [];
    teamMemberGroups.value = res.data.teamMemberGroups || [];
    const preSelectedIds = new Set(res.data.preSelectedGroupIds || []);
    assignedGroups.value = allTenantGroups.value.filter((g) =>
      preSelectedIds.has(g.id)
    );
  } catch (err) {
    error.value = err.response?.data?.detail || err.message;
  } finally {
    loadingGroups.value = false;
  }
}

async function submitMigration() {
  submitting.value = true;
  error.value = null;
  showRefreshButton.value = false;
  try {
    const groupIds =
      assignedGroups.value.length > 0
        ? assignedGroups.value.map((g) => g.id)
        : undefined;
    await rbacService.executeMigration(props.f, {
      tenantId: selectedTenantId.value,
      ...(groupIds ? { groupIds } : {}),
    });
    tenantStore.selectTenant(selectedTenant.value);
    router.push({ name: 'UserForms' });
  } catch (err) {
    const code = err.response?.data?.code;
    if (code === 'SESSION_EXPIRED') {
      error.value = t('trans.formMigration.sessionExpired');
      showRefreshButton.value = true;
    } else {
      error.value = err.response?.data?.detail || err.message;
    }
  } finally {
    submitting.value = false;
  }
}

defineExpose({
  loading,
  submitting,
  confirmed,
  eligibleTenants,
  impact,
  selectedTenantId,
  selectedTenant,
  canSubmit,
  hasBceidUsers,
  bceidCount,
  teamRows,
  teamRowsWithStatus,
  submitMigration,
});
</script>

<template>
  <BaseSecure v-if="tenantStore.isTenantFeatureEnabled">
    <v-container>
      <!-- Page header -->
      <div class="d-flex align-start gap-3 mb-4">
        <v-icon
          size="36"
          color="primary"
          class="mt-1 flex-shrink-0"
          aria-hidden="true"
        >
          mdi:mdi-swap-horizontal-bold
        </v-icon>
        <div>
          <h1 class="text-h5 mb-1" :lang="locale">
            {{ $t('trans.formMigration.pageTitle') }}
          </h1>
          <p class="text-body-2 text-medium-emphasis mb-0" :lang="locale">
            {{ $t('trans.formMigration.description') }}
          </p>
        </div>
      </div>

      <!-- Permanent-action warning banner -->
      <v-alert
        type="error"
        variant="tonal"
        density="compact"
        class="mb-5"
        icon="mdi:mdi-alert-circle-outline"
        :lang="locale"
      >
        {{ $t('trans.formMigration.cannotBeUndoneWarning') }}
      </v-alert>

      <!-- API / session error -->
      <v-alert
        v-if="error"
        type="error"
        class="mb-4"
        closable
        @click:close="error = null"
      >
        {{ error }}
        <template v-if="showRefreshButton" #append>
          <v-btn
            size="small"
            variant="outlined"
            class="ml-2"
            :lang="locale"
            @click="$router.go(0)"
          >
            {{ $t('trans.formMigration.reloadPage') }}
          </v-btn>
        </template>
      </v-alert>

      <!-- Initial page load spinner -->
      <div v-if="loading" class="d-flex justify-center my-10">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <template v-else>
        <!-- No eligible tenants -->
        <v-alert
          v-if="eligibleTenants.length === 0"
          type="warning"
          class="mb-4"
          :lang="locale"
        >
          {{ $t('trans.formMigration.noEligibleTenants') }}
        </v-alert>

        <template v-else>
          <!-- ── STEP 1 — Select Tenant ───────────────────────────── -->
          <div class="step-section mb-5">
            <div class="d-flex align-center mb-3">
              <span class="step-badge mr-3">1</span>
              <span class="text-subtitle-1 font-weight-medium" :lang="locale">
                {{ $t('trans.formMigration.selectTenant') }}
              </span>
            </div>
            <v-select
              v-model="selectedTenantId"
              :items="eligibleTenants"
              item-title="name"
              item-value="id"
              :label="$t('trans.formMigration.selectTenant')"
              :placeholder="$t('trans.formMigration.tenantPlaceholder')"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </div>

          <!-- ── STEP 2 — Assign Groups ───────────────────────────── -->
          <v-expand-transition>
            <div v-if="selectedTenantId" class="step-section mb-5">
              <div class="d-flex align-center mb-1">
                <span class="step-badge mr-3">2</span>
                <span class="text-subtitle-1 font-weight-medium" :lang="locale">
                  {{ $t('trans.formMigration.assignGroupsTitle') }}
                </span>
                <v-chip
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  class="ml-2"
                >
                  {{ $t('trans.formMigration.optionalBadge') }}
                </v-chip>
                <v-progress-circular
                  v-if="loadingGroups"
                  indeterminate
                  color="primary"
                  size="18"
                  width="2"
                  class="ml-3"
                />
              </div>
              <p
                class="text-caption text-medium-emphasis mb-3 ml-10"
                :lang="locale"
              >
                {{ $t('trans.formMigration.assignGroupsSubtitle') }}
              </p>
              <GroupPicker
                :available="availableGroups"
                :assigned="assignedGroups"
                :loading="loadingGroups"
                @update:assigned="assignedGroups = $event"
              />
            </div>
          </v-expand-transition>

          <!-- ── STEP 3 — Review Impact ──────────────────────────── -->
          <div class="step-section mb-4">
            <div class="d-flex align-center mb-3">
              <span
                class="step-badge mr-3"
                :class="selectedTenantId ? '' : 'step-badge--inactive'"
              >
                3
              </span>
              <span class="text-subtitle-1 font-weight-medium" :lang="locale">
                {{ $t('trans.formMigration.impactTitle') }}
              </span>
              <v-chip
                v-if="hasBceidUsers"
                size="x-small"
                color="warning"
                variant="tonal"
                class="ml-2"
              >
                {{ bceidCount }} BCeID
              </v-chip>
              <v-chip
                v-if="atRiskCount > 0 && selectedTenantId"
                size="x-small"
                color="error"
                variant="tonal"
                class="ml-1"
              >
                {{ atRiskCount }}
                {{ $t('trans.formMigration.atRiskLabel') }}
              </v-chip>
            </div>

            <!-- Team Members table -->
            <v-card variant="outlined" class="mb-3">
              <v-card-title
                class="text-body-1 font-weight-medium pt-3 pb-0 px-4"
                :lang="locale"
              >
                {{ $t('trans.formMigration.teamImpactTitle') }}
                <v-chip
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  class="ml-2"
                >
                  {{ impact.team.length }}
                </v-chip>
              </v-card-title>
              <v-card-subtitle
                class="px-4 pt-1 pb-2 text-caption"
                :lang="locale"
              >
                {{ $t('trans.formMigration.teamImpactSubtitle') }}
              </v-card-subtitle>
              <v-divider />

              <div
                v-if="teamRows.length === 0"
                class="px-4 py-4 text-body-2 text-medium-emphasis text-center"
              >
                {{ $t('trans.formMigration.noTeamMembers') }}
              </div>

              <div v-else class="table-wrapper">
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th class="col-name" :lang="locale">
                        {{ $t('trans.formMigration.colName') }}
                      </th>
                      <th :lang="locale">
                        {{ $t('trans.formMigration.colRoles') }}
                      </th>
                      <th :lang="locale">
                        {{ $t('trans.formMigration.colIdp') }}
                      </th>
                      <th v-if="selectedTenantId" :lang="locale">
                        {{ $t('trans.formMigration.colTenantGroups') }}
                      </th>
                      <th :lang="locale">
                        {{ $t('trans.formMigration.colStatus') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="member in teamRowsWithStatus"
                      :key="member.email"
                      :class="rowStatusClass(member.transferStatus)"
                    >
                      <td class="col-name">
                        <div class="text-body-2 font-weight-medium">
                          {{ member.fullName || member.email }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ member.email }}
                        </div>
                      </td>
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
                      <!-- Tenant Groups — only after tenant selected -->
                      <td v-if="selectedTenantId">
                        <div
                          v-if="loadingGroups"
                          class="d-flex align-center py-1"
                        >
                          <v-progress-circular
                            indeterminate
                            size="14"
                            width="2"
                            color="primary"
                          />
                        </div>
                        <div
                          v-else-if="member.memberGroups.length === 0"
                          class="text-caption text-medium-emphasis py-1"
                        >
                          {{ $t('trans.formMigration.noTenantGroups') }}
                        </div>
                        <div v-else class="d-flex flex-wrap gap-1 py-1">
                          <v-chip
                            v-for="g in member.memberGroups"
                            :key="g.id"
                            size="x-small"
                            :color="g.isAssigned ? 'success' : 'default'"
                            :variant="g.isAssigned ? 'tonal' : 'outlined'"
                          >
                            {{ g.name }}
                          </v-chip>
                        </div>
                      </td>
                      <!-- Status -->
                      <td>
                        <v-chip
                          v-if="member.transferStatus === 'loses_access'"
                          size="x-small"
                          color="error"
                          variant="tonal"
                          prepend-icon="mdi:mdi-alert-circle-outline"
                        >
                          <span :lang="locale">
                            {{
                              $t('trans.formMigration.statusLosesAccess')
                            }}</span
                          >
                        </v-chip>
                        <v-chip
                          v-else-if="member.transferStatus === 'retained'"
                          size="x-small"
                          color="success"
                          variant="tonal"
                          prepend-icon="mdi:mdi-check-circle-outline"
                        >
                          <span :lang="locale">
                            {{ $t('trans.formMigration.statusRetained') }}</span
                          >
                        </v-chip>
                        <v-chip
                          v-else-if="
                            member.transferStatus === 'needs_assignment'
                          "
                          size="x-small"
                          color="warning"
                          variant="tonal"
                          prepend-icon="mdi:mdi-account-group-outline"
                        >
                          <span :lang="locale">
                            {{
                              $t('trans.formMigration.statusNeedsAssignment')
                            }}</span
                          >
                        </v-chip>
                        <v-chip
                          v-else-if="member.transferStatus === 'no_membership'"
                          size="x-small"
                          color="warning"
                          variant="tonal"
                          prepend-icon="mdi:mdi-account-off-outline"
                        >
                          <span :lang="locale">
                            {{
                              $t('trans.formMigration.statusNoMembership')
                            }}</span
                          >
                        </v-chip>
                        <v-chip
                          v-else
                          size="x-small"
                          color="grey"
                          variant="tonal"
                          prepend-icon="mdi:mdi-account-group-outline"
                        >
                          <span :lang="locale">
                            {{
                              $t('trans.formMigration.statusNeedsGroup')
                            }}</span
                          >
                        </v-chip>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-card>

            <!-- Submission stats — compact inline -->
            <v-card variant="outlined" class="mb-1">
              <v-card-title
                class="text-body-1 font-weight-medium pt-3 pb-0 px-4"
                :lang="locale"
              >
                {{ $t('trans.formMigration.submissionsImpactTitle') }}
              </v-card-title>
              <v-divider class="mt-2" />
              <v-card-text class="py-3">
                <div class="d-flex align-center gap-6 flex-wrap">
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold text-primary">
                      {{ impact.submissions.total }}
                    </div>
                    <div class="text-caption font-weight-medium" :lang="locale">
                      {{ $t('trans.formMigration.totalSubmissionsLabel') }}
                    </div>
                    <div
                      class="text-caption text-medium-emphasis"
                      :lang="locale"
                    >
                      {{ $t('trans.formMigration.totalSubmissionsHint') }}
                    </div>
                  </div>
                  <v-divider vertical class="my-1" style="height: 48px" />
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold text-warning">
                      {{ impact.submissions.drafts }}
                    </div>
                    <div class="text-caption font-weight-medium" :lang="locale">
                      {{ $t('trans.formMigration.draftsLabel') }}
                    </div>
                    <div
                      class="text-caption text-medium-emphasis"
                      :lang="locale"
                    >
                      {{ $t('trans.formMigration.draftsHint') }}
                    </div>
                  </div>
                  <v-divider vertical class="my-1" style="height: 48px" />
                  <div class="text-center">
                    <div class="text-h5 font-weight-bold text-info">
                      {{ impact.submissions.withShareUsers }}
                    </div>
                    <div class="text-caption font-weight-medium" :lang="locale">
                      {{ $t('trans.formMigration.sharedSubmissionsLabel') }}
                    </div>
                    <div
                      class="text-caption text-medium-emphasis"
                      :lang="locale"
                    >
                      {{ $t('trans.formMigration.sharedSubmissionsHint') }}
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>

          <!-- What Changes — collapsible -->
          <v-expansion-panels variant="accordion" class="mb-5">
            <v-expansion-panel>
              <v-expansion-panel-title
                class="text-body-2 font-weight-medium"
                :lang="locale"
              >
                <v-icon class="mr-2" size="18">
                  mdi:mdi-information-outline
                </v-icon>
                {{ $t('trans.formMigration.afterMigrationTitle') }}
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list density="compact" class="py-0">
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
                  <v-list-item
                    prepend-icon="mdi:mdi-alert-outline"
                    color="warning"
                  >
                    <v-list-item-title class="text-body-2" :lang="locale">
                      {{ $t('trans.formMigration.afterDraftShareGated') }}
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    prepend-icon="mdi:mdi-alert-outline"
                    color="warning"
                  >
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
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- ── Confirm & Transfer ──────────────────────────────── -->
          <v-divider class="mb-4" />
          <v-card variant="outlined" class="mb-2">
            <v-card-text class="pt-3 pb-4">
              <v-checkbox
                v-model="confirmed"
                :label="$t('trans.formMigration.confirmCheckbox')"
                color="error"
                density="compact"
                hide-details
                class="mb-4"
                :lang="locale"
              />
              <div class="d-flex gap-3 flex-wrap">
                <v-btn
                  color="primary"
                  :disabled="!canSubmit"
                  :loading="submitting"
                  :lang="locale"
                  @click="submitMigration"
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
            </v-card-text>
          </v-card>
        </template>
      </template>
    </v-container>
  </BaseSecure>
</template>

<style scoped>
/* Step badge */
.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 700;
  flex-shrink: 0;
}

.step-badge--inactive {
  background: rgb(var(--v-theme-on-surface), 0.26);
}

/* Step section spacing */
.step-section {
  padding-left: 4px;
}

/* Table wrapper for horizontal scroll on narrow screens */
.table-wrapper {
  overflow-x: auto;
}

.col-name {
  min-width: 160px;
}

/* Row tinting by transfer status */
tr.row-retained {
  background: rgb(var(--v-theme-success), 0.05);
}

tr.row-error {
  background: rgb(var(--v-theme-error), 0.05);
}

tr.row-warning {
  background: rgb(var(--v-theme-warning), 0.06);
}
</style>
