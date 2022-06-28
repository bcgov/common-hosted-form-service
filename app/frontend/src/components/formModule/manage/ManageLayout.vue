<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>Manage Form Module</h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
        <v-skeleton-loader :loading="loading" type="actions">
          <ManageFormModuleActions />
        </v-skeleton-loader>
      </v-col>
      <!-- form name -->
      <v-col cols="12" order="3">
        <h3>{{ formModule.pluginName }}</h3>
      </v-col>
    </v-row>
    <v-skeleton-loader :loading="loading" type="list-item-two-line">
      <ManageFormModule />
    </v-skeleton-loader>
  </div>
</template>

<script>

import ManageFormModule from '@/components/formModule/manage/ManageFormModule.vue';
import ManageFormModuleActions from '@/components/formModule/manage/ManageFormModuleActions.vue';
import { IdentityProviders } from '@/utils/constants';
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'FormModuleManageLayout',
  components: { ManageFormModule, ManageFormModuleActions },
  props: {
    fm: {
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
    ...mapGetters('formModule', ['formModule', 'formModuleVersionList']),
    IDP: () => IdentityProviders,
  },
  methods: {
    ...mapActions('formModule', [
      'fetchFormModule',
      'getFormModuleVersionList',
      'setIdpTypes'
    ]),
  },
  async mounted() {
    this.loading = true;
    await Promise.all([
      this.fetchFormModule(this.fm),
      this.getFormModuleVersionList(this.fm),
    ]);
    this.loading = false;
  },
};
</script>
