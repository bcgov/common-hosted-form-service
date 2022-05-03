<template>
  <div>
    This should only be done in the event that the current form owner is no
    longer active or is out of contact in a priority event. Otherwise have the
    current Owner or a Team Administrator for the form do this themselves.

    <v-form ref="addUserForm" v-model="valid">
      <v-row class="mt-4">
        <v-col cols="9" sm="6" md="6" lg="4">
          <v-text-field
            label="User ID (guid)"
            v-model="userGuid"
            :rules="userGuidRules"
            hint="To find the User ID needed you can go to the 'USERS' tab in the Admin portal and search for them."
            persistent-hint
          />
        </v-col>
        <v-col cols="3" md="2">
          <v-btn color="primary" @click="addOwner" :disabled="!valid">
            <span>Add owner</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

import { FormRoleCodes, Regex } from '@/utils/constants';

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
      valid: false,

      userGuidRules: [
        (v) => !!v || 'User ID required',
        (v) => new RegExp(Regex.GUID).test(v) || 'Enter a valid User ID GUID',
      ],
    };
  },
  methods: {
    ...mapActions('admin', ['addFormUser', 'readRoles']),
    async addOwner() {
      if (this.$refs.addUserForm.validate()) {
        await this.addFormUser({
          userId: this.userGuid,
          formId: this.formId,
          role: FormRoleCodes.OWNER,
        });
        this.readRoles(this.formId);
      }
    },
  },
};
</script>
