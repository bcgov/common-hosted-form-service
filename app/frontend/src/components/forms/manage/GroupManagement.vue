<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { rbacService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useTenantStore } from '~/store/tenant';
import { NotificationTypes } from '~/utils/constants';

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
const showSaveDialog = ref(false);

// form_admin CSTAR role can manage group associations
const canManageGroups = computed(() => {
  const roles = tenantStore.selectedTenant?.roles || [];
  return roles.includes('form_admin');
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

function addGroup(group) {
  availableGroups.value = availableGroups.value.filter(
    (g) => g.id !== group.id
  );
  assignedGroups.value.push({ ...group, isAssociated: true });
}

function removeGroup(group) {
  assignedGroups.value = assignedGroups.value.filter((g) => g.id !== group.id);
  // Missing groups (deleted from tenant) are not returned to the available list
  if (!group.isDeleted) {
    availableGroups.value.push({ ...group, isAssociated: false });
  }
}

async function saveGroups() {
  saving.value = true;
  showSaveDialog.value = false;
  try {
    const groupIds = assignedGroups.value.map((g) => g.id);
    await rbacService.assignGroupsToForm(properties.formId, groupIds);
    await loadFormGroups();
    notificationStore.addNotification({
      ...NotificationTypes.SUCCESS,
      text: t('trans.groupManagement.saveSuccessMsg'),
    });
  } catch (error) {
    notificationStore.addNotification({
      ...NotificationTypes.ERROR,
      text: t('trans.groupManagement.saveErrMsg'),
      consoleError: `Error saving group associations: ${error}`,
    });
  } finally {
    saving.value = false;
  }
}

defineExpose({
  assignedGroups,
  availableGroups,
  canManageGroups,
  noTenant,
  filteredAvailable,
  filteredAssigned,
  loading,
  loadFormGroups,
  missingGroups,
  saveGroups,
  saving,
  searchAvailable,
  searchAssigned,
  showSaveDialog,
  addGroup,
  removeGroup,
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
                    <v-icon
                      icon="mdi:mdi-account-group"
                      size="small"
                      color="grey"
                      class="mr-2"
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
                    <v-icon
                      :icon="
                        group.isDeleted
                          ? 'mdi:mdi-account-group-outline'
                          : 'mdi:mdi-account-group'
                      "
                      size="small"
                      :color="group.isDeleted ? 'warning' : 'primary'"
                      class="mr-2"
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
