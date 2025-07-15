<script setup>
import { version as uuidVersion, validate as uuidValidate } from 'uuid';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

import { useAdminStore } from '~/store/admin';
import { FormRoleCodes } from '~/utils/constants';

const { locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

const addUserForm = ref(null);
const userGuid = ref('');
const valid = ref(false);
const userGuidRules = ref([
  (v) => !!v || 'User ID required',
  (v) =>
    (uuidValidate(v) && uuidVersion(v) === 4) || 'Enter a valid User ID GUID',
]);

const adminStore = useAdminStore();

async function addOwner() {
  if (addUserForm.value.validate()) {
    await adminStore.addFormUser({
      userId: userGuid.value,
      formId: properties.formId,
      roles: [FormRoleCodes.OWNER],
    });
  }
}
</script>

<template>
  <v-form ref="addUserForm" v-model="valid">
    <p :lang="locale">
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
          :lang="locale"
        />
      </v-col>
      <v-col cols="3" md="2">
        <v-btn
          color="primary"
          :disabled="!valid"
          :title="$t('trans.addOwner.addowner')"
          @click="addOwner"
        >
          <span :lang="locale">{{ $t('trans.addOwner.addowner') }}</span>
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>
