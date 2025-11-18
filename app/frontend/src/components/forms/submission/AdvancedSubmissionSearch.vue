<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';

/**
 * Props:
 * - modelValue: controls open/close externally
 * - formFields: array of objects, e.g. [{ label: 'Form Name', value: 'name' }]
 * - location: 'right' or 'left' (defaults to right)
 */
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  formFields: {
    type: Array,
    required: true,
  },
  location: {
    type: String,
    default: 'right',
  },
});

const emit = defineEmits(['update:modelValue', 'search']);

const isOpen = ref(props.modelValue);
const searchQuery = ref('');
const selectedFields = ref([]);

watch(
  () => props.modelValue,
  (val) => {
    isOpen.value = val;
  }
);

watch(isOpen, (val) => {
  emit('update:modelValue', val);
});

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

function emitSearch() {
  emit('search', {
    value: searchQuery.value,
    fields: selectedFields.value,
  });
  closeDrawer();
}
</script>

<template>
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

      <v-divider></v-divider>

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

        <!-- Active Field Chips -->
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
        <v-btn color="primary" class="mt-4" block @click="emitSearch">
          Apply Search
        </v-btn>
      </v-card-text>
    </v-card>
  </v-navigation-drawer>
</template>
