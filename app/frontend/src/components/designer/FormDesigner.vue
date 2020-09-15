<template>
  <div>
    <v-card class="mb-5">
      <v-toolbar flat color="grey lighten-3">
        <v-card-title>Form Settings</v-card-title>
      </v-toolbar>
      <v-card-text>
        <v-form ref="form" v-model="valid" lazy-validation>
          <v-container>
            <v-row>
              <v-col cols="12" xl="4">
                <v-text-field
                  dense
                  flat
                  label="Name"
                  data-test="text-formName"
                  v-model="formName"
                  :rules="formNameRules"
                />
              </v-col>
              <v-col cols="12" xl="8">
                <v-text-field
                  dense
                  flat
                  label="Description"
                  data-test="text-formDescription"
                  v-model="formDescription"
                  :rules="formDescriptionRules"
                />
              </v-col>
            </v-row>
            <p>Select which type of user can fill out out this form once published</p>
            <v-radio-group v-model="userType" :mandatory="false" :rules="loginRequiredRules">
              <v-radio disabled label="Public (annonymous)" :value="ID_PROVIDERS.PUBLIC"></v-radio>
              <v-radio label="Log-in Required" value="login"></v-radio>
              <div v-if="userType === 'login'" class="pl-5 mb-5">
                <v-row>
                  <v-checkbox v-model="idps" class="mx-4" label="IDIR" :value="ID_PROVIDERS.IDIR"></v-checkbox>
                  <v-checkbox
                    disabled
                    v-model="idps"
                    class="mx-4"
                    label="BCeID"
                    :value="ID_PROVIDERS.BCEID"
                  ></v-checkbox>
                  <v-checkbox
                    disabled
                    v-model="idps"
                    class="mx-4"
                    label="BC Services Card"
                    :value="ID_PROVIDERS.BCSC"
                  ></v-checkbox>
                  <v-checkbox
                    disabled
                    v-model="idps"
                    class="mx-4"
                    label="Github"
                    :value="ID_PROVIDERS.GITHUB"
                  ></v-checkbox>
                </v-row>
              </div>
              <v-radio label="Specific Team Members" value="team"></v-radio>
              <div
                v-if="userType === 'team'"
                class="pl-5 mb-5"
              >You can specify users on the form's management screen once created.</div>
            </v-radio-group>
            <p>
              <v-icon color="primary">info</v-icon>Build your form with the designer below then hit the SAVE FORM DESIGN button to continue.
            </p>
            <v-btn color="primary" @click="submitFormSchema">
              <span>Save Form Design</span>
            </v-btn>
          </v-container>
        </v-form>
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
      ID_PROVIDERS: IdentityProviders,
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
        (v) => !!v || 'Description is required',
        (v) =>
          !v || v.length <= 255 || 'Description must be 255 characters or less',
      ],
      formNameRules: [
        (v) => !!v || 'Name is required',
        (v) => (v && v.length <= 255) || 'Name must be 255 characters or less',
      ],
    };
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
            alert(`Form ${response.data.id} created successfully. UX TBD`);
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
