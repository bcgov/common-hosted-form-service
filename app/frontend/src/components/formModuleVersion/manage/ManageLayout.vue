<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>Manage Form Module Version</h1>
      </v-col>
      <!-- form name -->
      <v-col cols="12" order="3">
        <h3>{{ formModule.pluginName }}</h3>
      </v-col>
    </v-row>
    <v-skeleton-loader :loading="loading" type="list-item-two-line">
      <ManageFormModuleVersion />
    </v-skeleton-loader>
  </div>
</template>

<script>

import ManageFormModuleVersion from '@/components/formModuleVersion/manage/ManageFormModuleVersion.vue';
import { IdentityProviders } from '@/utils/constants';
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'FormModuleVersionManageLayout',
  components: { ManageFormModuleVersion },
  props: {
    fm: {
      type: String,
      required: true,
    },
    fmv: {
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
    ...mapGetters('formModule', ['formModule', 'formModuleVersion']),
    IDP: () => IdentityProviders,
  },
  methods: {
    ...mapActions('formModule', [
      'fetchFormModule',
      'fetchFormModuleVersion',
    ]),
  },
  async mounted() {
    this.loading = true;
    await Promise.all([
      this.fetchFormModule(this.fm),
      this.fetchFormModuleVersion({
        formModuleId: this.fm, formModuleVersionId: this.fmv
      }),
    ]);
    this.loading = false;
  },
};
</script>
