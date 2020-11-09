<template>
  <div class="new-member-div mb-5">
    <div v-if="addingUsers" class="d-flex justify-end align-center">
      <v-autocomplete
        label="Type  a name, IDIR, or email to add member"
        hide-details
        outlined
        dense
        clearable
        v-model="model"
        :items="items"
        :search-input.sync="searchUsers"
        :filter="filterObject"
        return-object
        :loading="isLoading"
      >
        <!-- selected user -->
        <template #selection="data">
          <span
            v-bind="data.attrs"
            :input-value="data.selected"
            close
            @click="data.select"
            @click:close="remove(data.item)"
          >{{ data.item.fullName }}</span>
        </template>
        <!-- users found in dropdown -->
        <template #item="data">
          <template v-if="typeof data.item !== 'object'">
            <v-list-item-content v-text="data.item"></v-list-item-content>
          </template>
          <template v-else>
            <v-list-item-content>
              <v-list-item-title v-html="data.item.fullName"></v-list-item-title>
              <v-list-item-subtitle v-html="data.item.username"></v-list-item-subtitle>
              <v-list-item-subtitle v-html="data.item.email"></v-list-item-subtitle>
            </v-list-item-content>
          </template>
        </template>
      </v-autocomplete>
      <!-- buttons -->
      <v-btn color="primary" class="ml-2" :disabled="!model" :loading="isLoading" @click="save">
        <span>Add</span>
      </v-btn>
      <v-btn outlined class="ml-2" @click="addingUsers = false">
        <span>Cancel</span>
      </v-btn>
    </div>

    <div v-else class="d-flex justify-md-end">
      <v-btn @click="addingUsers = true" color="primary">
        <span>Add a New Member</span>
      </v-btn>
    </div>
  </div>
</template>

<script>

import { userService } from '@/services';

export default {
  data() {
    return {
      addingUsers: false,
      isLoading: false,
      items: [],
      model: null,
      searchUsers: null
    };
  },
  methods: {


    // show users in dropdown that have a text match on multiple properties
    filterObject(item, queryText) {
      // eslint-disable-next-line
      for (const [key, value] of Object.entries(item)) {
        if(value !== null) {
          if(value.toLocaleLowerCase().includes(queryText.toLocaleLowerCase()) ){
            return true;
          }
        }
      }
    },



    save(){
      // emit user (object) to the parent component
      this.$emit('new-users', [this.model]);
      // reset search field
      this.model = null;
      this.addingUsers = false;
    }
  },
  watch: {

    // Get a list of user objects from database
    async searchUsers(input) {
      if (!input) {
        return;
      }
      this.isLoading = true;
      try {
        const response = await userService.getUsers({
          search: input
        });
        this.items = response.data;
      } catch (error) {
        console.error(`Error getting users: ${error}`); // eslint-disable-line no-console
      } finally {
        this.isLoading = false;
      }
    },
  }
};
</script>

<style scoped lang="scss">
.new-member-div {
  .v-autocomplete {
    max-width: 450px;
  }
}
</style>
