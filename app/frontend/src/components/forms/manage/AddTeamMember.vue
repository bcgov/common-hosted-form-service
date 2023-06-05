<template>
  <span>
    <span v-if="addingUsers" style="margin-right: 656px" elevation="1">
      <v-sheet
        elevation="1"
        class="float-right"
        style="position: absolute; width: 669px"
      >
        <v-sheet style="background-color: #38598a" elevation="1">
          <v-row justify="center" align="center">
            <v-col cols="12" sm="12">
              <v-radio-group
                class="ml-3 my-0"
                v-model="selectedIdp"
                row
                dense
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
              autocomplete="autocomplete_off"
              v-model="model"
              clearable
              dense
              :filter="filterObject"
              hide-details
              :items="items"
              :label="autocompleteLabel"
              :loading="isLoading"
              return-object
              :search-input.sync="searchUsers"
            >
              <!-- no data -->
              <template #no-data>
                <div
                  class="px-2"
                  v-html="$t('trans.addTeamMember.cantFindChefsUsers')"
                ></div>
              </template>
              <!-- selected user -->
              <template #selection="data">
                <span
                  v-bind="data.attrs"
                  :input-value="data.selected"
                  close
                  @click="data.select"
                >
                  {{ data.item.fullName }}
                </span>
              </template>
              <!-- users found in dropdown -->
              <template #item="data">
                <template v-if="typeof data.item !== 'object'">
                  <v-list-item-content v-text="data.item" />
                </template>
                <template v-else>
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ data.item.fullName }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ data.item.username }} ({{ data.item.idpCode }})
                    </v-list-item-subtitle>
                    <v-list-item-subtitle>
                      {{ data.item.email }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
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
              active-class="primary--text"
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
                outlined
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
              outlined
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
            <span class="red--text">{{
              $t('trans.addTeamMember.mustSelectAUser')
            }}</span>
          </v-col>
        </v-row>
      </v-sheet>
    </span>
    <span v-else>
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            class="mx-1"
            @click="addingUsers = true"
            color="primary"
            :disabled="disabled"
            icon
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>person_add</v-icon>
          </v-btn>
        </template>
        <span>{{ $t('trans.addTeamMember.addNewMember') }}</span>
      </v-tooltip>
    </span>
  </span>
</template>

<script>
import { mapGetters } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import { FormRoleCodes, IdentityProviders, Regex } from '@/utils/constants';
import { userService } from '@/services';

export default {
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      addingUsers: false,
      isLoading: false,
      items: [],
      model: null,
      searchUsers: null,
      selectedIdp: IdentityProviders.IDIR,
      selectedRoles: [],
      showError: false,
    };
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
        ? this.$t('trans.addTeamMember.enterUsername')
        : this.$t('trans.addTeamMember.enterExactUsername');
    },
  },
  watch: {
    selectedIdp(newIdp, oldIdp) {
      if (newIdp !== oldIdp) {
        this.items = [];
        this.model = null;
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
              this.$t('trans.addTeamMember.BCeIDInputSearchMaxLen')
            );
          if (input.includes('@')) {
            if (!new RegExp(Regex.EMAIL).test(input))
              throw new Error(this.$t('trans.addTeamMember.BCeIDMustBeExact'));
            else params.email = input;
          } else {
            params.username = input;
          }
        } else {
          params.search = input;
        }
        const response = await userService.getUsers(params);
        this.items = response.data;
      } catch (error) {
        this.items = [];
        /* eslint-disable no-console */
        console.error(
          this.$t('trans.addTeamMember.errorGettingUsers', { error: error })
        ); // eslint-disable-line no-console
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.v-radio >>> label,
.v-radio >>> i.v-icon {
  color: white !important;
  font-weight: bold;
}
</style>
