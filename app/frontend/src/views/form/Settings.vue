<!-- TODO: Remove this temporary scaffold view -->
<template>
  <div>
    <h1 class="my-6 text-center">Form Edit</h1>
    <v-form ref="settingsForm" v-model="settingsFormValid">
      <FormSettings :formId="f" />
    </v-form>
    <v-btn
      color="primary"
      :disabled="!settingsFormValid"
      @click="updateForm"
    >
      <span>Save</span>
    </v-btn>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { mapFields } from 'vuex-map-fields';

import FormSettings from '@/components/designer/FormSettings.vue';

export default {
  name: 'Settings',
  components: {
    FormSettings,
  },
  props: {
    f: String,
  },
  computed: mapFields('form', ['form.idps']),
  data() {
    return {
      settingsFormValid: false,
    };
  },
  methods: mapActions('form', ['updateForm']),
  watch: {
    idps() {
      if (this.$refs.settingsForm) this.$refs.settingsForm.validate();
    },
  },
};
</script>
