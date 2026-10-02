<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import GroupPicker from '~/components/forms/migrate/GroupPicker.vue';
import rbacService from '~/services/rbacService';
import { useAuthStore } from '~/store/auth';
import { useTenantStore } from '~/store/tenant';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();
const tenantStore = useTenantStore();
const authStore = useAuthStore();

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
const showRetryButton = ref(false);
const showConfirmDialog = ref(false);
const migrated = ref(false);
const migrationResult = ref(null);
const alreadyMigrated = ref(false);
const migratedInfo = ref(null);

// True whenever the form lives in a tenant — whether it was migrated just now in this
// session or on an earlier visit. Drives the migrated view and hides the wizard.
const showMigratedState = computed(
  () => migrated.value || alreadyMigrated.value
);

const formName = ref('');
const eligibleTenants = ref([]);
const impact = ref({ ...EMPTY_IMPACT });
const selectedTenantId = ref(null);

const loadingGroups = ref(false);
const refreshingGroups = ref(false);
const staleGroupsRemoved = ref(false);
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

const hasFormAdminGroupAssigned = computed(() =>
  assignedGroups.value.some((g) => g.isFormAdmin)
);

// Distinct people across every assigned group, each annotated with the groups they are
// in. Built from the same membership data the status chips use, so the list and the
// statuses can never tell different stories.
const assignedGroupUsers = computed(() => {
  const byUser = new Map();
  for (const group of assignedGroups.value) {
    for (const member of group.members || []) {
      if (!member?.ssoUserId) continue;
      if (!byUser.has(member.ssoUserId)) {
        byUser.set(member.ssoUserId, { ...member, groupNames: [] });
      }
      byUser.get(member.ssoUserId).groupNames.push(group.name);
    }
  }
  return [...byUser.values()].sort((a, b) =>
    (a.fullName || a.email || '').localeCompare(b.fullName || b.email || '')
  );
});

// members === null means CSTAR could not be read for that group — distinct from a group
// that genuinely has nobody in it, so the UI can say which happened.
const unreadableAssignedGroups = computed(() =>
  assignedGroups.value.filter((g) => g.members === null)
);

// The already-migrated response carries only the tenant id; resolve it to a name from
// the user's own tenant list, falling back to the id so the message is never blank.
const migratedTenantName = computed(() => {
  const id = migratedInfo.value?.tenantId;
  if (!id) return '';
  return tenantStore.getTenantById?.(id)?.name || id;
});

const showNoGroupsWarning = computed(
  () =>
    !!selectedTenantId.value &&
    !loadingGroups.value &&
    !hasFormAdminGroupAssigned.value
);

const canSubmit = computed(
  () =>
    !!selectedTenantId.value &&
    confirmed.value &&
    hasFormAdminGroupAssigned.value
);

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

// Only BCeID Basic cannot authenticate in tenant mode — BCeID Business
// authenticates normally and follows the same group-membership rules as IDIR.
const hasBceidBasicUsers = computed(() =>
  impact.value.team.some((u) => u.isBceidBasic)
);
const bceidBasicCount = computed(
  () => impact.value.team.filter((u) => u.isBceidBasic).length
);

const teamMemberGroupMap = computed(() => {
  const map = new Map();
  for (const m of teamMemberGroups.value) map.set(m.email, m.groupIds);
  return map;
});

// True when the groups loaded but CSTAR membership could not be read for any of them —
// we then know nothing about who belongs where, which is not the same as nobody belonging.
const membershipUnknown = computed(
  () =>
    allTenantGroups.value.length > 0 &&
    allTenantGroups.value.every((g) => g.members === null)
);

const teamRowsWithStatus = computed(() => {
  const assignedIds = new Set(assignedGroups.value.map((g) => g.id));
  const groupNameMap = new Map(
    allTenantGroups.value.map((g) => [g.id, g.name])
  );
  const tenantLoaded = teamMemberGroups.value.length > 0;

  return teamRows.value.map((member) => {
    if (member.isBceidBasic) {
      return { ...member, transferStatus: 'loses_access', memberGroups: [] };
    }
    // Membership could not be read: say so rather than asserting "no group membership",
    // which reads as a definite finding and sends people off to fix a non-problem.
    if (membershipUnknown.value) {
      return { ...member, transferStatus: 'unknown', memberGroups: [] };
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

// Count members losing or needing to re-establish access — used for the "at risk" chip
// "unknown" is deliberately excluded: we could not read membership, so calling those
// people at risk would be asserting something we do not know.
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
  if (status === 'unknown') return '';
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

// BCeID Basic cannot authenticate in tenant mode (loses access outright);
// BCeID Business authenticates normally and follows the same
// group-membership rules as IDIR — so each gets its own badge.
function idpBadgeLabel(member) {
  if (member.isBceidBasic) return t('trans.formMigration.idpBadgeBceidBasic');
  if (member.isBceid) return t('trans.formMigration.idpBadgeBceidBusiness');
  return t('trans.formMigration.idpBadgeIdir');
}

function idpBadgeColor(member) {
  return member.isBceidBasic ? 'warning' : 'info';
}

onMounted(async () => {
  if (!tenantStore.isTenantFeatureEnabled) {
    router.replace({ name: 'UserForms' });
    return;
  }
  await loadPreviewData();
});

// showLoading is suppressed on refresh: the refresh control has its own spinner, and
// toggling the page-level flag would blank the whole wizard mid-interaction.
async function loadPreviewData({ refresh = false, showLoading = true } = {}) {
  if (showLoading) loading.value = true;
  error.value = null;
  try {
    const res = await rbacService.getMigrationPreview(props.f, { refresh });
    formName.value = res.data.formName || '';
    // The form may already belong to a tenant — on a revisit, a reload, or browser Back
    // after migrating. That is a state to render, not an error.
    if (res.data.alreadyMigrated) {
      alreadyMigrated.value = true;
      migratedInfo.value = {
        tenantId: res.data.tenantId,
        migratedAt: res.data.migratedAt,
        migratedBy: res.data.migratedBy,
      };
      return;
    }
    alreadyMigrated.value = false;
    eligibleTenants.value = res.data.eligibleTenants || [];
    impact.value = res.data.impact || { ...EMPTY_IMPACT };
  } catch (err) {
    error.value = err.response?.data?.detail || err.message;
  } finally {
    if (showLoading) loading.value = false;
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

// Switching tenants quickly leaves several group requests in flight; without this token
// a slower response for an abandoned tenant can land last and overwrite the groups for
// the tenant actually selected.
let groupsRequestToken = 0;

async function loadTenantGroups(tenantId) {
  const token = ++groupsRequestToken;
  loadingGroups.value = true;
  try {
    const res = await rbacService.getMigrationTenantGroups(props.f, tenantId);
    if (token !== groupsRequestToken) return;
    allTenantGroups.value = res.data.groups || [];
    teamMemberGroups.value = res.data.teamMemberGroups || [];
    const preSelectedIds = new Set(res.data.preSelectedGroupIds || []);
    assignedGroups.value = allTenantGroups.value.filter((g) =>
      preSelectedIds.has(g.id)
    );
  } catch (err) {
    if (token !== groupsRequestToken) return;
    error.value = err.response?.data?.detail || err.message;
  } finally {
    if (token === groupsRequestToken) loadingGroups.value = false;
  }
}

// Re-fetches tenant groups and team memberships for the currently selected
// tenant without losing the user's in-progress selection — unlike
// loadTenantGroups (used on initial tenant pick), this does NOT reset
// assignedGroups to the server's pre-selected defaults. Groups the user had
// assigned that no longer exist are dropped, and the user is warned.
async function refreshTenantGroups() {
  if (!selectedTenantId.value) return;
  refreshingGroups.value = true;
  staleGroupsRemoved.value = false;
  try {
    // Refresh must re-pull everything the page shows, not just the group lists —
    // the team impact table and submission counts come from the preview call, and
    // leaving them stale makes Refresh look like it did nothing.
    const [res] = await Promise.all([
      rbacService.getMigrationTenantGroups(props.f, selectedTenantId.value),
      loadPreviewData({ refresh: true, showLoading: false }),
    ]);
    allTenantGroups.value = res.data.groups || [];
    teamMemberGroups.value = res.data.teamMemberGroups || [];

    // Keep the user's selection, but carry over the REFRESHED group objects rather than
    // the ones already held — otherwise membership stays as it was when the tenant was
    // first picked and the assigned-users list silently ignores the refresh.
    const freshById = new Map(allTenantGroups.value.map((g) => [g.id, g]));
    const stillValid = assignedGroups.value
      .map((g) => freshById.get(g.id))
      .filter(Boolean);
    staleGroupsRemoved.value = stillValid.length < assignedGroups.value.length;
    assignedGroups.value = stillValid;

    confirmed.value = false;
  } catch (err) {
    error.value = err.response?.data?.detail || err.message;
  } finally {
    refreshingGroups.value = false;
  }
}

function requestMigration() {
  showConfirmDialog.value = true;
}

async function confirmMigration() {
  showConfirmDialog.value = false;
  await submitMigration();
}

// On a CSTAR-side session expiry, try a silent token refresh before telling the
// user to reload — a reload would discard the tenant/group selections they just
// made. If Keycloak can refresh the token, offer an in-place retry instead.
async function attemptSessionRecovery() {
  try {
    await authStore.keycloak.updateToken(30);
    return true;
  } catch {
    return false;
  }
}

async function submitMigration() {
  submitting.value = true;
  error.value = null;
  showRefreshButton.value = false;
  showRetryButton.value = false;
  try {
    const groupIds =
      assignedGroups.value.length > 0
        ? assignedGroups.value.map((g) => g.id)
        : undefined;
    await rbacService.executeMigration(props.f, {
      tenantId: selectedTenantId.value,
      ...(groupIds ? { groupIds } : {}),
    });
    // Capture the outcome before switching tenants — the impact data is what the
    // result screen reports, and selecting the tenant re-scopes everything.
    migrationResult.value = {
      tenantName: selectedTenant.value?.name,
      groupNames: assignedGroups.value.map((g) => g.name),
      submissions: { ...impact.value.submissions },
      retained: teamRowsWithStatus.value.filter(
        (m) => m.transferStatus === 'retained'
      ).length,
      needsGroup: teamRowsWithStatus.value.filter(
        (m) =>
          m.transferStatus === 'needs_assignment' ||
          m.transferStatus === 'no_membership' ||
          m.transferStatus === 'needs_group'
      ).length,
      losesAccess: teamRowsWithStatus.value.filter(
        (m) => m.transferStatus === 'loses_access'
      ).length,
    };
    tenantStore.selectTenant(selectedTenant.value);
    migrated.value = true;
  } catch (err) {
    const code = err.response?.data?.code;
    // Migrated elsewhere (another tab, another admin) — show the migrated state rather
    // than an error about a thing that has in fact succeeded.
    if (code === 'ALREADY_MIGRATED') {
      await loadPreviewData({ showLoading: false });
      return;
    }
    if (code === 'SESSION_EXPIRED') {
      const recovered = await attemptSessionRecovery();
      if (recovered) {
        error.value = t('trans.formMigration.sessionExpiredRetry');
        showRetryButton.value = true;
      } else {
        error.value = t('trans.formMigration.sessionExpired');
        showRefreshButton.value = true;
      }
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
  error,
  confirmed,
  formName,
  loadPreviewData,
  eligibleTenants,
  impact,
  selectedTenantId,
  selectedTenant,
  assignedGroups,
  hasFormAdminGroupAssigned,
  showNoGroupsWarning,
  canSubmit,
  hasBceidBasicUsers,
  bceidBasicCount,
  teamRows,
  teamRowsWithStatus,
  loadingGroups,
  refreshingGroups,
  staleGroupsRemoved,
  showConfirmDialog,
  showRetryButton,
  migrated,
  migrationResult,
  alreadyMigrated,
  migratedInfo,
  showMigratedState,
  migratedTenantName,
  assignedGroupUsers,
  unreadableAssignedGroups,
  refreshTenantGroups,
  loadTenantGroups,
  allTenantGroups,
  atRiskCount,
  requestMigration,
  confirmMigration,
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
          <h2 v-if="formName" class="text-subtitle-1 font-weight-medium mb-1">
            {{ formName }}
          </h2>
          <p class="text-body-2 text-medium-emphasis mb-0" :lang="locale">
            {{ $t('trans.formMigration.description') }}
          </p>
        </div>
      </div>

      <!-- Permanent-action warning banner — irrelevant once the action is done -->
      <v-alert
        v-if="!showMigratedState"
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
        <template v-if="showRetryButton" #append>
          <v-btn
            size="small"
            variant="outlined"
            class="ml-2"
            :loading="submitting"
            :lang="locale"
            @click="submitMigration"
          >
            {{ $t('trans.formMigration.tryAgain') }}
          </v-btn>
        </template>
        <template v-else-if="showRefreshButton" #append>
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

      <!-- ── ALREADY MIGRATED — revisit, reload, or browser Back ───────────── -->
      <template v-if="alreadyMigrated">
        <v-card variant="outlined" class="mb-4">
          <v-card-text class="pa-6">
            <div class="d-flex align-start ga-3 mb-4">
              <v-icon size="36" color="success" class="flex-shrink-0">
                mdi:mdi-check-circle
              </v-icon>
              <div>
                <h2 class="text-h6 mb-1" :lang="locale">
                  {{ $t('trans.formMigration.alreadyMigratedTitle') }}
                </h2>
                <p class="text-body-2 text-medium-emphasis mb-0" :lang="locale">
                  {{
                    migratedInfo && migratedInfo.migratedAt
                      ? $t('trans.formMigration.alreadyMigratedOn', {
                          tenant: migratedTenantName,
                          date: new Date(
                            migratedInfo.migratedAt
                          ).toLocaleDateString(),
                          by: migratedInfo.migratedBy,
                        })
                      : $t('trans.formMigration.alreadyMigratedToTenant', {
                          tenant: migratedTenantName,
                        })
                  }}
                </p>
              </div>
            </div>
            <div class="d-flex ga-3 flex-wrap">
              <v-btn
                color="primary"
                :lang="locale"
                :to="{ name: 'FormGroups', query: { f } }"
              >
                {{ $t('trans.formMigration.resultManageGroups') }}
              </v-btn>
              <v-btn
                variant="outlined"
                :lang="locale"
                :to="{ name: 'FormManage', query: { f } }"
              >
                {{ $t('trans.formMigration.resultBackToForm') }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </template>

      <!-- ── RESULT — shown once the migration has actually happened ────────── -->
      <template v-else-if="migrated && migrationResult">
        <v-card variant="outlined" class="mb-4">
          <v-card-text class="pa-6">
            <div class="d-flex align-start ga-3 mb-5">
              <v-icon size="36" color="success" class="flex-shrink-0">
                mdi:mdi-check-circle
              </v-icon>
              <div>
                <h2 class="text-h6 mb-1" :lang="locale">
                  {{ $t('trans.formMigration.resultTitle') }}
                </h2>
                <p class="text-body-2 text-medium-emphasis mb-0" :lang="locale">
                  {{
                    $t('trans.formMigration.resultSubtitle', {
                      tenant: migrationResult.tenantName,
                    })
                  }}
                </p>
              </div>
            </div>

            <v-list density="compact" class="py-0 mb-4">
              <v-list-item
                prepend-icon="mdi:mdi-check-circle-outline"
                base-color="success"
              >
                <v-list-item-title class="text-body-2" :lang="locale">
                  {{
                    $t(
                      'trans.formMigration.resultSubmissionsKept',
                      migrationResult.submissions.total,
                      {
                        total: migrationResult.submissions.total,
                        drafts: migrationResult.submissions.drafts,
                      }
                    )
                  }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                prepend-icon="mdi:mdi-check-circle-outline"
                base-color="success"
              >
                <v-list-item-title class="text-body-2" :lang="locale">
                  {{
                    $t(
                      'trans.formMigration.resultSharesKept',
                      migrationResult.submissions.withShareUsers,
                      { count: migrationResult.submissions.withShareUsers }
                    )
                  }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                v-if="migrationResult.retained > 0"
                prepend-icon="mdi:mdi-account-check-outline"
                base-color="success"
              >
                <v-list-item-title class="text-body-2" :lang="locale">
                  {{
                    $t(
                      'trans.formMigration.resultRetained',
                      migrationResult.retained,
                      {
                        count: migrationResult.retained,
                      }
                    )
                  }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                v-if="migrationResult.needsGroup > 0"
                prepend-icon="mdi:mdi-account-alert-outline"
                base-color="warning"
              >
                <v-list-item-title class="text-body-2" :lang="locale">
                  {{
                    $t(
                      'trans.formMigration.resultNeedsGroup',
                      migrationResult.needsGroup,
                      { count: migrationResult.needsGroup }
                    )
                  }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                v-if="migrationResult.losesAccess > 0"
                prepend-icon="mdi:mdi-close-circle-outline"
                base-color="error"
              >
                <v-list-item-title class="text-body-2" :lang="locale">
                  {{
                    $t(
                      'trans.formMigration.resultLosesAccess',
                      migrationResult.losesAccess,
                      { count: migrationResult.losesAccess }
                    )
                  }}
                </v-list-item-title>
              </v-list-item>
            </v-list>

            <v-alert
              v-if="
                migrationResult.needsGroup > 0 ||
                migrationResult.losesAccess > 0
              "
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-4"
              icon="mdi:mdi-alert-outline"
              :lang="locale"
            >
              {{ $t('trans.formMigration.resultActionNeeded') }}
            </v-alert>

            <div class="d-flex ga-3 flex-wrap">
              <v-btn
                color="primary"
                :lang="locale"
                :to="{ name: 'FormGroups', query: { f } }"
              >
                {{ $t('trans.formMigration.resultManageGroups') }}
              </v-btn>
              <v-btn
                variant="outlined"
                :lang="locale"
                :to="{ name: 'FormManage', query: { f } }"
              >
                {{ $t('trans.formMigration.resultBackToForm') }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </template>

      <!-- Initial page load spinner -->
      <div v-else-if="loading" class="d-flex justify-center my-10">
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
              :menu-props="{ closeOnContentClick: true }"
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
                <v-progress-circular
                  v-if="loadingGroups || refreshingGroups"
                  indeterminate
                  color="primary"
                  size="18"
                  width="2"
                  class="ml-3"
                />
                <v-spacer />
                <v-tooltip
                  :text="$t('trans.formMigration.refreshGroups')"
                  location="top"
                >
                  <template #activator="{ props: tip }">
                    <v-btn
                      v-bind="tip"
                      icon="mdi:mdi-refresh"
                      size="small"
                      variant="text"
                      :disabled="loadingGroups || refreshingGroups"
                      :aria-label="$t('trans.formMigration.refreshGroups')"
                      @click="refreshTenantGroups"
                    />
                  </template>
                </v-tooltip>
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
              <v-alert
                v-if="staleGroupsRemoved"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-3"
                icon="mdi:mdi-information-outline"
                closable
                :lang="locale"
                @click:close="staleGroupsRemoved = false"
              >
                {{ $t('trans.formMigration.groupsRemovedOnRefresh') }}
              </v-alert>
              <v-alert
                v-if="showNoGroupsWarning"
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-3"
                icon="mdi:mdi-alert-outline"
                :lang="locale"
              >
                {{ $t('trans.formMigration.noGroupsAssignedWarning') }}
              </v-alert>

              <!-- Who is actually in the groups being assigned -->
              <v-card
                v-if="assignedGroups.length > 0"
                variant="outlined"
                class="mt-4"
              >
                <v-card-title
                  class="text-body-1 font-weight-medium pt-3 pb-0 px-4"
                  :lang="locale"
                >
                  {{ $t('trans.formMigration.assignedUsersTitle') }}
                  <v-chip
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    class="ml-2"
                  >
                    {{ assignedGroupUsers.length }}
                  </v-chip>
                </v-card-title>
                <v-card-subtitle
                  class="px-4 pt-1 pb-2 text-caption"
                  :lang="locale"
                >
                  {{ $t('trans.formMigration.assignedUsersSubtitle') }}
                </v-card-subtitle>
                <v-divider />
                <div v-if="loadingGroups" class="d-flex justify-center py-4">
                  <v-progress-circular
                    indeterminate
                    color="primary"
                    size="22"
                  />
                </div>
                <div
                  v-else-if="assignedGroupUsers.length === 0"
                  class="px-4 py-4 text-body-2 text-medium-emphasis text-center"
                  :lang="locale"
                >
                  {{
                    unreadableAssignedGroups.length > 0
                      ? $t('trans.formMigration.assignedUsersUnreadable')
                      : $t('trans.formMigration.assignedUsersEmpty')
                  }}
                </div>
                <v-list v-else density="compact" class="py-1">
                  <v-list-item
                    v-for="u in assignedGroupUsers"
                    :key="u.ssoUserId"
                  >
                    <v-list-item-title class="text-body-2">
                      {{ u.fullName || u.email }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ u.email }}
                    </v-list-item-subtitle>
                    <template #append>
                      <div class="d-flex flex-wrap ga-1 justify-end">
                        <v-chip
                          v-for="g in u.groupNames"
                          :key="g"
                          size="x-small"
                          variant="tonal"
                          color="primary"
                        >
                          {{ g }}
                        </v-chip>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
                <v-alert
                  v-if="unreadableAssignedGroups.length > 0"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  class="ma-3"
                  icon="mdi:mdi-alert-outline"
                  :lang="locale"
                >
                  {{ $t('trans.formMigration.assignedUsersUnreadable') }}
                </v-alert>
              </v-card>
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
                v-if="hasBceidBasicUsers"
                size="x-small"
                color="warning"
                variant="tonal"
                class="ml-2"
              >
                {{ bceidBasicCount }}
                {{ $t('trans.formMigration.bceidBasicLabel') }}
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
                class="px-4 pt-1 pb-2 text-caption subtitle-wrap"
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
                      <th scope="col" class="col-name" :lang="locale">
                        {{ $t('trans.formMigration.colName') }}
                      </th>
                      <th scope="col" :lang="locale">
                        {{ $t('trans.formMigration.colRoles') }}
                      </th>
                      <th scope="col" :lang="locale">
                        {{ $t('trans.formMigration.colIdp') }}
                      </th>
                      <th v-if="selectedTenantId" scope="col" :lang="locale">
                        {{ $t('trans.formMigration.colTenantGroups') }}
                      </th>
                      <th scope="col" :lang="locale">
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
                          :color="idpBadgeColor(member)"
                          variant="tonal"
                          :lang="locale"
                        >
                          {{ idpBadgeLabel(member) }}
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
                          v-else-if="member.transferStatus === 'unknown'"
                          size="x-small"
                          color="grey"
                          variant="tonal"
                          prepend-icon="mdi:mdi-help-circle-outline"
                        >
                          <span :lang="locale">
                            {{ $t('trans.formMigration.statusUnknown') }}</span
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
              <v-card-text class="stats-grid">
                <div class="stat-col">
                  <v-icon size="20" color="primary" class="stat-icon">
                    mdi:mdi-file-document-outline
                  </v-icon>
                  <div class="text-h5 font-weight-bold text-primary">
                    {{ impact.submissions.total }}
                  </div>
                  <div class="text-caption font-weight-medium" :lang="locale">
                    {{ $t('trans.formMigration.totalSubmissionsLabel') }}
                  </div>
                  <div class="stat-hint text-medium-emphasis" :lang="locale">
                    {{ $t('trans.formMigration.totalSubmissionsHint') }}
                  </div>
                </div>
                <div class="stat-col">
                  <v-icon size="20" color="warning" class="stat-icon">
                    mdi:mdi-pencil-outline
                  </v-icon>
                  <div class="text-h5 font-weight-bold text-warning">
                    {{ impact.submissions.drafts }}
                  </div>
                  <div class="text-caption font-weight-medium" :lang="locale">
                    {{ $t('trans.formMigration.draftsLabel') }}
                  </div>
                  <div class="stat-hint text-medium-emphasis" :lang="locale">
                    {{ $t('trans.formMigration.draftsHint') }}
                  </div>
                </div>
                <div class="stat-col">
                  <v-icon size="20" color="info" class="stat-icon">
                    mdi:mdi-account-group-outline
                  </v-icon>
                  <div class="text-h5 font-weight-bold text-info">
                    {{ impact.submissions.withShareUsers }}
                  </div>
                  <div class="text-caption font-weight-medium" :lang="locale">
                    {{ $t('trans.formMigration.sharedSubmissionsLabel') }}
                  </div>
                  <div class="stat-hint text-medium-emphasis" :lang="locale">
                    {{ $t('trans.formMigration.sharedSubmissionsHint') }}
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
                    v-if="hasBceidBasicUsers"
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

          <!-- ── Confirm & Migrate ──────────────────────────────── -->
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
                  @click="requestMigration"
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

      <!-- Final confirmation — last checkpoint before an irreversible migration -->
      <v-dialog v-model="showConfirmDialog" max-width="500" persistent>
        <v-card>
          <v-card-title class="d-flex align-center" :lang="locale">
            <v-icon color="error" class="mr-2">
              mdi:mdi-alert-circle-outline
            </v-icon>
            {{ $t('trans.formMigration.confirmTitle') }}
          </v-card-title>
          <v-card-text :lang="locale">
            <p class="mb-3">{{ $t('trans.formMigration.confirmMessage') }}</p>
            <p class="mb-0 font-weight-medium">
              {{
                $t('trans.formMigration.confirmDetail', {
                  formName: formName,
                  tenant: selectedTenant ? selectedTenant.name : '',
                  groups: assignedGroups.map((g) => g.name).join(', '),
                })
              }}
            </p>
          </v-card-text>
          <v-card-actions class="justify-end pb-4 px-4">
            <v-btn
              variant="outlined"
              :disabled="submitting"
              :lang="locale"
              @click="showConfirmDialog = false"
            >
              {{ $t('trans.formMigration.cancelButton') }}
            </v-btn>
            <v-btn
              color="error"
              :loading="submitting"
              :lang="locale"
              @click="confirmMigration"
            >
              {{ $t('trans.formMigration.confirmButton') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </BaseSecure>
</template>

<style scoped>
/* Vuetify truncates card subtitles by default; these are full sentences. */
.subtitle-wrap {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}

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

/* Row tinting by migration status */
tr.row-retained {
  background: rgb(var(--v-theme-success), 0.05);
}

tr.row-error {
  background: rgb(var(--v-theme-error), 0.05);
}

tr.row-warning {
  background: rgb(var(--v-theme-warning), 0.06);
}

/* Submission stats grid — equal-width self-contained columns */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 16px 20px;
}

.stat-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 0 16px;
  border-left: 1px solid rgb(var(--v-theme-on-surface), 0.12);
  min-width: 0;
}

.stat-col:first-child {
  border-left: none;
  padding-left: 0;
}

.stat-icon {
  margin-bottom: -4px;
}

.stat-hint {
  font-size: 0.75rem;
  line-height: 1.4;
  margin-top: 8px;
  max-width: 100%;
  overflow-wrap: break-word;
}

@media (max-width: 599px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 16px;
  }

  .stat-col {
    border-left: none;
    border-top: 1px solid rgb(var(--v-theme-on-surface), 0.12);
    padding: 16px 0 0;
  }

  .stat-col:first-child {
    border-top: none;
    padding-top: 0;
  }
}
</style>
