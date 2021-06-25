<template>
  <span>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          color="primary"
          @click="dialog = true"
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>person_add</v-icon>
        </v-btn>
      </template>
      <span>Add Team Member</span>
    </v-tooltip>
    <v-dialog v-model="dialog" width="600">
      <v-card>
        <v-card-title class="headline pb-0">
          Manage Team Members For This Submission
        </v-card-title>
        <v-card-text>
          <hr />
          <v-row>
            <v-col cols="9">
              <form autocomplete="off">
                <v-autocomplete
                  v-model="userSearchSelection"
                  clearable
                  dense
                  :filter="filterObject"
                  hide-details
                  :items="userSearchResults"
                  label="Enter a name, e-mail, or username"
                  :loading="isLoadingDropdown"
                  return-object
                  :search-input.sync="findUsers"
                >
                  <!-- no data -->
                  <template #no-data>
                    <div class="px-2">
                      Can't find someone? They may not have joined the site.<br />
                      Kindly send them a link to the site and ask them to log
                      in.
                    </div>
                  </template>
                  <!-- selected user -->
                  <template #selection="data">
                    <span
                      v-bind="data.attrs"
                      :input-value="data.selected"
                      close
                      @click="data.select"
                      @click:close="remove(data.item)"
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
                        <v-list-item-title v-html="data.item.fullName" />
                        <v-list-item-subtitle v-html="data.item.username" />
                        <v-list-item-subtitle v-html="data.item.email" />
                      </v-list-item-content>
                    </template>
                  </template>
                </v-autocomplete>
              </form>
            </v-col>
            <v-col cols="3">
              <v-btn
                color="primary"
                class="ml-2"
                :disabled="!userSearchSelection"
                :loading="isLoadingDropdown"
                @click="save"
              >
                <span>Add</span>
              </v-btn>
            </v-col>
          </v-row>
          <p class="mt-5">
            <strong>Team members for this submission:</strong>
          </p>
          <v-simple-table dense>
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left">Name</th>
                  <th class="text-left">Username</th>
                  <th class="text-left">Email</th>
                  <th class="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Lucas O'Neil</td>
                  <td>loneil</td>
                  <td>lucas@oneil.gov.bc.ca</td>
                  <td>
                    <v-btn color="red" icon disabled>
                      <v-icon>remove_circle</v-icon>
                    </v-btn>
                  </td>
                </tr>
                <tr>
                  <td>Jane Smith</td>
                  <td>jxsmith</td>
                  <td>jane@smith.gov.bc.ca</td>
                  <td>
                    <v-btn color="red" icon>
                      <v-icon>remove_circle</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn class="mb-5 close-dlg" color="primary" @click="dialog = false">
            <span>Close</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import { userService } from '@/services';

export default {
  name: 'ManageSubmissionUsers',
  data() {
    return {
      dialog: false,
      isLoadingDropdown: false,
      isLoadingTable: true,
      findUsers: null,
      userSearchResults: [],
      userSearchSelection: null,
    };
  },
  methods: {
    // show users in dropdown that have a text match on multiple properties
    filterObject(item, queryText) {
      // eslint-disable-next-line
      for (const [key, value] of Object.entries(item)) {
        if (
          value !== null &&
          value.toLocaleLowerCase().includes(queryText.toLocaleLowerCase())
        ) {
          return true;
        }
      }
    },

    save() {
      // emit user (object) to the parent component
      this.$emit('new-users', [this.model]);
      // reset search field
      this.model = null;
      this.addingUsers = false;
    },
  },
  watch: {
    // Get a list of user objects from database
    async findUsers(input) {
      if (!input) return;
      this.isLoadingDropdown = true;
      try {
        const response = await userService.getUsers({ search: input });
        this.userSearchResults = response.data;
      } catch (error) {
        console.error(`Error getting users: ${error}`); // eslint-disable-line no-console
      } finally {
        this.isLoadingDropdown = false;
      }
    },
  },
};
</script>
