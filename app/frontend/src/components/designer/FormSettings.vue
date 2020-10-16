<template>
  <v-skeleton-loader :loading="loading" type="article">
    <v-container class="px-0">
      <v-row>
        <v-col cols="12" lg="4">
          <v-text-field
            dense
            flat
            solid
            outlined
            label="Name"
            data-test="text-name"
            v-model="name"
            :rules="nameRules"
          />
        </v-col>
        <v-col cols="12" lg="8">
          <v-text-field
            dense
            flat
            solid
            outlined
            label="Description"
            data-test="text-description"
            v-model="description"
            :rules="descriptionRules"
          />
        </v-col>
      </v-row>

      <p>Select which type of users can launch this form when published</p>
      <v-radio-group
        class="pl-5"
        v-model="userType"
        :mandatory="false"
        :rules="loginRequiredRules"
      >
        <v-radio
          disabled
          label="Public (annonymous)"
          :value="ID_MODE.PUBLIC"
        />
        <v-radio label="Log-in Required" value="login"></v-radio>
        <v-row v-if="userType === ID_MODE.LOGIN" class="pl-6 mb-2">
          <v-checkbox
            v-model="idps"
            class="mx-4"
            label="IDIR"
            :value="ID_PROVIDERS.IDIR"
          />
          <v-checkbox
            disabled
            v-model="idps"
            class="mx-4"
            label="BCeID"
            :value="ID_PROVIDERS.BCEID"
          />
          <v-checkbox
            disabled
            v-model="idps"
            class="mx-4"
            label="BC Services Card"
            :value="ID_PROVIDERS.BCSC"
          />
          <v-checkbox
            disabled
            v-model="idps"
            class="mx-4"
            label="Github"
            :value="ID_PROVIDERS.GITHUB"
          />
        </v-row>
        <v-radio label="Specific Team Members" value="team" />
        <v-row v-if="userType === ID_MODE.TEAM" class="pl-6 mb-2">
          You can specify users on the form's management screen once created.
        </v-row>
      </v-radio-group>
    </v-container>
  </v-skeleton-loader>
</template>

<script>
import { mapActions } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import { IdentityMode, IdentityProviders } from '@/utils/constants';

export default {
  name: 'FormSettings',
  props: {
    formId: String,
  },
  data() {
    return {
      loading: true,
      valid: false,
      // Validation
      loginRequiredRules: [
        (v) =>
          v !== 'login' ||
          this.idps.length > 0 ||
          'Please select at least 1 log-in type',
      ],
      descriptionRules: [
        (v) =>
          !v || v.length <= 255 || 'Description must be 255 characters or less',
      ],
      nameRules: [
        (v) => !!v || 'Name is required',
        (v) => (v && v.length <= 255) || 'Name must be 255 characters or less',
      ],
    };
  },
  computed: {
    ...mapFields('form', [
      'form.description',
      'form.id',
      'form.idps',
      'form.name',
      'form.userType',
    ]),
    ID_MODE() {
      return IdentityMode;
    },
    ID_PROVIDERS() {
      return IdentityProviders;
    },
  },
  methods: mapActions('form', ['fetchForm']),
  async created() {
    if (this.formId) {
      this.id = this.formId;
      await this.fetchForm(this.id);
    }
    this.loading = false;
  },
};
</script>
