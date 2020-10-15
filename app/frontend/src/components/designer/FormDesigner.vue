<template>
  <div>
    <v-row no-gutters>
      <v-col cols="12" sm="4">
        <h1>Form Design</h1>
        <h3 v-if="name">{{ name }}</h3>
      </v-col>
      <v-spacer />
      <v-col class="text-sm-right" cols="12" sm="4">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              @click="submitFormSchema"
              color="primary"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>save</v-icon>
            </v-btn>
          </template>
          <span>Save Design</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              @click="onExportClick"
              color="primary"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>get_app</v-icon>
            </v-btn>
          </template>
          <span>Export Design</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              @click="$refs.uploader.click()"
              color="primary"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>publish</v-icon>
              <input
                class="d-none"
                @change="loadFile"
                ref="uploader"
                type="file"
                accept=".json"
              />
            </v-btn>
          </template>
          <span>Import Design</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              color="primary"
              :disabled="!formId"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <router-link :to="{ name: 'FormManage', query: { f: formId } }">
                <v-icon>settings</v-icon>
              </router-link>
            </v-btn>
          </template>
          <span>Form Settings</span>
        </v-tooltip>
      </v-col>
    </v-row>
    <BaseInfoCard class="my-6">
      <p class="my-0">
        Use the SAVE DESIGN (<v-icon small>save</v-icon>) button when you are
        done building this form.
      </p>
      <p class="my-0">
        The SUBMIT button is provided for your user to submit this form and will
        be activated after it is saved.
      </p>
    </BaseInfoCard>
    <v-row class="mt-4" no-gutters>
      <v-spacer />
      <v-col class="text-sm-right" cols="12" sm="3">
        <v-select
          dense
          :items="advancedItems"
          outlined
          v-model="advancedForm"
        />
      </v-col>
    </v-row>
    <FormBuilder
      :form="formSchema"
      :key="reRenderFormIo"
      :options="designerOptions"
    />
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { FormBuilder } from 'vue-formio';
import { mapFields } from 'vuex-map-fields';

import { formService } from '@/services';
import { IdentityMode, IdentityProviders } from '@/utils/constants';
import { generateIdps } from '@/utils/transformUtils';

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
      advancedItems: [
        { text: 'Basic Mode', value: false },
        { text: 'Advanced Mode', value: true },
      ],
      designerStep: 1,
      draftId: '',
      formSchema: {
        display: 'form',
        type: 'form',
        components: [],
      },
      reRenderFormIo: 0,
    };
  },
  computed: {
    ...mapFields('form', [
      'form.description',
      'form.idps',
      'form.name',
      'form.snake',
      'form.userType',
    ]),
    ID_MODE() {
      return IdentityMode;
    },
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
    ...mapActions('form', ['fetchForm']),
    ...mapActions('notifications', ['addNotification']),
    // TODO: Put this into vuex form module
    async getFormSchema() {
      if (this.versionId) {
        try {
          const response = await formService.readVersion(
            this.formId,
            this.versionId
          );
          this.formSchema = { ...this.formSchema, ...response.data.schema };
        } catch (error) {
          this.addNotification({
            message: 'An error occurred while loading the form schema.',
            consoleError: `Error loading form ${this.formId} schema version ${this.versionId}: ${error}`,
          });
        }
      }
    },
    async loadFile(event) {
      // TODO: Add try/catch and error notify on failure?
      const file = event.target.files[0];
      const text = await file.text();
      this.formSchema = JSON.parse(text);
      // Key-changing to force a re-render of the formio component when we want to load a new schema after the page is already in
      this.reRenderFormIo += 1;
    },
    onExportClick() {
      let snek = this.snake;
      if (!this.snake) {
        snek = this.name
          .replace(/\s+/g, '_')
          .replace(/[^-_0-9a-z]/gi, '')
          .toLowerCase();
      }

      const a = document.createElement('a');
      a.href = `data:application/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(this.formSchema)
      )}`;
      a.download = `${snek}_schema.json`;
      a.style.display = 'none';
      a.classList.add('hiddenDownloadTextElement');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    async publishFormSchema() {
      if (this.draftId) {
        // If editing a form, add a new draft and then publish immediately
        try {
          await formService.publishDraft(this.formId, this.draftId);
        } catch (error) {
          this.addNotification({
            message:
              'An error occurred while attempting to publish this form. If you need to refresh or leave to try again later, you can Export the existing design on the page to save for later.',
            consoleError: `Error publishing form ${this.formId} schema version ${this.draftId}: ${error}`,
          });
        }
      }
    },
    async submitFormSchema() {
      if (this.formId) {
        // If editing a form, add a new draft and then publish immediately
        try {
          const { data } = await formService.createDraft(this.formId, {
            schema: this.formSchema,
          });
          this.draftId = data.id;
          this.formSchema = data.schema;

          // Once the form is done disable the native browser "leave site" message so they can quit without getting whined at
          window.onbeforeunload = null;

          // TODO: Automatically publishing for now - remove this when draft/publish UI flow is implemented
          this.publishFormSchema();

          // Navigate back to navigation page on success
          this.$router.push({
            name: 'FormManage',
            query: {
              f: this.formId,
            },
          });

          // Draft version is now the latest - update route to reflect that
          // this.$router.push({
          //   name: 'FormDesigner',
          //   query: {
          //     f: this.formId,
          //     v: this.draftId,
          //   },
          // });
        } catch (error) {
          this.addNotification({
            message:
              'An error occurred while attempting to update this form. If you need to refresh or leave to try again later, you can Export the existing design on the page to save for later.',
            consoleError: `Error updating form ${this.formId} schema version ${this.versionId}: ${error}`,
          });
        }
      } else {
        // If creating a new form, add the form and then a version
        try {
          const response = await formService.createForm({
            name: this.name,
            description: this.description,
            schema: this.formSchema,
            identityProviders: generateIdps({
              idps: this.idps,
              userType: this.userType,
            }),
          });
          // Add the schema to the newly created default version
          if (!response.data.versions || !response.data.versions[0]) {
            throw new Error(
              `createForm response does not include a form version: ${response.data.versions}`
            );
          }

          // Once the form is done disable the native browser "leave site" message so they can quit without getting whined at
          window.onbeforeunload = null;

          // Navigate back to navigation page on success
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
      this.fetchForm(this.formId);
    }
  },
  watch: {
    advancedForm() {
      this.reRenderFormIo += 1;
    },
    formSchema() {
      // Once they reach the designer, enable the typical "leave site" native browser warning
      window.onbeforeunload = () => true;
    },
  },
};
</script>

<style lang="scss" scoped>
// include bootstrap and formio styles for the form builder
@import '~bootstrap/dist/css/bootstrap.min.css';
@import "~font-awesome/css/font-awesome.min.css";
@import 'https://unpkg.com/formiojs@4.11.2/dist/formio.builder.min.css';
</style>
