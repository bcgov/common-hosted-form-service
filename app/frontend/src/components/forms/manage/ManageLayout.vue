<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse"
    >
      <div cols="12" sm="8">
        <!-- page title -->
        <h1 :lang="lang">{{ $t('trans.manageLayout.manageForm') }}</h1>
        <!-- form name -->
        <h3>{{ this.form.name }}</h3>
      </div>
      <!-- buttons -->
      <div cols="12" sm="4">
        <v-skeleton-loader :loading="loading" type="actions">
          <ManageFormActions />
        </v-skeleton-loader>
      </div>
    </div>
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
    ...mapGetters('form', ['form', 'permissions', 'isRTL', 'lang']),
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
