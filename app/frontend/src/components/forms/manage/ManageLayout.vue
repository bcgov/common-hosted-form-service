<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>{{ $t('trans.manageLayout.manageForm') }}</h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
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
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import ManageForm from '@/components/forms/manage/ManageForm.vue';
import ManageFormActions from '@/components/forms/manage/ManageFormActions.vue';
import { FormPermissions, IdentityProviders } from '@/utils/constants';

export default {
  name: 'ManageLayout',
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
    ...mapGetters('form', ['form', 'permissions']),
    IDP: () => IdentityProviders,
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
      // Get the permissions for this form
      this.getFormPermissionsForUser(this.f),
    ]);
    if (this.permissions.includes(FormPermissions.DESIGN_READ))
      await this.fetchDrafts(this.f);
    this.loading = false;
  },
};
</script>
