<template>
  <BaseSecure>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" md="6" order="2" order-sm="1">
        <h1>Manage Form</h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-left text-sm-right" cols="12" sm="6" md="6" order="1" order-sm="2">
        <v-skeleton-loader :loading="loading" type="actions">
          <ManageFormActions />
        </v-skeleton-loader>
      </v-col>
      <!-- form name -->
      <v-col cols="12" order="3">
        <h3>{{ this.form.name }}</h3>
      </v-col>
    </v-row>
    <v-skeleton-loader :loading="loading" type="list-item-two-line">
      <ManageForm />
    </v-skeleton-loader>
  </BaseSecure>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import ManageForm from '@/components/forms/manage/ManageForm.vue';
import ManageFormActions from '@/components/forms/manage/ManageFormActions.vue';

export default {
  name: 'FormManage',
  components: { ManageForm, ManageFormActions },
  props: {
    f: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
    };
  },
  computed: {
    ...mapGetters('form', ['form']),
  },
  methods: {
    ...mapActions('form', [
      'fetchDrafts',
      'fetchForm',
      'getFormPermissionsForUser',
    ]),
  },
  async mounted() {
    this.loading = true;
    await Promise.all([
      // Get the form for this management page
      this.fetchForm(this.f),
      this.fetchDrafts(this.f),
      // Get the permissions for this form
      this.getFormPermissionsForUser(this.f),
    ]);
    this.loading = false;
  },
};
</script>
