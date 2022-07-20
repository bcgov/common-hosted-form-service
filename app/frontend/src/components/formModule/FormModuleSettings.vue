<template>
  <v-container class="px-0">
    <v-row>
      <v-col>
        <BasePanel class="fill-height">
          <template #title>Form Module Plugin Name</template>
          <v-text-field
            dense
            flat
            solid
            outlined
            label="Plugin Name"
            name="pluginName"
            v-model="pluginName"
            :rules="pluginNameRules"
          />
        </BasePanel>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <BasePanel class="fill-height">
          <template #title>Form Designer IDP Access</template>
          <div
            v-for="idp in ID_PROVIDERS"
            :key="idp"
          >
            <v-checkbox
              v-if="id"
              class="my-0"
              :value="idp"
              v-model="idpTypes"
            >
              <template #label>
                <span>{{ idp }}</span>
              </template>
            </v-checkbox>
            <v-checkbox
              v-else
              class="my-0"
              :value="idp"
              v-model="idpTypes"
            >
              <template #label>
                <span>{{ idp }}</span>
              </template>
            </v-checkbox>
          </div>
        </BasePanel>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import { IdentityMode, IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormModuleSettings',
  data() {
    return {
      valid: false,
      pluginNameRules: [
        (v) => !!v || 'Plugin name is required',
        (v) =>
          (v && v.length <= 255) || 'Form Module name must be 255 characters or less',
      ],
      isLoading: true,
    };
  },
  computed: {
    ...mapFields('formModule', [
      'formModule.id',
      'formModule.pluginName',
      'formModule.identityProviders',
      'formModule.idpTypes',
    ]),
    ID_MODE() {
      return IdentityMode;
    },
    ID_PROVIDERS() {
      return Object.values(IdentityProviders);
    },
  },
  methods: {
    ...mapActions('formModule', ['setDirtyFlag']),
    ...mapActions('notifications', ['addNotification']),
  },
  mounted() {
    this.$nextTick(() => {
      this.isLoading = false;
    });
  },
};
</script>

<style lang="scss" scoped>
@import '~font-awesome/css/font-awesome.min.css';
@import '~formiojs/dist/formio.builder.min.css';
</style>
