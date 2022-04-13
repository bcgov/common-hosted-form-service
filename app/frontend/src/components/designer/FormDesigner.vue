<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>Form Design</h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              class="mx-md-1 mx-0"
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
              :disabled="!undoEnabled"
              class="mx-1"
              @click="onUndoClick"
              color="primary"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>undo</v-icon>
              {{ undoCount }}
            </v-btn>
          </template>
          <span>Undo</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              :disabled="!redoEnabled"
              class="mx-1"
              @click="onRedoClick"
              color="primary"
              icon
              v-bind="attrs"
              v-on="on"
            >
              {{ redoCount }}
              <v-icon>redo</v-icon>
            </v-btn>
          </template>
          <span>Redo</span>
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
      <!-- form name -->
      <v-col cols="12" order="3">
        <h3 v-if="name">{{ name }}</h3>
      </v-col>
      <!-- version number-->
      <v-col class="mb-3" cols="12" order="4">
        <em>Version: {{ this.displayVersion }}</em>
      </v-col>
    </v-row>
    <v-alert
      :value="saved || saving"
      :class="
        saving
          ? NOTIFICATIONS_TYPES.INFO.class
          : NOTIFICATIONS_TYPES.SUCCESS.class
      "
      :color="
        saving
          ? NOTIFICATIONS_TYPES.INFO.color
          : NOTIFICATIONS_TYPES.SUCCESS.color
      "
      :icon="
        saving
          ? NOTIFICATIONS_TYPES.INFO.icon
          : NOTIFICATIONS_TYPES.SUCCESS.icon
      "
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
      @addComponent="onAddComponentMethod"
      @removeComponent="onRemoveComponentMethod"
      @updateComponent="onUpdateComponentMethod"
      class="form-designer"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { FormBuilder } from 'vue-formio';
import { mapFields } from 'vuex-map-fields';

import templateExtensions from '@/plugins/templateExtensions';
import { formService } from '@/services';
import { IdentityMode, NotificationTypes } from '@/utils/constants';
import { generateIdps } from '@/utils/transformUtils';

var _ = require('lodash');
var deepFreeze = require('deep-freeze');

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
      patchHistory: [],
      patchIndex: -1,
      patchHistoryUndo: false,
      patchHistoryRedo: false,
      undoEnabled: false,
      redoEnabled: false,
      componentAdded: null,
      componentRemoved: false,
      componentUpdated: false,
      componentMoved: false,
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
      return (this.patchHistory.length > 0) ? (this.patchIndex + 1) : 0;
    },
    redoCount() {
      return ((this.patchHistory.length > 0 ? this.patchHistory.length - this.patchIndex - 1 : 0));
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
        if (this.patchHistory.length === 0) {
          this.originalSchema = JSON.parse(JSON.stringify(_.cloneDeep(this.formSchema)));
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
          // Key-changing to force a re-render of the formio component when we want to load a new schema after the page is already in
          this.reRenderFormIo += 1;
          this.addPatchToHistory();
          this.patchHistoryUndo = false;
          this.patchHistoryRedo = false;
          this.componentAdded = false;
          this.componentRemoved = false;
          this.componentUpdated = false;
          this.componentMoved = false;
          this.undoEnabled = this.canUndoPatch();
          this.redoEnabled = this.canRedoPatch();
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
    onChangeMethod(_changed, _flags, _modified) {
      // Don't call an unnecessary action if already dirty
      if (!this.isDirty) this.setDirtyFlag(true);

      if (!this.patchHistoryUndo && !this.patchHistoryRedo) {
        if (_flags !== undefined && _modified !== undefined) {
          if (this.componentAdded !== null) {
            this.addPatchToHistory();
          } else {
            this.componentAdded = false;
            this.componentMoved = false;
            this.componentUpdated = false;
            this.componentRemoved = false;
          }
        } else {
          if (this.componentRemoved) {
            // Component was removed..
            this.addPatchToHistory();
          } else if (this.componentMoved) {
            this.addPatchToHistory();
          } else {
            this.componentAdded = false;
            this.componentMoved = false;
            this.componentUpdated = false;
            this.componentRemoved = false;
          }
        }
      } else {
        this.patchHistoryUndo = false;
        this.patchHistoryRedo = false;
        this.componentAdded = false;
        this.componentRemoved = false;
        this.componentUpdated = false;
        this.componentMoved = false;
      }

      this.undoEnabled = this.canUndoPatch();
      this.redoEnabled = this.canRedoPatch();
    },
    onRenderMethod() {
      const el = document.querySelector('input.builder-sidebar_search:focus');
      if (el && el.value === '') this.reRenderFormIo += 1;
      this.setDirtyFlag(false);

      this.undoEnabled = this.canUndoPatch();
      this.redoEnabled = this.canRedoPatch();
    },
    onAddComponentMethod(_info, _parent, _path, _index, _isNew) {
      if (_isNew) {
        // Component Add Start, the user can still cancel/remove the add
        this.componentAdded = true;
      } else {
        // The user has initiated a move
        this.componentMoved = true;
      }
    },
    onRemoveComponentMethod(_component, _schema, _path, _index) {
      // Component remove start
      this.componentRemoved = true;
    },
    onUpdateComponentMethod(_component) {
      this.componentUpdated = true;
    },
    // ----------------------------------------------------------------------------------/ FormIO Handlers

    // ---------------------------------------------------------------------------------------------------
    // Patch History
    // ---------------------------------------------------------------------------------------------------
    addPatchToHistory() {
      if (this.patchHistory.length > 0) {
        this.patchHistory.length = this.patchIndex + 1;
      }
      this.patchIndex++;

      // Add the patch to the history
      this.patchHistory.push(deepFreeze(JSON.parse(JSON.stringify(_.cloneDeep(this.formSchema)))));

      this.componentAdded = false;
      this.componentMoved = false;
      this.componentUpdated = false;
      this.componentRemoved = false;
    },
    getPatch(idx) {
      // Generate the form from the base patch
      var form = JSON.parse(JSON.stringify(_.cloneDeep(this.originalSchema)));
      if (this.patchIndex > -1 && this.patchHistory.length > 0) {
        form = _.cloneDeep(this.patchHistory[idx]);
      }
      return form;
    },
    undoPatchFromHistory() {
      // Only allow undo if there was an action made
      if (this.canUndoPatch()) {
        // Flag for formio to know we are setting the form
        this.patchHistoryUndo = true;
        this.patchIndex--;
        this.formSchema = this.getPatch(this.patchIndex);
      }
    },
    redoPatchFromHistory() {
      // Only allow redo if there was an action made
      if (this.canRedoPatch()) {
        // Flag for formio to know we are setting the form
        this.patchHistoryRedo = true;
        this.patchIndex++;
        this.formSchema = this.getPatch(this.patchIndex);
      }
    },
    canUndoPatch() {
      if (this.patchHistory.length == 0) return false;
      if (this.patchIndex > this.patchHistory.length) return false;
      if (this.patchIndex < 0) return false;
      return true;
    },
    canRedoPatch() {
      if (this.patchHistory.length == 0) return false;
      if (this.patchIndex >= (this.patchHistory.length - 1)) return false;
      return true;
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
    async onUndoClick() {
      this.undoPatchFromHistory();
    },
    async onRedoClick() {
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
  mounted() {
    this.originalSchema = JSON.parse(JSON.stringify(_.cloneDeep(this.formSchema)));
    deepFreeze(this.originalSchema);
  },
  watch: {
    // if form userType (public, idir, team, etc) changes, re-render the form builder
    userType() {
      this.reRenderFormIo += 1;
    },
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
</style>
