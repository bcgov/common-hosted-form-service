<template>
  <v-skeleton-loader :loading="loading" type="heading, paragraph@3, button">
    <h2>Set your Form Options</h2>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-container class="px-0">
        <v-row>
          <v-col cols="12" lg="4">
            <v-text-field
              dense
              flat
              solid
              outlined
              label="Name"
              data-test="text-formName"
              v-model="formName"
              :rules="formNameRules"
            />
          </v-col>
          <v-col cols="12" lg="8">
            <v-text-field
              dense
              flat
              solid
              outlined
              label="Description"
              data-test="text-formDescription"
              v-model="formDescription"
              :rules="formDescriptionRules"
            />
          </v-col>
        </v-row>

        <p>Choose which form designer mode to use</p>
        <v-radio-group class="pl-5" row v-model="advancedForm">
          <v-radio label="Basic Form Designer" :value="false" />
          <v-radio label="Advanced Form Designer" :value="true" />
        </v-radio-group>

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
            :value="ID_PROVIDERS.PUBLIC"
          />
          <v-radio label="Log-in Required" value="login"></v-radio>
          <v-row v-if="userType === 'login'" class="pl-6 mb-2">
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
          <v-row v-if="userType === 'team'" class="pl-6 mb-2">
            You can specify users on the form's management screen once created.
          </v-row>
        </v-radio-group>
      </v-container>
      <v-btn
        color="primary"
        :disabled="!valid"
        :loading="submitting"
        @click="submitForm"
      >
        <span>Save</span>
      </v-btn>
    </v-form>
  </v-skeleton-loader>
</template>

<script>
import { IdentityProviders } from '@/utils/constants';
import { formService } from '@/services';

export default {
  name: 'FormEditor',
  props: {
    formId: String,
  },
  data() {
    return {
      advancedForm: false,
      idps: [IdentityProviders.IDIR],
      formName: '',
      formDescription: '',
      loading: true,
      submitting: false,
      userType: 'login',
      valid: false,
      // Validation
      loginRequiredRules: [
        (v) =>
          v !== 'login' ||
          this.idps.length > 0 ||
          'Please select at least 1 log-in type',
      ],
      formDescriptionRules: [
        (v) =>
          !v || v.length <= 255 || 'Description must be 255 characters or less',
      ],
      formNameRules: [
        (v) => !!v || 'Name is required',
        (v) => (v && v.length <= 255) || 'Name must be 255 characters or less',
      ],
    };
  },
  computed: {
    ID_PROVIDERS() {
      return IdentityProviders;
    },
  },
  methods: {
    generateIdps({ idps, userType }) {
      const identityProviders = [];
      if (userType === 'login') {
        identityProviders.concat(idps.map((i) => ({ code: i })));
      } else if (userType === this.ID_PROVIDERS.PUBLIC) {
        identityProviders.push(this.ID_PROVIDERS.PUBLIC);
      }
      return identityProviders;
    },
    parseIdps(identityProviders) {
      const result = {
        idps: [],
        userType: 'team',
      };
      if (identityProviders.length) {
        if (identityProviders[0] === this.ID_PROVIDERS.PUBLIC) {
          result.userType = this.ID_PROVIDERS.PUBLIC;
        } else {
          result.userType = 'login';
          result.idps = identityProviders.map((ip) => ip.code);
        }
      }
      return result;
    },
    async getForm() {
      try {
        const form = await formService.readForm(this.formId);
        this.formName = form.data.name;
        this.formDescription = form.data.description;
        const identityProviders = this.parseIdps(form.data.identityProviders);
        this.idps = identityProviders.idps;
        this.userType = identityProviders.userType;
      } catch (error) {
        console.error(`Error loading form schema: ${error}`); // eslint-disable-line no-console
      }
    },
    async submitForm() {
      this.submitting = true;
      if (this.formId) {
        // Editing existing form
        try {
          formService.updateForm(this.formId, {
            name: this.formName,
            description: this.formDescription,
            identityProviders: this.generateIdps({
              idps: this.idps,
              userType: this.userType,
            }),
          });
        } catch (error) {
          console.error(`Error updating form schema version: ${error}`); // eslint-disable-line no-console
        }
      } else {
        // Creating new form
        try {
          const response = await formService.createForm({
            name: this.formName,
            description: this.formDescription,
            identityProviders: this.generateIdps({
              idps: this.idps,
              userType: this.userType,
            }),
            schema: {}, // TODO: May want to remove this from being mandatory
          });
          // Add the schema to the newly created default version
          if (!response.data.versions || !response.data.versions[0]) {
            throw new Error(
              `createForm response does not include a form version: ${response.data.versions}`
            );
          }
          // this.$router.push({
          //   name: 'FormManage',
          //   query: {
          //     f: response.data.id,
          //   },
          // });
        } catch (error) {
          console.error(`Error creating new form : ${error}`); // eslint-disable-line no-console
        }
      }
      this.submitting = false;
    },
  },
  async created() {
    if (this.formId) {
      await this.getForm();
    }
    this.loading = false;
  },
  watch: {
    idps() {
      if(this.$refs.form) this.$refs.form.validate();
    },
  },
};
</script>
