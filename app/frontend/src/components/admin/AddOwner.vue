<template>
  <v-form ref="addUserForm" v-model="valid">
    <p>
      {{ $t('trans.addOwner.infoA') }}
    </p>
    <v-row class="mt-4">
      <v-col cols="9" sm="6" md="6" lg="4">
        <v-text-field
          :label="$t('trans.addOwner.label')"
          v-model="userGuid"
          :rules="userGuidRules"
          :hint="$t('trans.addOwner.hint')"
          persistent-hint
        />
      </v-col>
      <v-col cols="3" md="2">
        <v-btn color="primary" @click="addOwner" :disabled="!valid">
          <span>{{ $t('trans.addOwner.addowner') }}</span>
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script>
import { mapActions } from 'vuex';

import { FormRoleCodes } from '@/utils/constants';
import { version as uuidVersion, validate as uuidValidate } from 'uuid';

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
        (v) =>
          (uuidValidate(v) && uuidVersion(v) === 4) ||
          'Enter a valid User ID GUID',
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
          roles: [FormRoleCodes.OWNER],
        });
      }
    },
  },
};
</script>
