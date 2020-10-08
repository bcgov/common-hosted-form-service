<template>
  <div>
    <h2>Design your Form</h2>
    <p>Drag and Drop form fields in the designer below.</p>
    <div class="my-4">
      <v-btn
        color="primary"
        @click="submitFormSchema"
        data-test="btn-form-to-next-step"
      >
        <span>Save Design</span>
      </v-btn>
      <v-btn
        class="ml-2"
        outlined
        @click="$router.go(-1)"
        data-test="btn-form-to-previous-step"
      >
        <span>Back</span>
      </v-btn>
      <v-btn text color="primary" @click="downloadFile">
        <v-icon class="ml-2" left>cloud_download</v-icon>
        <span>Export Design</span>
      </v-btn>
      <v-btn text color="primary" @click="downloadFile">
        <v-icon class="ml-2" left>cloud_upload</v-icon>
        <span>Import Design</span>
      </v-btn>

      <v-expansion-panels popout>
        <v-expansion-panel>
          <v-expansion-panel-header>
            Import existing form design (BETA)
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-file-input
              @change="loadFile"
              accept=".json"
              outlined
              show-size
              label="Upload exported JSON"
            ></v-file-input>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      <p>Choose which form designer mode to use</p>
      <v-switch v-model="advancedForm" label="Enable Advanced Form Designer" />
      <br />
      <v-icon color="primary">info</v-icon>Use the SAVE DESIGN button when you
      are done building this form. The SUBMIT button below is for your users to
      submit this form when published.
    </div>
    <FormBuilder
      :form="formSchema"
      :key="reRenderFormIo"
      :options="designerOptions"
    />
  </div>
</template>

<script>
import { IdentityProviders } from '@/utils/constants';
import { FormBuilder } from 'vue-formio';
import { formService } from '@/services';

export default {
  name: 'FormDesigner',
  components: {
    FormBuilder,
  },
  props: {
    formId: String,
    versionId: String,
  },
  data() {
    return {
      advancedForm: false,
      designerStep: 1,
      idps: [IdentityProviders.IDIR],
      formSchema: {
        display: 'form',
        type: 'form',
        components: [],
      },
      formName: '',
      formDescription: '',
      reRenderFormIo: 0,
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
    designerOptions() {
      if (!this.advancedForm) {
        return {
          noDefaultSubmitButton: false,
          builder: {
            basic: false,
            advanced: false,
            data: false,
            layout: false,
            premium: false,
            entryControls: {
              title: 'Form fields',
              weight: 20,
              default: true,
              components: {
                simpletextfield: true,
                simpletextarea: true,
                simpleselect: true,
                simplenumber: true,
                simplephonenumber: true,
                simpleemail: true,
                simpledatetime: true,
                simpleday: true,
                simpletime: true,
                simplecheckbox: true,
                simplecheckboxes: true,
                simpleradios: true,
              },
            },
            layoutControls: {
              title: 'Layout',
              weight: 30,
              components: {
                simplecols2: true,
                simplecols3: true,
                simplecols4: true,
                simplefieldset: true,
                simplepanel: true,
                simpletabs: true,
              },
            },
            staticControls: {
              title: 'Static Content',
              weight: 40,
              components: {
                simpleheading: true,
                simpleparagraph: true,
                simplecontent: true,
              },
            },
            customControls: {
              title: 'BC Gov.',
              weight: 50,
              components: {
                orgbook: true,
              },
            },
          },
        };
      } else {
        return {
          builder: {
            premium: false,
          },
        };
      }
    },
  },
  methods: {
    async getFormSchema() {
      try {
        const form = await formService.readForm(this.formId);
        this.formName = form.data.name;
        this.formDescription = form.data.description;

        if (this.versionId) {
          const response = await formService.readVersion(
            this.formId,
            this.versionId
          );
          this.formSchema = { ...this.formSchema, ...response.data.schema };
        }
      } catch (error) {
        console.error(`Error loading form schema: ${error}`); // eslint-disable-line no-console
      }
    },
    downloadFile() {
      var a = document.createElement('a');
      a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(
        JSON.stringify(this.formSchema)
      )}`;
      a.download = 'formDesign.json';
      a.style.display = 'none';
      a.classList.add('hiddenDownloadTextElement');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    async loadFile(file) {
      let text = await file.text();
      this.formSchema = JSON.parse(text);
      // Key-changing to force a re-render of the formio component when we want to load a new schema after the page is already in
      this.reRenderFormIo += 1;
    },
    async setFormDetails() {
      if (this.$refs.step1Form.validate()) {
        // this.designerStep = 2;
      }
    },
    async submitFormSchema() {
      if (this.formId && this.versionId) {
        // If editing a form, update the version
        try {
          const response = await formService.updateVersion(
            this.formId,
            this.versionId,
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

          // Once the form is done disable the native browser "leave site" message so they can quit without getting whined at
          window.onbeforeunload = null;

          this.$router.push({
            name: 'FormManage',
            query: {
              f: response.data.id,
            },
          });
        } catch (error) {
          console.error(`Error creating new form : ${error}`); // eslint-disable-line no-console
        }
      }
    },
  },
  created() {
    if (this.formId) {
      this.getFormSchema();
    }
  },
  watch: {
    advancedForm() {
      this.reRenderFormIo += 1;
    },
    designerStep(newValue) {
      if (newValue === 2) {
        // Once they go to the design step, enable the typical "leave site" native browser warning
        window.onbeforeunload = () => true;
      }
    },
  },
};
</script>
