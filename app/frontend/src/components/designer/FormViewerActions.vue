<template>
  <v-row>
    <v-col>
      <router-link :to="{ name: 'UserSubmissions', query: { f: formId } }">
        <v-btn color="primary" outlined>
          <span>View All Submissions</span>
        </v-btn>
      </router-link>
    </v-col>
    <v-col class="text-right">
      <span class="mr-2">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              @click="saveDraft"
              color="primary"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>save</v-icon>
            </v-btn>
          </template>
          <span>Save as a Draft</span>
        </v-tooltip>
      </span>
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
          <span>Invite Team Member</span>
        </v-tooltip>
      </span>
      <v-dialog v-model="dialog" width="600">
        <v-card>
          <v-card-title class="headline pb-0">
            Invite Team Member (Mockup)
          </v-card-title>
          <v-card-text>
            <hr />
            <v-row>
              <v-col cols="9">
                <v-autocomplete
                  v-model="model"
                  clearable
                  dense
                  :filter="filterObject"
                  hide-details
                  :items="items"
                  label="Enter a name, email, or username"
                  :loading="isLoading"
                  return-object
                  :search-input.sync="searchUsers"
                >
                </v-autocomplete>
              </v-col>
              <v-col cols="3">
                <v-btn
                  color="primary"
                  class="ml-2"
                  :disabled="!model"
                  :loading="isLoading"
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
                    <th class="text-left">Email</th>
                    <th class="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Lucas</td>
                    <td>a@a.com</td>
                    <td>
                      <v-btn color="red" :disabled="updating" icon>
                        <v-icon>remove_circle</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                  <tr>
                    <td>Mina</td>
                    <td>a@a.com</td>
                    <td>
                      <v-btn color="red" :disabled="updating" icon>
                        <v-icon>remove_circle</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                  <tr>
                    <td>Chris</td>
                    <td>a@a.com</td>
                    <td>
                      <v-btn color="red" :disabled="updating" icon>
                        <v-icon>remove_circle</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                  <tr>
                    <td>etc</td>
                    <td>a@a.com</td>
                    <td>
                      <v-btn color="red" :disabled="updating" icon>
                        <v-icon>remove_circle</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card-text>

          <v-card-actions class="justify-center">
            <v-btn
              class="mb-5 close-dlg"
              color="primary"
              @click="dialog = false"
            >
              <span>Close</span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'MySubmissionsActions',
  data() {
    return {
      dialog: false,
    };
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  methods: {
    saveDraft() {
      alert('tbd');
    },
  },
};
</script>
