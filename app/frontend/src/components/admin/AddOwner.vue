<template>
  <div>
    This should only be done in the event that the current form owner is no
    longer active or is out of contact in a priority event. Otherwise have the
    current Owner or a Team Administrator for the form do this themselves.
    {{ formId }} {{ userGuid }}

    <v-row class="mt-4">
      <v-col cols="9" sm="6" md="6" lg="4">
        <v-text-field
          label="User ID (guid)"
          v-model="userGuid"
          hint="To find the User ID needed you can go to the 'USERS' tab in this Admin section and search for them."
          persistent-hint
        />
      </v-col>
      <v-col cols="3" md="2">
        <v-btn color="primary">
          <span>Add owner</span>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'AddOwner',
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      userGuid: '',
    };
  },
  methods: {
    ...mapActions('admin', ['addOwner']),
  },
};
</script>
