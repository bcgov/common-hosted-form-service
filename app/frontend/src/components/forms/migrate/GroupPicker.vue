<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n({ useScope: 'global' });

const props = defineProps({
  available: {
    type: Array,
    default: () => [],
  },
  assigned: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:assigned']);

const searchAvailable = ref('');
const searchAssigned = ref('');
const selectedAvailable = ref([]);
const selectedAssigned = ref([]);

const hasAnyGroups = computed(
  () => props.available.length > 0 || props.assigned.length > 0
);

const filteredAvailable = computed(() => {
  const q = searchAvailable.value.toLowerCase();
  if (!q) return props.available;
  return props.available.filter((g) => g.name?.toLowerCase().includes(q));
});

const filteredAssigned = computed(() => {
  const q = searchAssigned.value.toLowerCase();
  if (!q) return props.assigned;
  return props.assigned.filter((g) => g.name?.toLowerCase().includes(q));
});

const allAvailableSelected = computed(
  () =>
    filteredAvailable.value.length > 0 &&
    filteredAvailable.value.every((g) => selectedAvailable.value.includes(g.id))
);

const someAvailableSelected = computed(
  () =>
    !allAvailableSelected.value &&
    filteredAvailable.value.some((g) => selectedAvailable.value.includes(g.id))
);

const allAssignedSelected = computed(
  () =>
    filteredAssigned.value.length > 0 &&
    filteredAssigned.value.every((g) => selectedAssigned.value.includes(g.id))
);

const someAssignedSelected = computed(
  () =>
    !allAssignedSelected.value &&
    filteredAssigned.value.some((g) => selectedAssigned.value.includes(g.id))
);

function toggleAvailable(id) {
  const idx = selectedAvailable.value.indexOf(id);
  if (idx === -1) selectedAvailable.value.push(id);
  else selectedAvailable.value.splice(idx, 1);
}

function toggleAssigned(id) {
  const idx = selectedAssigned.value.indexOf(id);
  if (idx === -1) selectedAssigned.value.push(id);
  else selectedAssigned.value.splice(idx, 1);
}

function toggleSelectAllAvailable() {
  if (allAvailableSelected.value) {
    selectedAvailable.value = selectedAvailable.value.filter(
      (id) => !filteredAvailable.value.some((g) => g.id === id)
    );
  } else {
    const toAdd = filteredAvailable.value
      .map((g) => g.id)
      .filter((id) => !selectedAvailable.value.includes(id));
    selectedAvailable.value.push(...toAdd);
  }
}

function toggleSelectAllAssigned() {
  if (allAssignedSelected.value) {
    selectedAssigned.value = selectedAssigned.value.filter(
      (id) => !filteredAssigned.value.some((g) => g.id === id)
    );
  } else {
    const toAdd = filteredAssigned.value
      .map((g) => g.id)
      .filter((id) => !selectedAssigned.value.includes(id));
    selectedAssigned.value.push(...toAdd);
  }
}

function addSelected() {
  const toMove = props.available.filter((g) =>
    selectedAvailable.value.includes(g.id)
  );
  emit('update:assigned', [...props.assigned, ...toMove]);
  selectedAvailable.value = [];
}

function removeSelected() {
  const removeIds = new Set(selectedAssigned.value);
  emit(
    'update:assigned',
    props.assigned.filter((g) => !removeIds.has(g.id))
  );
  selectedAssigned.value = [];
}

function addAll() {
  emit('update:assigned', [...props.assigned, ...props.available]);
  selectedAvailable.value = [];
}

function removeAll() {
  emit('update:assigned', []);
  selectedAssigned.value = [];
}
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="d-flex justify-center align-center py-6">
    <v-progress-circular indeterminate color="primary" size="28" />
  </div>

  <!-- No groups in this tenant at all -->
  <div
    v-else-if="!hasAnyGroups"
    class="d-flex flex-column align-center justify-center py-6 text-center"
  >
    <v-icon size="36" color="medium-emphasis" class="mb-2">
      mdi:mdi-account-group-outline
    </v-icon>
    <div class="text-body-2 text-medium-emphasis" :lang="locale">
      {{ $t('trans.groupManagement.noGroups') }}
    </div>
    <div class="text-caption text-medium-emphasis mt-1" :lang="locale">
      {{ $t('trans.formMigration.noGroupsHint') }}
    </div>
  </div>

  <!-- Dual-panel picker -->
  <v-row v-else dense>
    <!-- Available panel -->
    <v-col cols="12" md="5">
      <div class="d-flex align-center mb-1">
        <span class="text-caption font-weight-bold" :lang="locale">
          {{ $t('trans.formMigration.availableGroupsLabel') }}
        </span>
        <v-chip size="x-small" class="ml-2" variant="tonal">
          {{ available.length }}
        </v-chip>
      </div>
      <v-sheet border rounded class="picker-panel">
        <v-text-field
          v-model="searchAvailable"
          density="compact"
          variant="plain"
          prepend-inner-icon="mdi:mdi-magnify"
          hide-details
          clearable
          class="px-2 pt-1"
          :placeholder="$t('trans.groupManagement.search')"
        />
        <v-divider />
        <div class="picker-list">
          <div
            v-if="filteredAvailable.length === 0"
            class="pa-3 text-caption text-medium-emphasis text-center"
            :lang="locale"
          >
            {{
              searchAvailable
                ? $t('trans.groupManagement.noSearchResults')
                : $t('trans.formMigration.allGroupsAssigned')
            }}
          </div>
          <template v-else>
            <v-list-item
              density="compact"
              class="select-all-row"
              @click="toggleSelectAllAvailable"
            >
              <template #prepend>
                <v-checkbox-btn
                  :model-value="allAvailableSelected"
                  :indeterminate="someAvailableSelected"
                  density="compact"
                  @click.stop="toggleSelectAllAvailable"
                />
              </template>
              <v-list-item-title
                class="text-caption text-medium-emphasis"
                :lang="locale"
              >
                {{ $t('trans.groupManagement.selectAll') }}
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item
              v-for="group in filteredAvailable"
              :key="group.id"
              density="compact"
              :class="{ 'form-admin-row': group.isFormAdmin }"
              @click="toggleAvailable(group.id)"
            >
              <template #prepend>
                <v-checkbox-btn
                  :model-value="selectedAvailable.includes(group.id)"
                  density="compact"
                  @click.stop="toggleAvailable(group.id)"
                />
              </template>
              <v-list-item-title class="text-body-2">
                {{ group.name }}
              </v-list-item-title>
              <template v-if="group.isFormAdmin" #append>
                <v-chip
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  :lang="locale"
                >
                  {{ $t('trans.formMigration.formAdminBadge') }}
                </v-chip>
              </template>
            </v-list-item>
          </template>
        </div>
      </v-sheet>
    </v-col>

    <!-- Arrow buttons -->
    <v-col cols="12" md="2" class="arrows-col">
      <v-tooltip :text="$t('trans.groupManagement.addSelected')" location="top">
        <template #activator="{ props: tip }">
          <v-btn
            v-bind="tip"
            :disabled="selectedAvailable.length === 0"
            icon
            size="small"
            variant="outlined"
            @click="addSelected"
          >
            <v-icon class="arrow-icon">mdi:mdi-chevron-right</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip :text="$t('trans.groupManagement.addAll')" location="top">
        <template #activator="{ props: tip }">
          <v-btn
            v-bind="tip"
            :disabled="available.length === 0"
            icon
            size="small"
            variant="outlined"
            @click="addAll"
          >
            <v-icon class="arrow-icon">mdi:mdi-chevron-double-right</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip
        :text="$t('trans.groupManagement.removeSelected')"
        location="top"
      >
        <template #activator="{ props: tip }">
          <v-btn
            v-bind="tip"
            :disabled="selectedAssigned.length === 0"
            icon
            size="small"
            variant="outlined"
            @click="removeSelected"
          >
            <v-icon class="arrow-icon">mdi:mdi-chevron-left</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip :text="$t('trans.groupManagement.removeAll')" location="top">
        <template #activator="{ props: tip }">
          <v-btn
            v-bind="tip"
            :disabled="assigned.length === 0"
            icon
            size="small"
            variant="outlined"
            @click="removeAll"
          >
            <v-icon class="arrow-icon">mdi:mdi-chevron-double-left</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </v-col>

    <!-- Assigned panel -->
    <v-col cols="12" md="5">
      <div class="d-flex align-center mb-1">
        <span class="text-caption font-weight-bold" :lang="locale">
          {{ $t('trans.formMigration.assignedGroupsLabel') }}
        </span>
        <v-chip size="x-small" class="ml-2" variant="tonal">
          {{ assigned.length }}
        </v-chip>
      </div>
      <v-sheet border rounded class="picker-panel">
        <v-text-field
          v-model="searchAssigned"
          density="compact"
          variant="plain"
          prepend-inner-icon="mdi:mdi-magnify"
          hide-details
          clearable
          class="px-2 pt-1"
          :placeholder="$t('trans.groupManagement.search')"
        />
        <v-divider />
        <div class="picker-list">
          <div
            v-if="filteredAssigned.length === 0"
            class="pa-3 text-caption text-medium-emphasis text-center"
            :lang="locale"
          >
            {{
              searchAssigned
                ? $t('trans.groupManagement.noSearchResults')
                : $t('trans.formMigration.noAssignedGroups')
            }}
          </div>
          <template v-else>
            <v-list-item
              density="compact"
              class="select-all-row"
              @click="toggleSelectAllAssigned"
            >
              <template #prepend>
                <v-checkbox-btn
                  :model-value="allAssignedSelected"
                  :indeterminate="someAssignedSelected"
                  density="compact"
                  @click.stop="toggleSelectAllAssigned"
                />
              </template>
              <v-list-item-title
                class="text-caption text-medium-emphasis"
                :lang="locale"
              >
                {{ $t('trans.groupManagement.selectAll') }}
              </v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item
              v-for="group in filteredAssigned"
              :key="group.id"
              density="compact"
              :class="{ 'form-admin-row': group.isFormAdmin }"
              @click="toggleAssigned(group.id)"
            >
              <template #prepend>
                <v-checkbox-btn
                  :model-value="selectedAssigned.includes(group.id)"
                  density="compact"
                  @click.stop="toggleAssigned(group.id)"
                />
              </template>
              <v-list-item-title class="text-body-2">
                {{ group.name }}
              </v-list-item-title>
              <template v-if="group.isFormAdmin" #append>
                <v-chip
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  :lang="locale"
                >
                  {{ $t('trans.formMigration.formAdminBadge') }}
                </v-chip>
              </template>
            </v-list-item>
          </template>
        </div>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<style scoped>
.picker-panel {
  min-height: 80px;
  max-height: 260px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.picker-list {
  flex: 1;
  overflow-y: auto;
}

.form-admin-row {
  background: rgb(var(--v-theme-primary), 0.04);
}

.select-all-row {
  background: rgb(var(--v-theme-surface-variant), 0.3);
}

/* Arrow button column: vertical stack centered on md+, horizontal row on mobile */
.arrows-col {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 8px;
  padding-bottom: 8px;
}

@media (min-width: 960px) {
  .arrows-col {
    flex-direction: column;
    padding-top: 0;
    padding-bottom: 0;
  }

  /* On md+ the chevrons rotate 0deg (left/right meaning make sense in vertical stack) */
  /* On mobile (row layout) we rotate them 90deg so "add" points down toward assigned panel */
  .arrow-icon {
    transition: transform 0.15s ease;
  }
}

@media (max-width: 959px) {
  .arrow-icon {
    transform: rotate(90deg);
  }
}
</style>
