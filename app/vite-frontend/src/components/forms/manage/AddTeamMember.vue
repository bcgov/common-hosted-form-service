<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import userService from '~/services/userService';
import { FormRoleCodes, IdentityProviders, Regex } from '~/utils/constants';

const addingUsers = ref(false);
const isLoading = ref(false);
const model = ref(null);
const searchUsers = ref(null);
const selectedIdp = ref(IdentityProviders.IDIR);
const selectedRoles = ref([]);
const showError = ref(false);
const entries = ref([]);

const { t } = useI18n({ useScope: 'global' });

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(['new-users', 'adding-users']);

const ID_PROVIDERS = computed(() => IdentityProviders);
const FORM_ROLES = computed(() => {
  if (selectedIdp.value === IdentityProviders.BCEIDBASIC)
    return Object.values(FormRoleCodes).filter(
      (frc) => frc === FormRoleCodes.FORM_SUBMITTER
    );
  else if (selectedIdp.value === IdentityProviders.BCEIDBUSINESS)
    return Object.values(FormRoleCodes)
      .filter(
        (frc) =>
          frc != FormRoleCodes.OWNER && frc != FormRoleCodes.FORM_DESIGNER
      )
      .sort();
  return Object.values(FormRoleCodes).sort();
});
const autocompleteLabel = computed(() =>
  selectedIdp.value == IdentityProviders.IDIR
    ? t('trans.addTeamMember.enterUsername')
    : t('trans.addTeamMember.enterExactUsername')
);

watch(selectedIdp, (newIdp, oldIdp) => {
  if (newIdp !== oldIdp) {
    entries.value = [];
    showError.value = false;
  }
});

watch(selectedRoles, (newRoles, oldRoles) => {
  if (newRoles !== oldRoles) {
    entries.value = [];
    showError.value = false;
  }
});

watch(addingUsers, () => {
  emits('adding-users', addingUsers.value);
});

watch(searchUsers, async (input) => {
  if (!input) return;
  isLoading.value = true;
  try {
    let params = {};
    params.idpCode = selectedIdp.value;
    if (
      selectedIdp.value == IdentityProviders.BCEIDBASIC ||
      selectedIdp.value == IdentityProviders.BCEIDBUSINESS
    ) {
      if (input.length < 6)
        throw new Error(
          'Search input for BCeID username/email must be greater than 6 characters.'
        );
      if (input.includes('@')) {
        if (!new RegExp(Regex.EMAIL).test(input))
          throw new Error('Email searches for BCeID must be exact.');
        else params.email = input;
      } else {
        params.username = input;
      }
    } else {
      params.search = input;
    }
    const response = await userService.getUsers(params);
    entries.value = response.data;
  } catch (error) {
    entries.value = [];
    console.error(`Error getting users: ${error}`); // eslint-disable-line no-console
  } finally {
    isLoading.value = false;
  }
});

// show users in dropdown that have a text match on multiple properties
function filterObject(item, queryText) {
  return Object.values(item)
    .filter((v) => v)
    .some((v) => v.toLocaleLowerCase().includes(queryText.toLocaleLowerCase()));
}

function save() {
  if (selectedRoles.value.length === 0) {
    showError.value = true;
    return;
  }
  showError.value = false;
  // emit user (object) to the parent component
  emits('new-users', [model.value], selectedRoles.value);
  // reset search field
  model.value = null;
  addingUsers.value = false;
}
</script>

<template>
  <span>
    <span v-if="addingUsers" style="margin-right: 656px" elevation="1">
      <v-sheet
        elevation="1"
        class="float-right"
        position="absolute"
        style="width: 669px"
      >
        <v-sheet style="background-color: #38598a" elevation="1">
          <v-row justify="center" align="center">
            <v-col cols="12" sm="12">
              <v-radio-group
                v-model="selectedIdp"
                class="ml-3 my-0"
                row
                density="compact"
                fluid
                hide-details
              >
                <v-radio class="my-0" label="IDIR" :value="ID_PROVIDERS.IDIR" />
                <v-radio label="Basic BCeID" :value="ID_PROVIDERS.BCEIDBASIC" />
                <v-radio
                  label="Business BCeID"
                  :value="ID_PROVIDERS.BCEIDBUSINESS"
                />
              </v-radio-group>
            </v-col>
          </v-row>
        </v-sheet>
        <v-row class="p-3">
          <v-col cols="12">
            <v-autocomplete
              v-model="model"
              v-model:search="searchUsers"
              :items="entries"
              chips
              closable-chips
              clearable
              item-title="fullName"
              density="compact"
              :custom-filter="filterObject"
              hide-details
              :label="autocompleteLabel"
              :loading="isLoading"
              return-object
            >
              <!-- no data -->
              <template #no-data>
                <div
                  class="px-2"
                  v-html="$t('trans.addTeamMember.cantFindChefsUsers')"
                ></div>
              </template>
              <template #chip="{ props, item }">
                <v-chip v-bind="props" :text="item?.raw?.fullName"></v-chip>
              </template>

              <!-- users found in dropdown -->
              <template #item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="`${item?.raw?.fullName} (${item?.raw?.email})`"
                  :subtitle="`${item?.raw?.username} (${item?.raw?.idpCode})`"
                >
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>
        <v-row class="my-0">
          <v-col cols="12" class="py-0">
            <v-chip-group
              v-model="selectedRoles"
              multiple
              selected-class="text-primary"
              fluid
              column
              class="py-0 mx-3"
              return-object
            >
              <v-chip
                v-for="role in FORM_ROLES"
                :key="role"
                :value="role"
                filter
                variant="outlined"
              >
                {{ role }}
              </v-chip>
            </v-chip-group>
          </v-col>
        </v-row>
        <v-row class="pl-1 my-0">
          <v-col cols="auto">
            <!-- buttons -->
            <v-btn
              color="primary"
              class="ml-2"
              :disabled="!model"
              :loading="isLoading"
              @click="save"
            >
              <span>Add</span>
            </v-btn>
            <v-btn
              variant="outlined"
              class="ml-2"
              @click="
                addingUsers = false;
                showError = false;
              "
            >
              <span>Cancel</span>
            </v-btn>
          </v-col>
        </v-row>
        <v-row v-if="showError" class="px-4 my-0 py-0">
          <v-col class="text-left">
            <span class="text-red">{{
              $t('trans.addTeamMember.mustSelectAUser')
            }}</span>
          </v-col>
        </v-row>
      </v-sheet>
    </span>
    <span v-else>
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            class="mx-1"
            color="primary"
            :disabled="disabled"
            icon
            v-bind="props"
            size="small"
            @click="addingUsers = true"
          >
            <v-icon icon="mdi:mdi-account-plus"></v-icon>
          </v-btn>
        </template>
        <span>{{ $t('trans.addTeamMember.addNewMember') }}</span>
      </v-tooltip>
    </span>
  </span>
</template>

<style scoped>
.v-radio :deep(label),
.v-radio :deep(i.v-icon) {
  color: white !important;
  font-weight: bold;
}
</style>
