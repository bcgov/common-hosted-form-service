<template>
  <v-row>
    <v-col>
      <v-alert
        :value="saved || saving"
        :class="
          saving
            ? NOTIFICATIONS_TYPES.INFO.class
            : NOTIFICATIONS_TYPES.SUCCESS.class"
        :color="
          saving
            ? NOTIFICATIONS_TYPES.INFO.color
            : NOTIFICATIONS_TYPES.SUCCESS.color"
        :icon="
          saving
            ? NOTIFICATIONS_TYPES.INFO.icon
            : NOTIFICATIONS_TYPES.SUCCESS.icon"
        transition="scale-transition"
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
      <div>
        <v-row class="mt-6 fixed" no-gutters>
          <v-col>
            <v-row>
              <v-col cols="12" sm="6" order="2" order-sm="1">
                <div>
                  <h1>Form Design</h1>
                </div>
                <div>
                  <h3 v-if="name">{{ name }}</h3>
                </div>
                <div>
                  <em>Version: {{ this.displayVersion }}</em>
                </div>
              </v-col>
            </v-row>
          </v-col>
          <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
            <FormDesignActionButton
              @form-schema-submit="submitFormSchema"
              @form-schema-export="onExportClick"
              @load-form-schema="loadFile"
              @on-redo-schema="onRedoClick"
              @on-undo-schema="onUndoClick"
              :formId="formId"
              :undoCount="undoCount"
              :undoEnabled="undoEnabled"
              :redoEnabled="redoEnabled"
              :redoCount="redoCount"
            />
          </v-col>    
        </v-row>
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
        <FormBuilder
          :form="formSchema"
          :key="reRenderFormIo"
          :options="designerOptions"
          @change="onChangeMethod"
          @render="onRenderMethod"
          @initialized="init"
          @addComponent="onAddSchemaComponent"
          @removeComponent="onRemoveSchemaComponent"
          class="form-designer"
        /> 
      </div>
      <v-row>
        <v-col cols="12" sm="6" order="2" order-sm="1">
          <v-btn class="my-4" outlined @click="createStepper">
            <span>Back</span>
          </v-btn>
        </v-col>   
        <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
          <FormDesignActionButton
            @form-schema-submit="submitFormSchema"
            @form-schema-export="onExportClick"
            @load-form-schema="loadFile"
            @on-redo-schema="onRedoClick"
            @on-undo-schema="onUndoClick"
            :formId="formId"
            :undoCount="undoCount"
            :undoEnabled="undoEnabled"
            :redoEnabled="redoEnabled"
            :redoCount="redoCount"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { FormBuilder } from 'vue-formio';
import { mapFields } from 'vuex-map-fields';
import { compare, applyPatch, deepClone } from 'fast-json-patch';
import templateExtensions from '@/plugins/templateExtensions';
import { formService } from '@/services';
import { IdentityMode, NotificationTypes } from '@/utils/constants';
import { generateIdps } from '@/utils/transformUtils';
import FormDesignActionButton from '@/components/designer/FormDesignActionButton';

export default {
  name: 'FormDesigner',
  components: {
    FormBuilder,
    FormDesignActionButton
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
      patch: {
        componentAddedStart: false,
        componentRemovedStart: false,
        componentMovedStart: false,
        history: [],
        index: -1,
        redoClicked: false,
        undoClicked: false,
        originalSchema: null,
      },
    };
  },
  computed: {
    ...mapGetters('auth', ['tokenParsed', 'user']),
    ...mapFields('form', [
      'form.description',
      'form.enableSubmitterDraft',
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
    NOTIFICATIONS_TYPES() {
      return NotificationTypes;
    },
    designerOptions() {
      return {
        sanitizeConfig: {
          addTags: ['iframe'],
          ALLOWED_TAGS: ['iframe'],
        },
        noDefaultSubmitButton: false,
        builder: {
          basic: false,
          premium: false,
          layoutControls: {
            title: 'Basic Layout',
            default: true,
            weight: 10,
            components: {
              simplecols2: true,
              simplecols3: true,
              simplecols4: true,
              simplecontent: true,
              simplefieldset: false,
              simpleheading: false,
              simplepanel: true,
              simpleparagraph: false,
              simpletabs: true,
            },
          },
          entryControls: {
            title: 'Basic Fields',
            weight: 20,
            components: {
              simplecheckbox: true,
              simplecheckboxes: true,
              simpledatetime: true,
              simpleday: true,
              simpleemail: true,
              simplenumber: true,
              simplephonenumber: true,
              simpleradios: true,
              simpleselect: true,
              simpletextarea: true,
              simpletextfield: true,
              simpletime: false,
            },
          },
          layout: {
            title: 'Advanced Layout',
            weight: 30,
          },
          advanced: {
            title: 'Advanced Fields',
            weight: 40,
            components: {
              // Need to re-define Formio basic fields here
              textfield: true,
              textarea: true,
              number: true,
              password: true,
              checkbox: true,
              selectboxes: true,
              select: true,
              radio: true,
              button: true,
              // Prevent duplicate appearance of orgbook component
              orgbook: false,
            },
          },
          data: {
            title: 'Advanced Data',
            weight: 50,
          },
          customControls: {
            title: 'BC Government',
            weight: 60,
            components: {
              orgbook: true,
              simplefile: this.userType !== this.ID_MODE.PUBLIC,
            },
          },
        },
        templates: templateExtensions,
        evalContext: {
          token: this.tokenParsed,
          user: this.user,
        },
      };
    },
    undoCount() {
      return this.patch.history.length > 0 ? this.patch.index + 1 : 0;
    },
    redoCount() {
      return this.patch.history.length > 0 ? this.patch.history.length - this.patch.index - 1 : 0;
    },
    undoEnabled() {
      return this.canUndoPatch();
    },
    redoEnabled() {
      return this.canRedoPatch();
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
        if (this.patch.history.length === 0) {
          // We are fetching an existing form, so we get the original schema here because
          // using the original schema in the mount will give you the default schema
          this.patch.originalSchema = deepClone(this.formSchema);
        }
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
          this.addPatchToHistory();
          this.patch.undoClicked = false;
          this.patch.redoClicked = false;
          this.resetHistoryFlags();
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
    },
    onChangeMethod(changed, flags, modified) {
      // Don't call an unnecessary action if already dirty
      if (!this.isDirty) this.setDirtyFlag(true);

      this.onSchemaChange(changed, flags, modified);
    },
    onRenderMethod() {
      const el = document.querySelector('input.builder-sidebar_search:focus');
      if (el && el.value === '') this.reRenderFormIo += 1;
      this.setDirtyFlag(false);
    },
    onAddSchemaComponent(_info, _parent, _path, _index, isNew) {
      if (isNew) {
        // Component Add Start, the user can still cancel/remove the add
        this.patch.componentAddedStart = true;
      } else {
        // The user has initiated a move
        this.patch.componentMovedStart = true;
      }
    },
    onRemoveSchemaComponent() {
      // Component remove start
      this.patch.componentRemovedStart = true;
    },
    createStepper(){
      this.$emit('create-stepper');
    },
    // ----------------------------------------------------------------------------------/ FormIO Handlers

    // ---------------------------------------------------------------------------------------------------
    // Patch History
    // ---------------------------------------------------------------------------------------------------
    onSchemaChange(_changed, flags, modified) {
      // If the form changed but was not done so through the undo
      // or redo button
      if (!this.patch.undoClicked && !this.patch.redoClicked) {
        // flags and modified are defined when a component is added
        if (flags !== undefined && modified !== undefined) {
          if (this.patch.componentAddedStart !== null) {
            this.addPatchToHistory();
          } else {
            this.resetHistoryFlags();
          }
        } else {
          // If we removed a component but not during an add action
          if ((!this.patch.componentAddedStart && this.patch.componentRemovedStart) || this.patch.componentMovedStart) {
            // Component was removed or moved
            this.addPatchToHistory();
          }
        }
      } else {
        // We pressed undo or redo, so we just ignore
        // adding the action to the history
        this.patch.undoClicked = false;
        this.patch.redoClicked = false;
        this.resetHistoryFlags();
      }
    },
    addPatchToHistory() {
      // Remove any actions past the action we were on
      if (this.patch.history.length > 0) {
        this.patch.history.length = this.patch.index + 1;
      }

      // Get the differences between the last patch 
      // and the current form
      const form = this.getPatch(++this.patch.index);
      const patch = compare(form, this.formSchema);
      // Add the patch to the history
      this.patch.history.push(patch);

      this.resetHistoryFlags();
    },
    getPatch(idx) {
      // Generate the form from the original schema
      let form = deepClone(this.patch.originalSchema);
      if (this.patch.index > -1 && this.patch.history.length > 0) {
        // Apply all patches until we reach the requested patch
        for (let i = -1; i < idx; i++) {
          let patch = this.patch.history[i + 1];
          if (patch !== undefined) {
            // remove reactivity from the form so we don't affect the original schema
            form = deepClone(applyPatch(form, patch).newDocument);
          }
        }
      }
      return form;
    },
    undoPatchFromHistory() {
      // Only allow undo if there was an action made
      if (this.canUndoPatch()) {
        // Flag for formio to know we are setting the form
        this.patch.undoClicked = true;
        this.patch.index--;
        this.formSchema = this.getPatch(this.patch.index);
      }
    },
    redoPatchFromHistory() {
      // Only allow redo if there was an action made
      if (this.canRedoPatch()) {
        // Flag for formio to know we are setting the form
        this.patch.redoClicked = true;
        this.patch.index++;
        this.formSchema = this.getPatch(this.patch.index);
      }
    },
    resetHistoryFlags(flag = false) {
      this.patch.componentAddedStart = flag;
      this.patch.componentMovedStart = flag;
      this.patch.componentRemovedStart = flag;
    },
    canUndoPatch() {
      return this.patch.history.length && this.patch.index >= 0 && this.patch.index < this.patch.history.length;
    },
    canRedoPatch() {
      return this.patch.history.length && this.patch.index < (this.patch.history.length - 1);
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
    onUndoClick() {
      this.undoPatchFromHistory();
    },
    onRedoClick() {
      this.redoPatchFromHistory();
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
        enableSubmitterDraft: this.enableSubmitterDraft,
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
      }).catch(()=>{});
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
      }).catch(()=>{});
    },
    async schemaUpdateExistingDraft() {
      await formService.updateDraft(this.formId, this.draftId, {
        schema: this.formSchema,
      });
      // Update this route with saved flag
      this.$router.replace({
        name: 'FormDesigner',
        query: { ...this.$route.query, sv: true },
      }).catch(()=>{});
    },
    // ----------------------------------------------------------------------------------/ Saving Schema
  },
  created() {
    if (this.formId) {
      this.getFormSchema();
      this.fetchForm(this.formId);
    }
  },
  mounted() {
    if (!this.formId) {
      // We are creating a new form, so we obtain the original schema here.
      this.patch.originalSchema = deepClone(this.formSchema);
    }
  },
  watch: {
    // if form userType (public, idir, team, etc) changes, re-render the form builder
    userType() {
      this.reRenderFormIo += 1;
    }
  },
};
</script>

<style lang="scss" scoped>
@import '~font-awesome/css/font-awesome.min.css';
@import '~formiojs/dist/formio.builder.min.css';

/* disable router-link */
.disabled-router {
  pointer-events: none;
}


.formSubmit{
  background-color:red;
}

.formExport{
 position: sticky;
 top:0;
  right:0;

 position: -webkit-sticky;
}

.formImport{
  position: sticky;
  top:0;
  right:0;

 position: -webkit-sticky;
}

.formSetting{
 position: sticky;
 top:0;
  right:0;
 
 position: -webkit-sticky;
}

</style>
