<script>
import { mapActions, mapState } from 'pinia';
import { version as uuidVersion, validate as uuidValidate } from 'uuid';

import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';
import { FormRoleCodes } from '~/utils/constants';

export default {
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
    ...mapActions(useAdminStore, ['addFormUser', 'readRoles']),
    ...mapState(useFormStore, ['lang']),
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

<template>
  <v-form ref="addUserForm" v-model="valid">
    <p :lang="lang">
      {{ $t('trans.addOwner.infoA') }}
    </p>
    <v-row class="mt-4">
      <v-col cols="9" sm="6" md="6" lg="4">
        <v-text-field
          v-model="userGuid"
          :label="$t('trans.addOwner.label')"
          :rules="userGuidRules"
          :hint="$t('trans.addOwner.hint')"
          persistent-hint
          :lang="lang"
        />
      </v-col>
      <v-col cols="3" md="2">
        <v-btn color="primary" :disabled="!valid" @click="addOwner">
          <span :lang="lang">{{ $t('trans.addOwner.addowner') }}</span>
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>
