<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { rbacService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useTenantStore } from '~/store/tenant';
import { TenantRoles, NotificationTypes } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

const formStore = useFormStore();
const notificationStore = useNotificationStore();
const tenantStore = useTenantStore();

const { form, isRTL } = storeToRefs(formStore);

const loading = ref(true);
const saving = ref(false);
const assignedGroups = ref([]);
const availableGroups = ref([]);
const missingGroups = ref([]);
const searchAvailable = ref('');
const searchAssigned = ref('');
const selectedAvailable = ref([]); // IDs of checked items in available panel
const selectedAssigned = ref([]); // IDs of checked items in assigned panel
const showSaveDialog = ref(false);
const showUnsavedDialog = ref(false);
const isDirty = ref(false);
const leaveResolve = ref(null);

// form_admin CSTAR role can manage group associations
const canManageGroups = computed(() => {
  const roles = tenantStore.selectedTenant?.roles || [];
  return roles.includes(TenantRoles.FORM_ADMIN);
});

const filteredAvailable = computed(() => {
  const q = searchAvailable.value.toLowerCase();
  if (!q) return availableGroups.value;
  return availableGroups.value.filter(
    (g) =>
      g.name?.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q)
  );
});

const filteredAssigned = computed(() => {
  const q = searchAssigned.value.toLowerCase();
  if (!q) return assignedGroups.value;
  return assignedGroups.value.filter(
    (g) =>
      g.name?.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q)
  );
});

// Select-all states for each panel (based on currently visible/filtered items)
const allAvailableSelected = computed(
  () =>
    filteredAvailable.value.length > 0 &&
    filteredAvailable.value.every((g) => selectedAvailable.value.includes(g.id))
);
const someAvailableSelected = computed(() =>
  filteredAvailable.value.some((g) => selectedAvailable.value.includes(g.id))
);

const allAssignedSelected = computed(
  () =>
    filteredAssigned.value.length > 0 &&
    filteredAssigned.value.every((g) => selectedAssigned.value.includes(g.id))
);
const someAssignedSelected = computed(() =>
  filteredAssigned.value.some((g) => selectedAssigned.value.includes(g.id))
);

// True when the component is loaded without a tenant context (direct URL access, degraded state)
const noTenant = computed(() => !tenantStore.selectedTenant);

onMounted(() => {
  if (noTenant.value) {
    loading.value = false;
    return;
  }
  loadItems();
});

async function loadItems() {
  loading.value = true;
  await Promise.all([formStore.fetchForm(properties.formId), loadFormGroups()]);
  loading.value = false;
}

async function loadFormGroups() {
  try {
    const response = await rbacService.getFormGroups(properties.formId);
    const data = response.data;
    assignedGroups.value = data.associatedGroups || [];
    availableGroups.value = data.availableGroups || [];
    missingGroups.value = data.missingGroups || [];
    selectedAvailable.value = [];
    selectedAssigned.value = [];
  } catch (error) {
    notificationStore.addNotification({
      ...NotificationTypes.ERROR,
      text: t('trans.groupManagement.getGroupsErrMsg'),
      consoleError: `Error loading form groups: ${error}`,
    });
    assignedGroups.value = [];
    availableGroups.value = [];
    missingGroups.value = [];
  }
}

function toggleAvailableSelection(id) {
  const idx = selectedAvailable.value.indexOf(id);
  if (idx === -1) selectedAvailable.value.push(id);
  else selectedAvailable.value.splice(idx, 1);
}

function toggleAssignedSelection(id) {
  const idx = selectedAssigned.value.indexOf(id);
  if (idx === -1) selectedAssigned.value.push(id);
  else selectedAssigned.value.splice(idx, 1);
}

function toggleSelectAllAvailable() {
  const filteredIds = filteredAvailable.value.map((g) => g.id);
  if (allAvailableSelected.value) {
    selectedAvailable.value = selectedAvailable.value.filter(
      (id) => !filteredIds.includes(id)
    );
  } else {
    selectedAvailable.value = [
      ...new Set([...selectedAvailable.value, ...filteredIds]),
    ];
  }
}

function toggleSelectAllAssigned() {
  const filteredIds = filteredAssigned.value.map((g) => g.id);
  if (allAssignedSelected.value) {
    selectedAssigned.value = selectedAssigned.value.filter(
      (id) => !filteredIds.includes(id)
    );
  } else {
    selectedAssigned.value = [
      ...new Set([...selectedAssigned.value, ...filteredIds]),
    ];
  }
}

function addGroup(group) {
  availableGroups.value = availableGroups.value.filter(
    (g) => g.id !== group.id
  );
  selectedAvailable.value = selectedAvailable.value.filter(
    (id) => id !== group.id
  );
  assignedGroups.value.push({ ...group, isAssociated: true });
  isDirty.value = true;
}

function removeGroup(group) {
  assignedGroups.value = assignedGroups.value.filter((g) => g.id !== group.id);
  selectedAssigned.value = selectedAssigned.value.filter(
    (id) => id !== group.id
  );
  // Missing groups (deleted from tenant) are not returned to the available list
  if (!group.isDeleted) {
    availableGroups.value.push({ ...group, isAssociated: false });
  }
  isDirty.value = true;
}

function addSelectedGroups() {
  const ids = new Set(selectedAvailable.value);
  const toAdd = availableGroups.value.filter((g) => ids.has(g.id));
  availableGroups.value = availableGroups.value.filter((g) => !ids.has(g.id));
  assignedGroups.value.push(
    ...toAdd.map((g) => ({ ...g, isAssociated: true }))
  );
  selectedAvailable.value = [];
  isDirty.value = true;
}

function removeSelectedGroups() {
  const ids = new Set(selectedAssigned.value);
  const toRemove = assignedGroups.value.filter((g) => ids.has(g.id));
  assignedGroups.value = assignedGroups.value.filter((g) => !ids.has(g.id));
  availableGroups.value.push(
    ...toRemove
      .filter((g) => !g.isDeleted)
      .map((g) => ({ ...g, isAssociated: false }))
  );
  selectedAssigned.value = [];
  isDirty.value = true;
}

async function saveGroups() {
  saving.value = true;
  showSaveDialog.value = false;
  try {
    const groupIds = assignedGroups.value.map((g) => g.id);
    await rbacService.assignGroupsToForm(properties.formId, groupIds);
    isDirty.value = false;
    await loadFormGroups();
    notificationStore.addNotification({
      ...NotificationTypes.SUCCESS,
      text: t('trans.groupManagement.saveSuccessMsg'),
    });
  } catch (error) {
    const code = error.response?.data?.code;
    let text = t('trans.groupManagement.saveErrMsg');
    if (code === 'FORM_ADMIN_GROUP_REQUIRED') {
      text = t('trans.groupManagement.formAdminGroupRequired');
    } else if (code === 'INVALID_GROUP_IDS') {
      text = t('trans.groupManagement.invalidGroupIds');
    } else if (code === 'INSUFFICIENT_PERMISSIONS') {
      text = t('trans.groupManagement.insufficientPermissions');
    }
    notificationStore.addNotification({
      ...NotificationTypes.ERROR,
      text,
      consoleError: `Error saving group associations: ${error}`,
    });
  } finally {
    saving.value = false;
  }
}

onBeforeRouteLeave(() => {
  if (isDirty.value) {
    return new Promise((resolve) => {
      leaveResolve.value = resolve;
      showUnsavedDialog.value = true;
    });
  }
});

function confirmLeave() {
  showUnsavedDialog.value = false;
  leaveResolve.value?.(true);
  leaveResolve.value = null;
}

function cancelLeave() {
  showUnsavedDialog.value = false;
  leaveResolve.value?.(false);
  leaveResolve.value = null;
}

defineExpose({
  addGroup,
  addSelectedGroups,
  allAvailableSelected,
  allAssignedSelected,
  assignedGroups,
  availableGroups,
  canManageGroups,
  cancelLeave,
  confirmLeave,
  filteredAvailable,
  filteredAssigned,
  isDirty,
  loading,
  loadFormGroups,
  missingGroups,
  noTenant,
  removeGroup,
  removeSelectedGroups,
  saveGroups,
  saving,
  searchAvailable,
  searchAssigned,
  selectedAssigned,
  selectedAvailable,
  showSaveDialog,
  showUnsavedDialog,
  someAvailableSelected,
  someAssignedSelected,
  toggleAssignedSelection,
  toggleAvailableSelection,
  toggleSelectAllAssigned,
  toggleSelectAllAvailable,
});
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-container
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <div>
        <h1 class="mr-auto" :lang="locale">
          {{ $t('trans.groupManagement.groupManagement') }}
        </h1>
        <h3>{{ form.name }}</h3>
      </div>
      <div style="z-index: 50">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              class="mx-1"
              color="primary"
              icon
              size="x-small"
              v-bind="props"
              :disabled="!formId"
              :to="{ name: 'FormManage', query: { f: formId } }"
              :title="$t('trans.groupManagement.manageForm')"
            >
              <v-icon icon="mdi:mdi-cog"></v-icon>
            </v-btn>
          </template>
          <span :lang="locale">{{
            $t('trans.groupManagement.manageForm')
          }}</span>
        </v-tooltip>
      </div>
    </v-container>

    <!-- Fallback: no tenant context (direct URL access or degraded state) -->
    <v-alert v-if="noTenant" type="error" class="mb-4" :lang="locale">
      {{ $t('trans.groupManagement.noTenantAccess') }}
    </v-alert>

    <v-alert
      v-if="!noTenant && missingGroups.length > 0"
      class="mb-4"
      type="warning"
      density="compact"
      :lang="locale"
    >
      {{
        $t('trans.groupManagement.missingGroupsWarning', {
          count: missingGroups.length,
        })
      }}
    </v-alert>

    <v-row v-if="!noTenant && loading" class="mt-4">
      <v-col class="d-flex justify-center">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>

    <v-row v-else-if="!noTenant" class="mt-2 group-panels">
      <!-- Available Groups -->
      <v-col cols="12" md="5">
        <v-card variant="outlined" height="100%">
          <v-card-title class="panel-title bg-grey-lighten-4" :lang="locale">
            <v-checkbox-btn
              :model-value="allAvailableSelected"
              :indeterminate="someAvailableSelected && !allAvailableSelected"
              :disabled="
                !canManageGroups || saving || filteredAvailable.length === 0
              "
              class="flex-grow-0 mr-1"
              :title="$t('trans.groupManagement.selectAll')"
              @click.stop="toggleSelectAllAvailable"
            />
            <v-icon icon="mdi:mdi-account-group-outline" class="mr-2" />
            {{ $t('trans.groupManagement.availableGroups') }}
            <v-chip size="small" class="ml-2" color="primary" variant="tonal">
              {{ availableGroups.length }}
            </v-chip>
          </v-card-title>

          <v-card-text class="pa-2">
            <v-text-field
              v-model="searchAvailable"
              append-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              class="mb-2"
              :disabled="loading"
              :label="$t('trans.groupManagement.searchAvailable')"
              :lang="locale"
            />

            <div class="group-list-container">
              <div
                v-if="filteredAvailable.length === 0"
                class="text-center text-medium-emphasis py-6"
                :lang="locale"
              >
                {{
                  searchAvailable
                    ? $t('trans.groupManagement.noMatchingRecordText')
                    : $t('trans.groupManagement.noAvailableGroups')
                }}
              </div>

              <v-list density="compact" class="pa-0">
                <v-list-item
                  v-for="group in filteredAvailable"
                  :key="group.id"
                  class="group-list-item px-2"
                  rounded="sm"
                >
                  <template #prepend>
                    <v-checkbox-btn
                      :model-value="selectedAvailable.includes(group.id)"
                      :disabled="!canManageGroups || saving"
                      class="flex-grow-0 mr-1"
                      @click.stop="toggleAvailableSelection(group.id)"
                    />
                  </template>
                  <v-list-item-title class="text-body-2 font-weight-medium">
                    {{ group.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle
                    v-if="group.description"
                    class="text-caption"
                  >
                    {{ group.description }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-btn
                      icon
                      size="x-small"
                      color="primary"
                      variant="tonal"
                      :disabled="!canManageGroups || saving"
                      :title="$t('trans.groupManagement.addGroup')"
                      @click="addGroup(group)"
                    >
                      <v-icon icon="mdi:mdi-chevron-right" />
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>

            <div
              v-if="selectedAvailable.length > 0"
              class="d-flex justify-end mt-2"
            >
              <v-btn
                size="small"
                color="primary"
                :disabled="!canManageGroups || saving"
                :lang="locale"
                @click="addSelectedGroups"
              >
                {{ $t('trans.groupManagement.addSelected') }}
                <v-chip
                  size="x-small"
                  class="ml-1"
                  color="white"
                  variant="tonal"
                >
                  {{ selectedAvailable.length }}
                </v-chip>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Arrow indicator column -->
      <v-col cols="12" md="2" class="d-flex align-center justify-center">
        <v-icon
          icon="mdi:mdi-swap-horizontal"
          size="x-large"
          color="grey-lighten-1"
          class="d-none d-md-flex"
        />
      </v-col>

      <!-- Assigned Groups -->
      <v-col cols="12" md="5">
        <v-card variant="outlined" height="100%">
          <v-card-title class="panel-title bg-primary-lighten-5" :lang="locale">
            <v-checkbox-btn
              :model-value="allAssignedSelected"
              :indeterminate="someAssignedSelected && !allAssignedSelected"
              :disabled="
                !canManageGroups || saving || filteredAssigned.length === 0
              "
              class="flex-grow-0 mr-1"
              :title="$t('trans.groupManagement.selectAll')"
              @click.stop="toggleSelectAllAssigned"
            />
            <v-icon icon="mdi:mdi-account-check" class="mr-2" color="primary" />
            {{ $t('trans.groupManagement.assignedGroups') }}
            <v-chip size="small" class="ml-2" color="success" variant="tonal">
              {{ assignedGroups.length }}
            </v-chip>
          </v-card-title>

          <v-card-text class="pa-2">
            <v-text-field
              v-model="searchAssigned"
              append-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              class="mb-2"
              :disabled="loading"
              :label="$t('trans.groupManagement.searchAssigned')"
              :lang="locale"
            />

            <div class="group-list-container">
              <div
                v-if="filteredAssigned.length === 0"
                class="text-center text-medium-emphasis py-6"
                :lang="locale"
              >
                {{
                  searchAssigned
                    ? $t('trans.groupManagement.noMatchingRecordText')
                    : $t('trans.groupManagement.noAssignedGroups')
                }}
              </div>

              <v-list density="compact" class="pa-0">
                <v-list-item
                  v-for="group in filteredAssigned"
                  :key="group.id"
                  class="group-list-item px-2"
                  :class="{ 'missing-group': group.isDeleted }"
                  rounded="sm"
                >
                  <template #prepend>
                    <v-checkbox-btn
                      :model-value="selectedAssigned.includes(group.id)"
                      :disabled="!canManageGroups || saving"
                      class="flex-grow-0 mr-1"
                      @click.stop="toggleAssignedSelection(group.id)"
                    />
                  </template>
                  <v-list-item-title class="text-body-2 font-weight-medium">
                    {{ group.name }}
                    <v-chip
                      v-if="group.isDeleted"
                      size="x-small"
                      color="warning"
                      variant="tonal"
                      class="ml-1"
                      :lang="locale"
                    >
                      {{ $t('trans.groupManagement.deleted') }}
                    </v-chip>
                  </v-list-item-title>
                  <v-list-item-subtitle
                    v-if="group.description && !group.isDeleted"
                    class="text-caption"
                  >
                    {{ group.description }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-btn
                      icon
                      size="x-small"
                      color="error"
                      variant="tonal"
                      :disabled="!canManageGroups || saving"
                      :title="$t('trans.groupManagement.removeGroup')"
                      @click="removeGroup(group)"
                    >
                      <v-icon icon="mdi:mdi-close" />
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>

            <div
              v-if="selectedAssigned.length > 0"
              class="d-flex justify-end mt-2"
            >
              <v-btn
                size="small"
                color="error"
                variant="tonal"
                :disabled="!canManageGroups || saving"
                :lang="locale"
                @click="removeSelectedGroups"
              >
                {{ $t('trans.groupManagement.removeSelected') }}
                <v-chip
                  size="x-small"
                  class="ml-1"
                  color="error"
                  variant="tonal"
                >
                  {{ selectedAssigned.length }}
                </v-chip>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="!noTenant" class="mt-4">
      <v-col class="d-flex justify-end">
        <v-btn
          color="primary"
          :disabled="saving || !canManageGroups || loading"
          :loading="saving"
          :lang="locale"
          @click="showSaveDialog = true"
        >
          {{ $t('trans.groupManagement.save') }}
        </v-btn>
      </v-col>
    </v-row>

    <v-dialog v-model="showSaveDialog" width="500">
      <v-card>
        <v-card-title :lang="locale">
          {{ $t('trans.groupManagement.confirmSave') }}
        </v-card-title>
        <v-card-text :lang="locale">
          {{ $t('trans.groupManagement.confirmSaveMsg') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :lang="locale" @click="showSaveDialog = false">
            {{ $t('trans.groupManagement.cancel') }}
          </v-btn>
          <v-btn color="primary" :lang="locale" @click="saveGroups">
            {{ $t('trans.groupManagement.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showUnsavedDialog" width="500" persistent>
      <v-card>
        <v-card-title :lang="locale">
          {{ $t('trans.groupManagement.unsavedChangesTitle') }}
        </v-card-title>
        <v-card-text :lang="locale">
          {{ $t('trans.groupManagement.unsavedChangesWarning') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :lang="locale" @click="cancelLeave">
            {{ $t('trans.groupManagement.cancel') }}
          </v-btn>
          <v-btn color="primary" :lang="locale" @click="confirmLeave">
            {{ $t('trans.groupManagement.leave') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.panel-title {
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px 16px;
  display: flex;
  align-items: center;
}

.group-list-container {
  max-height: 420px;
  overflow-y: auto;
}

.group-list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 52px;
}

.group-list-item:last-child {
  border-bottom: none;
}

.group-list-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.missing-group {
  background-color: rgba(255, 167, 38, 0.08);
}
</style>
