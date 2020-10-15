<!-- This is the old FormDesigner - this is a TEMPORARY component and should be removed when Create View is refactored completely! -->
<template>
  <div>
    <v-stepper v-model="designerStep" class="elevation-0">
      <v-stepper-header class="elevation-0 px-0">
        <v-stepper-step :complete="designerStep > 1" step="1" class="pl-1">
          Set up Form
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step :complete="designerStep > 2" step="2" class="pr-1">
          Design Form
        </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1" class="pa-1">
          <h2>Set your Form Options</h2>
          <v-form ref="step1Form" v-model="valid" lazy-validation>
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

              <p>
                Choose whether to use the basic form designer or the advanced
                developer version
              </p>
              <v-switch
                class="pl-5"
                v-model="advancedForm"
                label="Enable advanced designer features"
              ></v-switch>

              <p>
                Select which type of user can fill out out this form once
                published
              </p>
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
                ></v-radio>
                <v-radio label="Log-in Required" value="login"></v-radio>
                <div v-if="userType === 'login'" class="pl-5 mb-5">
                  <v-row>
                    <v-checkbox
                      v-model="idps"
                      class="mx-4"
                      label="IDIR"
                      :value="ID_PROVIDERS.IDIR"
                    ></v-checkbox>
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
                <div v-if="userType === 'team'" class="pl-5 mb-5">
                  You can specify users on the form's management screen once
                  created.
                </div>
              </v-radio-group>

              <v-row class="mb-4">
                <v-col cols="12" md="6" lg="4">
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
                </v-col>
              </v-row>
            </v-container>
            <v-btn color="primary" @click="setFormDetails">
              <span>Continue</span></v-btn
            >
          </v-form>
        </v-stepper-content>

        <v-stepper-content step="2" class="pa-0">
          <h2>Design your Form</h2>
          <p>Drag and Drop form fields in the designer below.</p>
          <div class="my-5">
            <v-btn
              class="mr-3"
              color="primary"
              @click="submitFormSchema"
              data-test="btn-form-to-next-step"
            >
              <span>Save Design</span>
            </v-btn>
            <v-btn
              outlined
              @click="designerStep = 1"
              data-test="btn-form-to-previous-step"
            >
              <span>Back</span>
            </v-btn>
            <br />
            <br />
            <v-icon color="primary">info</v-icon>Use the SAVE DESIGN button when
            you are done building this form. The SUBMIT button below is for your
            users to submit this form when published.
          </div>
          <div v-if="designerStep == 2">
            <FormBuilder
              :form="formSchema"
              :options="designerOptions"
              :key="reRenderFormIo"
            />

            <span>
              <v-btn text color="primary" @click="downloadFile">
                <v-icon class="mr-1">cloud_download</v-icon>
                <span>Export Design</span>
              </v-btn>
            </span>
          </div>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { IdentityProviders } from '@/utils/constants';
import { FormBuilder } from 'vue-formio';
import { formService } from '@/services';

export default {
  name: 'FormCreator',
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
    ...mapActions('notifications', ['addNotification']),
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
        this.designerStep = 2;
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
          this.addNotification({
            message:
              'An error occurred while attempting to update this form. If you need to refresh or leave to try again later you can Export the existing design on the page to save for later.',
            consoleError: `Error updating form ${this.formId} schema version ${this.versionId}: ${error}`,
          });
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
          this.addNotification({
            message:
              'An error occurred while attempting to create this form. If you need to refresh or leave to try again later you can Export the existing design on the page to save for later.',
            consoleError: `Error creating new form : ${error}`,
          });
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
    designerStep(newValue) {
      if (newValue === 2) {
        // Once they go to the design step, enable the typical "leave site" native browser warning
        window.onbeforeunload = () => true;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
// include bootstrap and formio styles for the form builder
@import '~bootstrap/dist/css/bootstrap.min.css';
@import "~font-awesome/css/font-awesome.css";
@import 'https://unpkg.com/formiojs@4.11.2/dist/formio.builder.min.css';
</style>
