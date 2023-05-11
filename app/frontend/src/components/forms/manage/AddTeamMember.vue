<!-- eslint-disable vue/no-v-model-argument -->
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
              :items="items"
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
              <template v-slot:no-data>
                <div class="px-2">
                  Can't find someone? They may not have logged into CHEFS.<br />
                  Kindly send them a link to CHEFS and ask them to log in.
                </div>
              </template>
              <template v-slot:chip="{ props, item }">
                <v-chip v-bind="props" :text="item?.raw?.fullName"></v-chip>
              </template>

              <!-- users found in dropdown -->
              <template v-slot:item="{ props, item }">
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
            <span class="text-red"
              >You must select at least one role to add this user.</span
            >
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
            @click="addingUsers = true"
          >
            <v-icon>person_add</v-icon>
          </v-btn>
        </template>
        <span>Add a New Member</span>
      </v-tooltip>
    </span>
  </span>
</template>

<script>
import { mapGetters } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import { FormRoleCodes, IdentityProviders, Regex } from '@src/utils/constants';
import userService from '@src/services/userService';

export default {
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['new-users', 'adding-users'],
  data() {
    return {
      addingUsers: false,
      isLoading: false,
      model: null,
      searchUsers: null,
      selectedIdp: IdentityProviders.IDIR,
      selectedRoles: [],
      showError: false,
      entries: [],
    };
  },
  computed: {
    ...mapFields('form', ['form.idps']),
    ...mapGetters('auth', ['identityProvider']),
    ID_PROVIDERS() {
      return IdentityProviders;
    },
    FORM_ROLES() {
      if (this.selectedIdp === IdentityProviders.BCEIDBASIC)
        return Object.values(FormRoleCodes).filter(
          (frc) => frc === FormRoleCodes.FORM_SUBMITTER
        );
      else if (this.selectedIdp === IdentityProviders.BCEIDBUSINESS)
        return Object.values(FormRoleCodes)
          .filter(
            (frc) =>
              frc != FormRoleCodes.OWNER && frc != FormRoleCodes.FORM_DESIGNER
          )
          .sort();
      return Object.values(FormRoleCodes).sort();
    },
    autocompleteLabel() {
      return this.selectedIdp == IdentityProviders.IDIR
        ? 'Enter a name, e-mail, or username'
        : 'Enter an exact e-mail or username';
    },
    items() {
      return this.entries;
    },
  },
  watch: {
    selectedIdp(newIdp, oldIdp) {
      if (newIdp !== oldIdp) {
        this.entries = [];
        this.showError = false;
      }
    },
    selectedRoles(newRoles, oldRoles) {
      if (oldRoles.length === 0 && newRoles.length > 0) {
        this.showError = false;
      }
    },
    addingUsers() {
      this.$emit('adding-users', this.addingUsers);
    },
    // Get a list of user objects from database
    async searchUsers(input) {
      if (!input) return;
      this.isLoading = true;
      try {
        let params = {};
        params.idpCode = this.selectedIdp;
        if (
          this.selectedIdp == IdentityProviders.BCEIDBASIC ||
          this.selectedIdp == IdentityProviders.BCEIDBUSINESS
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
        this.entries = response.data;
      } catch (error) {
        this.entries = [];
        console.error(`Error getting users: ${error}`); // eslint-disable-line no-console
      } finally {
        this.isLoading = false;
      }
    },
  },
  methods: {
    // show users in dropdown that have a text match on multiple properties
    filterObject(item, queryText) {
      return Object.values(item)
        .filter((v) => v)
        .some((v) =>
          v.toLocaleLowerCase().includes(queryText.toLocaleLowerCase())
        );
    },
    save() {
      if (this.selectedRoles.length === 0) {
        this.showError = true;
        return;
      }
      this.showError = false;
      // emit user (object) to the parent component
      this.$emit('new-users', [this.model], this.selectedRoles);
      // reset search field
      this.model = null;
      this.addingUsers = false;
    },
  },
};
</script>

<style scoped>
.v-radio :deep(label),
.v-radio :deep(i.v-icon) {
  color: white !important;
  font-weight: bold;
}
</style>
