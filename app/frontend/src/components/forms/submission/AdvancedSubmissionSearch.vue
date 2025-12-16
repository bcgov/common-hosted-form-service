<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  formFields: { type: Array, required: true },
  location: { type: String, default: 'right' },

  // Optional: customize the open button text
  buttonLabel: { type: String, default: 'Advanced Search' },

  // NEW: show summary chips outside the drawer
  showSearchChips: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue', 'search']);

const isOpen = ref(props.modelValue);

// Drawer state
const searchQuery = ref('');
const selectedFields = ref([]);

// NEW: “applied” search state for chips (so chips reflect what was applied)
const appliedQuery = ref('');
const appliedFields = ref([]);

// Sync v-model <-> internal drawer state
watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);

watch(isOpen, (val) => emit('update:modelValue', val));

function openDrawer() {
  isOpen.value = true;
}

function closeDrawer() {
  isOpen.value = false;
}

function removeField(field) {
  selectedFields.value = selectedFields.value.filter((f) => f !== field);
}

function getLabel(value) {
  const match = props.formFields.find((f) => f.value === value);
  return match ? match.label : value;
}

/**
 * Build “summary chips” for the applied search:
 * - if fields exist: one chip per field: "Field Label: term"
 * - if no fields but term exists: one chip: "Any field: term"
 * - if term empty but fields exist: chips "Field Label" (field-only filter)
 */
const hasAppliedTerm = computed(() => {
  return Boolean((appliedQuery.value ?? '').trim());
});

const appliedFieldChips = computed(() => {
  return (appliedFields.value || []).map((f) => ({
    key: `field:${f}`,
    field: f,
    label: getLabel(f),
  }));
});

function emitSearchAndApply() {
  const payload = {
    value: searchQuery.value,
    fields: selectedFields.value,
  };

  // Update applied state (chips reflect “applied” search, not “in-progress” edits)
  appliedQuery.value = payload.value;
  appliedFields.value = [...payload.fields];

  emit('search', payload);
  closeDrawer();
}

function removeAppliedTerm() {
  appliedQuery.value = '';
  searchQuery.value = '';

  emit('search', {
    value: '',
    fields: appliedFields.value,
  });
}

function removeAppliedField(field) {
  appliedFields.value = appliedFields.value.filter((f) => f !== field);
  selectedFields.value = [...appliedFields.value];

  emit('search', {
    value: appliedQuery.value,
    fields: appliedFields.value,
  });
}

function clearAllApplied() {
  appliedQuery.value = '';
  appliedFields.value = [];
  searchQuery.value = '';
  selectedFields.value = [];

  emit('search', { value: '', fields: [] });
}
</script>

<template>
  <div class="d-flex align-center flex-wrap ga-2">
    <!-- Open button -->
    <v-btn
      class="md-ml-2 mt-1"
      prepend-icon="mdi:mdi-magnify"
      variant="text"
      no-caps
      @click="openDrawer"
    >
      {{ buttonLabel }}
    </v-btn>

    <!-- NEW: Applied search chips -->
    <template v-if="showSearchChips">
      <!-- Search term chip -->
      <v-chip
        v-if="hasAppliedTerm"
        closable
        class="ma-1"
        color="primary"
        variant="outlined"
        @click:close="removeAppliedTerm"
      >
        Search: "{{ appliedQuery }}"
      </v-chip>

      <!-- Field chips -->
      <v-chip
        v-for="chip in appliedFieldChips"
        :key="chip.key"
        closable
        class="ma-1"
        color="primary"
        variant="outlined"
        @click:close="removeAppliedField(chip.field)"
      >
        Field: {{ chip.label }}
      </v-chip>

      <!-- Clear all -->
      <v-btn
        v-if="hasAppliedTerm || appliedFieldChips.length"
        variant="text"
        density="compact"
        class="ml-1"
        @click="clearAllApplied"
      >
        Clear
      </v-btn>
    </template>
    <!-- Drawer -->
    <v-navigation-drawer
      v-model="isOpen"
      :location="location"
      temporary
      width="400"
    >
      <v-card flat>
        <v-card-title class="text-h6 d-flex justify-space-between align-center">
          Advanced Search
          <v-btn icon="mdi:mdi-close" variant="text" @click="closeDrawer" />
        </v-card-title>

        <v-divider />

        <v-card-text>
          <!-- Search Input -->
          <v-text-field
            v-model="searchQuery"
            label="Search term"
            prepend-inner-icon="mdi:mdi-magnify"
            clearable
            class="mb-3"
          />

          <!-- Field Selection -->
          <v-select
            v-model="selectedFields"
            :items="formFields"
            label="Search in fields"
            multiple
            chips
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi:mdi-filter-variant"
            variant="outlined"
            class="mb-3"
            :menu-props="{ maxHeight: 300 }"
          />

          <!-- Active Field Chips (in-drawer selection) -->
          <div class="d-flex flex-wrap">
            <v-chip
              v-for="field in selectedFields"
              :key="field"
              closable
              @click:close="removeField(field)"
              class="ma-1"
              color="primary"
              variant="outlined"
            >
              {{ getLabel(field) }}
            </v-chip>
          </div>

          <!-- Search Button -->
          <v-btn color="primary" class="mt-4" block @click="emitSearchAndApply">
            Apply Search
          </v-btn>
        </v-card-text>
      </v-card>
    </v-navigation-drawer>
  </div>
</template>
