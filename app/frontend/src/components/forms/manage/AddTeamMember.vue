<template>
  <span>
    <span v-if="addingUsers" class="d-flex justify-end">
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
        <span>Add a New Member</span>
      </v-tooltip>
    </span>
  </span>
</template>

<script>
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
      console.log('---------------------------->>>');
      // emit user (object) to the parent component
      this.$emit('new-users', [this.model]);
      // reset search field
      this.model = null;
      this.addingUsers = false;
    },
  },
  watch: {
    addingUsers() {
      this.$emit('adding-users', this.addingUsers);
    },
    // Get a list of user objects from database
    async searchUsers(input) {
      if (!input) return;
      this.isLoading = true;
      try {
        const response = await userService.getUsers({
          idpCode: 'idir',
          search: input,
        });
        this.items = response.data;
      } catch (error) {
        console.error(`Error getting users: ${error}`); // eslint-disable-line no-console
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>
