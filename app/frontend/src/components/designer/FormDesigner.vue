<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <v-col cols="12" sm="6">
        <h1>Form Design</h1>
        <h3 v-if="name">{{ name }}</h3>
      </v-col>
      <v-spacer />
      <v-col class="text-sm-right" cols="12" sm="6">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              class="mx-1"
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
              class="mx-1"
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
              class="mx-1"
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
            <router-link
              :to="{ name: 'FormManage', query: { f: formId } }"
              :class="{ 'disabled-router': !formId }"
            >
              <v-btn
                class="mx-1"
                color="primary"
                :disabled="!formId"
                icon
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>settings</v-icon>
              </v-btn>
            </router-link>
          </template>
          <span>Manage Form</span>
        </v-tooltip>
      </v-col>
    </v-row>

    <p class="mb-3">
      <em>Version: {{ this.displayVersion }}</em>
    </p>

    <v-alert
      v-if="saved || saving"
      dense
      text
      :type="saving ? 'info' : 'success'"
    >
      <div v-if="saving">
        <v-progress-linear indeterminate />
        Saving
      </div>
      <div v-else>
        Your form has been successfully saved
        <router-link
          :to="{ name: 'FormPreview', query: { f: formId, d: draftId } }"
          target="_blank"
          class="mx-5"
        >
          Preview
        </router-link>
        <router-link :to="{ name: 'FormManage', query: { f: formId } }">
          Go to Manage Form to Publish
        </router-link>
      </div>
    </v-alert>

    <BaseInfoCard class="my-6">
      <h4 class="primary--text">
        <v-icon class="mr-1" color="primary">info</v-icon>IMPORTANT!
      </h4>
      <p class="my-0">
        Use the <strong>SAVE DESIGN</strong> button when you are done building
        this form.
      </p>
      <p class="my-0">
        The <strong>SUBMIT</strong> button is provided for your user to submit
        this form and will be activated after it is saved.
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
      @change="onChangeMethod"
      @render="onRenderMethod"
      @initialized="init"
      class="form-designer"
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
    draftId: String,
    formId: String,
    saved: {
      type: Boolean,
      default: false,
    },
    versionId: String,
  },
  data() {
    return {
      advancedForm: false,
      advancedItems: [
        { text: 'Simple Mode', value: false },
        { text: 'Advanced Mode', value: true },
      ],
      designerStep: 1,
      formSchema: {
        display: 'form',
        type: 'form',
        components: [],
      },
      displayVersion: 1,
      reRenderFormIo: 0,
      saving: false,
    };
  },
  computed: {
    ...mapFields('form', [
      'form.description',
      'form.enableStatusUpdates',
      'form.idps',
      'form.isDirty',
      'form.name',
      'form.sendSubRecieviedEmail',
      'form.showSubmissionConfirmation',
      'form.snake',
      'form.submissionReceivedEmails',
      'form.userType',
      'form.versions',
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

            layoutControls: {
              title: 'Layout',
              weight: 10,
              default: true,
              components: {
                simplecols2: true,
                simplecols3: true,
                simplecols4: true,
                simplefieldset: true,
                simplepanel: true,
                simpletabs: true,
                simpleheading: true,
                simpleparagraph: true,
                simplecontent: true,
              },
            },

            entryControls: {
              title: 'Form fields',
              weight: 20,
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
                simplefile: this.userType !== this.ID_MODE.PUBLIC,
              },
            },
            customControls: {
              title: 'BC Gov.',
              weight: 30,
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
            layout: {
              default: true,
              weight: 10,
            },
            basic: {
              title: 'Form Fields',
              weight: 20,
              default: false,
              components: {
                // add 'simplefile' file upload component to formBuilder in advanced mode
                simplefile: this.userType !== this.ID_MODE.PUBLIC,
              },
            },
            advanced: {
              weight: 30,
              components: {
                orgbook: false,
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
      }
    },
  },
  methods: {
    ...mapActions('form', ['fetchForm', 'setDirtyFlag']),
    ...mapActions('notifications', ['addNotification']),
    // TODO: Put this into vuex form module
    async getFormSchema() {
      try {
        let res;
        if (this.versionId) {
          // Making a new draft from a previous version
          res = await formService.readVersion(this.formId, this.versionId);
        } else if (this.draftId) {
          // Editing an existing draft
          res = await formService.readDraft(this.formId, this.draftId);
        }
        this.formSchema = { ...this.formSchema, ...res.data.schema };
      } catch (error) {
        this.addNotification({
          message: 'An error occurred while loading the form design.',
          consoleError: `Error loading form ${this.formId} schema (version: ${this.versionId} draft: ${this.draftId}): ${error}`,
        });
      }
      // get a version number to show in header
      this.displayVersion = this.versions.length + 1;
    },
    async loadFile(event) {
      try {
        const file = event.target.files[0];
        const fileReader = new FileReader();
        fileReader.addEventListener('load', () => {
          this.formSchema = JSON.parse(fileReader.result);
          // Key-changing to force a re-render of the formio component when we want to load a new schema after the page is already in
          this.reRenderFormIo += 1;
        });
        fileReader.readAsText(file);
      } catch (error) {
        this.addNotification({
          message: 'An error occurred while importing the form schema.',
          consoleError: `Error importing form schema : ${error}`,
        });
      }
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

    // ---------------------------------------------------------------------------------------------------
    // FormIO event handlers
    // ---------------------------------------------------------------------------------------------------
    init() {
      // Since change is triggered during loading
      this.setDirtyFlag(false);
    },
    onChangeMethod() {
      // Don't call an unnecessary action if already dirty
      if (!this.isDirty) this.setDirtyFlag(true);
    },
    onRenderMethod() {
      const el = document.querySelector('input.builder-sidebar_search:focus');
      if (el && el.value === '') this.reRenderFormIo += 1;
    },
    // ----------------------------------------------------------------------------------/ FormIO Handlers

    // ---------------------------------------------------------------------------------------------------
    // Saving the Schema
    // ---------------------------------------------------------------------------------------------------
    async submitFormSchema() {
      try {
        this.saving = true;
        // Once the form is done disable the "leave site/page" messages so they can quit without getting whined at
        await this.setDirtyFlag(false);

        if (this.formId) {
          if (this.versionId) {
            // If creating a new draft from an existing version
            await this.schemaCreateDraftFromVersion();
          } else if (this.draftId) {
            // If updating an existing draft
            await this.schemaUpdateExistingDraft();
          }
        } else {
          // If creating a new form, add the form and a draft
          await this.schemaCreateNew();
        }
      } catch (error) {
        await this.setDirtyFlag(true);
        this.addNotification({
          message:
            'An error occurred while attempting to save this form design. If you need to refresh or leave to try again later, you can Export the existing design on the page to save for later.',
          consoleError: `Error updating or creating form (FormID: ${this.formId}, versionId: ${this.versionId}, draftId: ${this.draftId}) Error: ${error}`,
        });
      } finally {
        this.saving = false;
      }
    },
    async schemaCreateNew() {
      const emailList =
        this.sendSubRecieviedEmail &&
        this.submissionReceivedEmails &&
        Array.isArray(this.submissionReceivedEmails)
          ? this.submissionReceivedEmails
          : [];
      const response = await formService.createForm({
        name: this.name,
        description: this.description,
        schema: this.formSchema,
        identityProviders: generateIdps({
          idps: this.idps,
          userType: this.userType,
        }),
        enableStatusUpdates: this.enableStatusUpdates,
        showSubmissionConfirmation: this.showSubmissionConfirmation,
        submissionReceivedEmails: emailList,
      });

      // Navigate back to this page with ID updated
      this.$router.push({
        name: 'FormDesigner',
        query: {
          f: response.data.id,
          d: response.data.draft.id,
          sv: true,
        },
      });
    },
    async schemaCreateDraftFromVersion() {
      const { data } = await formService.createDraft(this.formId, {
        schema: this.formSchema,
        formVersionId: this.versionId,
      });
      // Navigate back to this page with ID updated
      this.$router.push({
        name: 'FormDesigner',
        query: {
          f: this.formId,
          d: data.id,
          sv: true,
        },
      });
    },
    async schemaUpdateExistingDraft() {
      await formService.updateDraft(this.formId, this.draftId, {
        schema: this.formSchema,
      });
      // Update this route with saved flag
      this.$router.replace({
        name: 'FormDesigner',
        query: { ...this.$route.query, sv: true },
      });
    },
    // ----------------------------------------------------------------------------------/ Saving Schema
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
    // if form userType (public, idir, team, etc) changes, re-render the form builder
    userType() {
      this.reRenderFormIo += 1;
    },
  },
};
</script>


<style lang="scss" scoped>
@import '~font-awesome/css/font-awesome.min.css';
@import 'https://unpkg.com/formiojs@4.13.0/dist/formio.builder.min.css';

/* disable router-link */
.disabled-router {
  pointer-events: none;
}
</style>
