<template>
  <v-container>
    <h1 class="mt-6">Add Form Module Version</h1>
    <v-form ref="settingsFormModule" v-model="settingsFormModuleValid">
      <FormModuleVersionSettings />
    </v-form>
    <v-btn
      class="py-4"
      color="primary"
      :disabled="!settingsFormModuleValid"
      @click="submitFormModule"
    >
      Submit
    </v-btn>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { mapFields } from 'vuex-map-fields';

import FormModuleVersionSettings from '@/components/formModuleVersion/FormModuleVersionSettings.vue';
import { formModuleService } from '@/services';
import { IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormModuleAddVersion',
  components: {
    FormModuleVersionSettings,
  },
  computed: {
    ...mapFields('formModule', ['formModule.isDirty']),
    ...mapGetters('formModule', [ 'formModule', 'formModuleVersion' ]),
    IDP: () => IdentityProviders,
  },
  data() {
    return {
      settingsFormModuleValid: false,
      saving: false,
    };
  },
  methods: {
    ...mapActions('formModule', ['resetFormModuleVersion', 'setDirtyFlag']),
    ...mapActions('notifications', ['addNotification']),
    async submitFormModule() {
      try {
        this.saving = true;
        await this.setDirtyFlag(false);

        let euris = [];
        
        if (!this.formModuleVersion.importData) this.formModuleVersion.importData = '';

        let formModuleVersionData = {
          importData: this.formModuleVersion.importData,
          externalUris: euris.concat(this.formModuleVersion.externalUris.map((i) => (i.uri))),
        };

        await formModuleService.createFormModuleVersion(this.formModule.id, formModuleVersionData);

        this.$router.push({
          name: 'FormModuleManage',
          query: {
            fm: this.formModule.id,
          },
        });
      } catch (error) {
        await this.setDirtyFlag(true);
        this.addNotification({
          message:
            'An error occurred while attempting to save this form module.',
          consoleError: `Error creating form module (Error: ${error}`,
        });
      } finally {
        this.saving = false;
      }
    },
  },
  created() {
    this.resetFormModuleVersion();
  },
  watch: {
    idps() {
      if (this.idpTypes.length < 1 && this.$refs.settingsFormModule)
        this.$refs.settingsFormModule.validate();
    },
  },
  beforeRouteLeave(_to, _from, next) {
    this.isDirty
      ? next(
        window.confirm(
          'Do you really want to leave this page? Changes you made will not be saved.'
        )
      )
      : next();
  },
};
</script>

<style lang="scss" scoped>

</style>
