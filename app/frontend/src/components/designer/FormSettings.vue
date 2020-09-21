<template>
  <div>
    <v-card class="mb-5">
      <v-toolbar flat color="grey lighten-3">
        <v-card-title>Form Settings</v-card-title>
      </v-toolbar>
      <v-card-text>

      </v-card-text>
    </v-card>

    <FormBuilder :form="formSchema" @change="onChangeMethod" :options="{}" />
  </div>
</template>

<script>
import { IdentityProviders } from '@/utils/constants';
import { FormBuilder } from 'vue-formio';
import formService from '@/services/formService';

export default {
  name: 'FormDesigner',
  components: {
    FormBuilder,
  },
  props: {
    formId: String,
    formVersionId: String,
  },
  data() {
    return {
      idps: [IdentityProviders.IDIR],
      formName: '',
      formDescription: '',
      formSchema: {},
      userType: 'team',
      valid: false,

      // Validation
      loginRequiredRules: [
        (v) =>
          v != 'login' ||
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
    async getFormSchema() {
      this.formSchema = {};
      try {
        const form = await formService.readForm(this.formId);
        this.formName = form.data.name;
        this.formDescription = form.data.description;

        if (this.formVersionId) {
          const response = await formService.readVersion(
            this.formId,
            this.formVersionId
          );
          this.formSchema = response.data.schema;
        }
      } catch (error) {
        console.error(`Error loading form schema: ${error}`); // eslint-disable-line no-console
      }
    },
    async submitFormSchema() {
      if (this.$refs.form.validate()) {
        if (this.formId && this.formVersionId) {
          // If editing a form, update the version
          try {
            const response = await formService.updateVersion(
              this.formId,
              this.formVersionId,
              {
                schema: this.formSchema,
              }
            );
            const data = response.data;
            this.formSchema = data.schema;
          } catch (error) {
            console.error(`Error updating form schema version: ${error}`); // eslint-disable-line no-console
          }
        } else {
          // If creating a new form, add the form and then a version
          try {
            let identityProviders = [];
            if (this.userType === 'login') {
              identityProviders = this.idps.map((i) => ({ code: i }));
            } else if (this.userType === this.ID_PROVIDERS.PUBLIC) {
              identityProviders = [this.ID_PROVIDERS.PUBLIC];
            }
            const form = {
              name: this.formName,
              description: this.formDescription,
              schema: this.formSchema,
              identityProviders: identityProviders,
            };
            const response = await formService.createForm(form);
            // Add the schema to the newly created default version
            if (!response.data.versions || !response.data.versions[0]) {
              throw new Error(
                `createForm response does not include a form version: ${response.data.versions}`
              );
            }
            this.$router.push({
              name: 'FormManage',
              params: { formId: response.data.id },
            });
          } catch (error) {
            console.error(`Error creating new form : ${error}`); // eslint-disable-line no-console
          }
        }
      }
    },
    onChangeMethod(schema) {
      if (!this.formSchema) this.formSchema = {};
      this.formSchema = Object.assign(this.formSchema, schema);
    },
    created() {
      if (this.formId) {
        this.getFormSchema();
      }
    },
  },
};
</script>
