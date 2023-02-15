<template>
  <span>
    <span v-if="addingUsers" class="d-flex justify-end">
      <BaseDialog
        v-model="addingUsers"
        @close-dialog="(addingUsers = false)"
      >
        <template #title>
          Add Team Member
        </template>
        <template #text>
          <p>Identity Provider</p>
          <v-radio-group
            class="my-0"
            v-model="selectedIdp"
          >
            <v-radio class="mx-2" label="IDIR" :value="ID_PROVIDERS.IDIR" default/>
            <v-radio class="mx-2" label="Basic BCeID" :value="ID_PROVIDERS.BCEIDBASIC"/>
            <v-radio class="mx-2" label="Business BCeID" :value="ID_PROVIDERS.BCEIDBUSINESS"/>
          </v-radio-group>
          <div>
            <p>Default Roles</p>
            <v-checkbox
              v-model="selectedRoles"
              label="Owner"
              :value="FORM_ROLE_CODES.OWNER"
            ></v-checkbox>
            <v-checkbox
              v-model="selectedRoles"
              label="Team Manager"
              :value="FORM_ROLE_CODES.TEAM_MANAGER"
            ></v-checkbox>
            <v-checkbox
              v-model="selectedRoles"
              label="Form Designer"
              :value="FORM_ROLE_CODES.FORM_DESIGNER"
            ></v-checkbox>
            <v-checkbox
              v-model="selectedRoles"
              label="Reviewer"
              :value="FORM_ROLE_CODES.SUBMISSION_REVIEWER"
            ></v-checkbox>
            <v-checkbox
              v-model="selectedRoles"
              label="Submitter"
              :value="FORM_ROLE_CODES.FORM_SUBMITTER"
            ></v-checkbox>
          </div>
          <v-container>
            <v-row>
              <v-autocomplete
                autocomplete="autocomplete_off"
                v-model="model"
                clearable
                dense
                :filter="filterObject"
                hide-details
                :items="items"
                label="Enter a name, email, or IDIR"
                :loading="isLoading"
                return-object
                :search-input.sync="searchUsers"
              >
                <!-- no data -->
                <template #no-data>
                  <div class="px-2">
                    Can't find someone? They may not have joined the site.<br />
                    Kindly send them a link to the site and ask them to log in.
                  </div>
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
            </v-row>
            <v-row>
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
              <v-btn outlined class="ml-2" @click="addingUsers = false">
                <span>Cancel</span>
              </v-btn>
            </v-row>
          </v-container>
        </template>
      </BaseDialog>
    </span>
    <span>
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
        <span>Add a New Member</span>
      </v-tooltip>
    </span>
  </span>
</template>

<script>
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
      // emit user (object) to the parent component
      this.$emit('new-users', [this.model], this.selectedRoles);
      // reset search field
      this.model = null;
      this.addingUsers = false;
    },
  },
  computed: {
    ...mapFields('form', [
      'form.idps'
    ]),
    ID_PROVIDERS() {
      return IdentityProviders;
    },
    FORM_ROLE_CODES() {
      return FormRoleCodes;
    }
  },
  watch: {
    selectedIdp(newIdp, oldIdp) {
      if (newIdp !== oldIdp) {
        this.items = [];
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
        if (this.selectedIdp == IdentityProviders.BCEIDBASIC || this.selectedIdp == IdentityProviders.BCEIDBUSINESS) {
          if (input.length < 6) throw new Error('Search input for BCeID username/email must be greater than 6 characters.');
          if (input.includes('@')) {
            if (!(new RegExp(Regex.EMAIL).test(input)))
              throw new Error('Email searches for BCeID must be exact.');
            else
              params.email = input;
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
        console.error(`Error getting users: ${error}`); // eslint-disable-line no-console
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>
