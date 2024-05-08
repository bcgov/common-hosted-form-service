<script>
import _ from 'lodash';
import { mapState, mapActions } from 'pinia';
import { i18n } from '~/internationalization';

import userService from '~/services/userService';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { Regex } from '~/utils/constants';

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
      selectedIdp: null,
      selectedRoles: [],
      showError: false,
      entries: [],
      debounceSearch: _.debounce(this.searchUsers, 250),
    };
  },
  computed: {
    ...mapState(useAuthStore, ['identityProvider']),
    ...mapState(useFormStore, ['form', 'isRTL', 'lang']),
    ...mapState(useIdpStore, ['loginButtons', 'primaryIdp']),
    FORM_ROLES() {
      const idpRoles = this.listRoles(this.selectedIdp);
      return Object.values(idpRoles).sort();
    },
    autocompleteLabel() {
      return this.isPrimary(this.selectedIdp)
        ? i18n.t('trans.addTeamMember.enterUsername')
        : i18n.t('trans.addTeamMember.enterExactUsername');
    },
  },
  watch: {
    search(val) {
      if (val && val !== this.model) {
        this.debounceSearch(val);
      }

      if (!val) {
        this.entries = [];
      }
    },
    selectedIdp(newIdp, oldIdp) {
      if (newIdp !== oldIdp) {
        this.selectedRoles = [];
        this.model = null;
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
  created() {
    this.initializeSelectedIdp();
  },
  methods: {
    ...mapActions(useIdpStore, [
      'isPrimary',
      'listRoles',
      'teamMembershipSearch',
    ]),
    // workaround so we can use computed value (primaryIdp) in created()
    initializeSelectedIdp() {
      this.selectedIdp = this.primaryIdp?.code;
    },
    // show users in dropdown that have a text match on multiple properties
    filterObject(_itemTitle, queryText, item) {
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
        let teamMembershipConfig = this.teamMembershipSearch(this.selectedIdp);
        if (teamMembershipConfig) {
          if (input.length < teamMembershipConfig.text.minLength)
            throw new Error(i18n.t(teamMembershipConfig.text.message));
          if (input.includes('@')) {
            if (!new RegExp(Regex.EMAIL).test(input))
              throw new Error(i18n.t(teamMembershipConfig.email.message));
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
        /* eslint-disable no-console */
        console.error(
          i18n.t('trans.manageSubmissionUsers.getUsersErrMsg', {
            error: error,
          })
        ); // eslint-disable-line no-console
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
