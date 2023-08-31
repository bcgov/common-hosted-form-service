<script>
import { mapState } from 'pinia';
import { i18n } from '~/internationalization';

import userService from '~/services/userService';
import { FormRoleCodes, IdentityProviders, Regex } from '~/utils/constants';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

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
      search: null,
      selectedIdp: IdentityProviders.IDIR,
      selectedRoles: [],
      showError: false,
      entries: [],
    };
  },
  computed: {
    ...mapState(useAuthStore, ['identityProvider']),
    ...mapState(useFormStore, ['form', 'isRTL', 'lang']),
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
        ? i18n.t('trans.addTeamMember.enterUsername')
        : i18n.t('trans.addTeamMember.enterExactUsername');
    },
  },
  watch: {
    search(val) {
      if (val && val !== this.model) {
        this.searchUsers(val);
      }

      if (!val) {
        this.entries = [];
      }
    },
    selectedIdp(newIdp, oldIdp) {
      if (newIdp !== oldIdp) {
        this.entries = [];
        this.showError = false;
      }
    },
    selectedRoles(newRoles, oldRoles) {
      if (newRoles !== oldRoles) {
        this.entries = [];
        this.showError = false;
      }
    },

    addingUsers() {
      this.$emit('adding-users', this.addingUsers);
    },
  },
  methods: {
    // show users in dropdown that have a text match on multiple properties
    filterObject(_itemTitle, queryText, item) {
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
};
</script>

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
            >
              <!-- no data -->
              <template #no-data>
                <div
                  class="px-2"
                  :class="{ 'text-right': isRTL }"
                  :lang="lang"
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
              @click="save"
            >
              <span :lang="lang">{{ $t('trans.addTeamMember.add') }}</span>
            </v-btn>
            <v-btn
              variant="outlined"
              :class="isRTL ? 'mr-2' : 'ml-2'"
              @click="
                addingUsers = false;
                showError = false;
              "
            >
              <span :lang="lang">{{ $t('trans.addTeamMember.cancel') }}</span>
            </v-btn>
          </v-col>
        </v-row>
        <v-row v-if="showError" class="px-4 my-0 py-0">
          <v-col class="text-left">
            <span class="text-red" :lang="lang">{{
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
            @click="addingUsers = true"
          >
            <v-icon icon="mdi:mdi-account-plus"></v-icon>
          </v-btn>
        </template>
        <span :lang="lang">{{ $t('trans.addTeamMember.addNewMember') }}</span>
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
