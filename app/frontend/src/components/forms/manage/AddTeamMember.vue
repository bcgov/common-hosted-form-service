<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import userService from '~/services/userService';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { Regex } from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['new-users', 'adding-users']);

const idpStore = useIdpStore();

const debounceTime = 250;
let debounceTimer = null;
const addingUsers = ref(false);
const isLoading = ref(false);
const model = ref(null);
const search = ref(null);
const selectedIdp = ref(null);
const selectedRoles = ref([]);
const showError = ref(false);
const entries = ref([]);

const { isRTL } = storeToRefs(useFormStore());
const { loginButtons, primaryIdp } = storeToRefs(idpStore);

const FORM_ROLES = computed(() => {
  const idpRoles = idpStore.listRoles(selectedIdp.value);
  return Object.values(idpRoles).sort();
});

const autocompleteLabel = computed(() => {
  return idpStore.isPrimary(selectedIdp.value)
    ? t('trans.addTeamMember.enterUsername')
    : t('trans.addTeamMember.enterExactUsername');
});

watch(selectedIdp, (newIdp, oldIdp) => {
  if (newIdp !== oldIdp) {
    selectedRoles.value = [];
    model.value = null;
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
  emit('adding-users', addingUsers.value);
});

initializeSelectedIdp();

onBeforeUnmount(() => {
  clearTimeout(debounceTimer);
});

// workaround so we can use computed value (primaryIdp) in created()
function initializeSelectedIdp() {
  selectedIdp.value = primaryIdp.value?.code;
}

// show users in dropdown that have a text match on multiple properties
function filterObject(_itemTitle, queryText, item) {
  return Object.values(item)
    .filter((v) => v)
    .some((v) => {
      if (typeof v === 'string')
        return v.toLowerCase().includes(queryText.toLowerCase());
      else {
        return Object.values(v).some(
          (nestedValue) =>
            typeof nestedValue === 'string' &&
            nestedValue.toLowerCase().includes(queryText.toLowerCase())
        );
      }
    });
}

function save() {
  if (selectedRoles.value.length === 0) {
    showError.value = true;
    return;
  }
  showError.value = false;
  // emit user (object) to the parent component
  emit('new-users', [model.value], selectedRoles.value);
  // reset search field
  model.value = null;
  addingUsers.value = false;
}

function debounceSearch(input) {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    searchUsers(input);
  }, debounceTime);
}

async function searchUsers(input) {
  if (!input) {
    entries.value = [];
    return;
  }
  if (input === model.value) {
    return;
  }
  isLoading.value = true;
  try {
    let params = {};
    params.idpCode = selectedIdp.value;
    let teamMembershipConfig = idpStore.teamMembershipSearch(selectedIdp.value);
    if (teamMembershipConfig) {
      if (input.length < teamMembershipConfig.text.minLength)
        throw new Error(t(teamMembershipConfig.text.message));
      if (input.includes('@')) {
        if (!new RegExp(Regex.EMAIL).test(input))
          throw new Error(t(teamMembershipConfig.email.message));
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
    /* eslint-disable no-console */
    console.error(
      t('trans.manageSubmissionUsers.getUsersErrMsg', {
        error: error,
      })
    );
  } finally {
    isLoading.value = false;
  }
}

defineExpose({
  addingUsers,
  debounceSearch,
  debounceTime,
  debounceTimer,
  emit,
  filterObject,
  model,
  save,
  search,
  searchUsers,
  selectedIdp,
  selectedRoles,
  showError,
});
</script>

/* c8 ignore start */
<template>
  <span :class="{ 'dir-rtl': isRTL }">
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
                <v-radio
                  v-for="button in loginButtons"
                  :key="button.code"
                  :value="button.code"
                  :label="button.display"
                />
              </v-radio-group>
            </v-col>
          </v-row>
        </v-sheet>
        <v-row class="p-3">
          <v-col cols="12">
            <v-autocomplete
              v-model="model"
              v-model:search="search"
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
              :class="{ label: isRTL }"
              @update:search="debounceSearch"
            >
              <!-- no data -->
              <template #no-data>
                <div
                  class="px-2"
                  :class="{ 'text-right': isRTL }"
                  :lang="locale"
                  v-html="$t('trans.addTeamMember.cantFindChefsUsers')"
                ></div>
              </template>
              <!-- selected user -->
              <template #chip="{ props, item }">
                <v-chip v-bind="props" :text="item?.raw?.fullName"></v-chip>
              </template>

              <!-- users found in dropdown -->
              <template #item="{ props, item }">
                <template v-if="typeof item !== 'object'">
                  <v-list-item v-bind="props" :title="item" />
                </template>
                <template v-else>
                  <v-list-item
                    v-bind="props"
                    :title="`${item?.raw?.fullName} (${item?.raw?.email})`"
                    :subtitle="`${item?.raw?.username} (${item?.raw?.idpCode})`"
                  />
                </template>
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
              :class="isRTL ? 'mr-3' : 'ml-3'"
              :disabled="!model"
              :loading="isLoading"
              :title="$t('trans.addTeamMember.add')"
              @click="save"
            >
              <span :lang="locale">{{ $t('trans.addTeamMember.add') }}</span>
            </v-btn>
            <v-btn
              variant="outlined"
              :class="isRTL ? 'mr-3' : 'ml-3'"
              :title="$t('trans.addTeamMember.cancel')"
              @click="
                addingUsers = false;
                showError = false;
              "
            >
              <span :lang="locale">{{ $t('trans.addTeamMember.cancel') }}</span>
            </v-btn>
          </v-col>
        </v-row>
        <v-row v-if="showError" class="px-4 my-0 py-0">
          <v-col class="text-left">
            <span class="text-red" :lang="locale">{{
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
            size="x-small"
            :title="$t('trans.addTeamMember.addNewMember')"
            @click="addingUsers = true"
          >
            <v-icon icon="mdi:mdi-account-plus"></v-icon>
          </v-btn>
        </template>
        <span :lang="locale">{{ $t('trans.addTeamMember.addNewMember') }}</span>
      </v-tooltip>
    </span>
  </span>
</template>
/* c8 ignore end */

<style scoped>
.v-radio :deep(label),
.v-radio :deep(i.v-icon) {
  color: white !important;
  font-weight: bold;
}
</style>
