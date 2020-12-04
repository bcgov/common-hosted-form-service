<template>
  <BaseSecure>
    <v-row class="my-6" no-gutters>
      <v-col cols="12" sm="6">
        <h1>Manage Form</h1>
      </v-col>
      <v-spacer />
      <v-col class="text-sm-right" cols="12" sm="6">
        <ManageFormActions />
      </v-col>
    </v-row>
    <ManageForm />
  </BaseSecure>
</template>

<script>
import { mapActions } from 'vuex';

import ManageForm from '@/components/forms/ManageForm.vue';
import ManageFormActions from '@/components/forms/ManageFormActions.vue';

export default {
  name: 'FormManage',
  components: { ManageForm, ManageFormActions },
  props: {
    f: {
      type: String,
      required: true,
    },
  },
  computed: {
  },
  methods: {
    ...mapActions('form', ['getFormPermissionsForUser', 'fetchForm']),
  },
  mounted() {
    // Get the form for this management page
    this.fetchForm(this.f);
    // Get the permissions for this form
    this.getFormPermissionsForUser(this.f);
  },
};
</script>
