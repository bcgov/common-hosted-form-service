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
      </v-col>
      <!-- form name -->
      <v-col cols="12" order="3">
        <h3 v-if="name">{{ name }}</h3>
      </v-col>
      <!-- version number-->
      <v-col cols="12" order="4">
        <em>Version: {{ this.displayVersion }}</em>
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
      ref="formioForm"
      @change="onChangeMethod"
      @render="onRenderMethod"
      @initialized="init"
      @addComponent="onAddSchemaComponent"
      @removeComponent="onRemoveSchemaComponent"
      class="form-designer"
      @formLoad="onFormLoad"
    />
    <InformationLinkPreviewDialog
      :showDialog="showHelpLinkDialog"
      @close-dialog="onShowClosePreveiwDialog"
      :component="component"
      :fcProactiveHelpImageUrl="fcProactiveHelpImageUrl"
    />

    <FloatButton
      placement="bottom-right"
      :baseFABItemsBGColor="'#ffffff'"
      :baseFABIconColor="'#1976D2'"
      :baseFABBorderColor="'#C0C0C0'"
      :fabZIndex="1"
      :size="'small'"
      fabItemsGap="7px"
      @undo="onUndoClick"
      @redo="onRedoClick"
      @save="submitFormSchema"
      :saving="saving"
      :savedStatus="savedStatus"
      :saved="saved"
      :isFormSaved="isFormSaved"
      :formId="formId"
      :draftId="draftId"
      :undoEnabled="undoEnabled() === 0 ? false : undoEnabled()"
      :redoEnabled="redoEnabled() === 0 ? false : redoEnabled()"
    />
  </div>
</template>

<script>
//import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import { FormBuilder } from 'vue-formio';
import { mapFields } from 'vuex-map-fields';
import { compare, applyPatch, deepClone } from 'fast-json-patch';
import templateExtensions from '@/plugins/templateExtensions';
import { formService } from '@/services';
import { IdentityMode } from '@/utils/constants';
import InformationLinkPreviewDialog from '@/components/infolinks/InformationLinkPreviewDialog.vue';
import { generateIdps } from '@/utils/transformUtils';
import FloatButton from '@/components/designer/FloatButton.vue';

export default {
  name: 'FormDesigner',
  components: {
    FormBuilder,
    FloatButton,
    InformationLinkPreviewDialog,
  },
  props: {
    draftId: String,
    formId: String,
    saved: {
      type: Boolean,
      default: false,
    },
    newVersion: {
      type: Boolean,
      default: false,
    },
    isSavedStatus: {
      type: String,
      default: 'Save',
    },
    versionId: String,
  },
  data() {
    return {
      items: [
        { title: 'Click Me' },
        { title: 'Click Me' },
        { title: 'Click Me' },
        { title: 'Click Me 2' },
      ],
      offset: true,
      savedStatus: this.isSavedStatus,
      isFormSaved: !this.newVersion,
      scrollTop: true,
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
        MAX_PATCHES: 30,
        originalSchema: null,
        redoClicked: false,
        undoClicked: false,
      },
      showHelpLinkDialog: false,
      component: {},
      isComponentRemoved: false,
    };
  },

  computed: {
    ...mapGetters('form', [
      'fcProactiveHelpGroupList',
      'fcProactiveHelpImageUrl',
    ]),
    ...mapGetters('auth', ['tokenParsed', 'user']),
    ...mapGetters('form', ['builder']),
    ...mapFields('form', [
      'form.description',
      'form.enableSubmitterDraft',
      'form.enableCopyExistingSubmission',
      'form.enableStatusUpdates',
      'form.idps',
      'form.name',
      'form.sendSubRecieviedEmail',
      'form.allowSubmitterToUploadFile',
      'form.showSubmissionConfirmation',
      'form.snake',
      'form.submissionReceivedEmails',
      'form.userType',
      'form.versions',
      'form.isDirty',
    ]),
    ID_MODE() {
      return IdentityMode;
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
              // To disable fields make it false here
              // textfield: true,
              // textarea: true,
              // number: true,
              // password: true,
              // checkbox: true,
              // selectboxes: true,
              // select: true,
              // radio: true,
              // button: true,
              email: false,
              url: false,
              phoneNumber: false,
              tags: false,
              address: false,
              datetime: false,
              day: false,
              time: false,
              currency: false,
              survey: false,
              signature: false,
              // Prevent duplicate appearance of orgbook component
              orgbook: false,
              bcaddress: false,
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
              bcaddress: true,
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
  },
  methods: {
    ...mapActions('form', [
      'fetchForm',
      'setDirtyFlag',
      'getFCProactiveHelpImageUrl',
    ]),
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
      this.setDirtyFlag(false);
      // Since change is triggered during loading
      this.onFormLoad();
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

    onFormLoad() {
      // Contains the names of every category of components
      let builder = this.$refs.formioForm.builder.instance.builder;
      if (Object.keys(this.fcProactiveHelpGroupList).length > 0) {
        for (const [groupName, elements] of Object.entries(
          this.fcProactiveHelpGroupList
        )) {
          let extractedElementsNames = this.extractPublishedElement(elements);
          for (const [key, builderElements] of Object.entries(builder)) {
            if (groupName === builderElements.title) {
              let containerId = `group-container-${key}`;
              let containerEl = document.getElementById(containerId);
              if (containerEl) {
                for (let i = 0; i < containerEl.children.length; i++) {
                  const self = this;
                  let elementName = containerEl.children[i].textContent.trim();
                  if (extractedElementsNames.includes(elementName)) {
                    // Append the info el
                    let child = document.createElement('i');

                    child.setAttribute(
                      'class',
                      'fa fa-info-circle info-helper'
                    );
                    child.style.float = 'right';
                    child.style.fontSize = '14px';
                    child.addEventListener('click', function () {
                      self.showHelperClicked(elementName, groupName);
                    });
                    containerEl.children[i].appendChild(child);
                  }
                }
              }
            }
          }
        }
      }
    },
    extractPublishedElement(elements) {
      let publishedComponentsNames = [];
      for (let element of elements) {
        if (element.status) {
          publishedComponentsNames.push(element.componentName);
        }
      }
      return publishedComponentsNames;
    },

    async showHelperClicked(elementName, groupName) {
      const elements = this.fcProactiveHelpGroupList[groupName];
      this.component = elements.find(
        (element) => element.componentName === elementName
      );
      await this.getFCProactiveHelpImageUrl(this.component.id);
      this.onShowClosePreveiwDialog();
    },
    onShowClosePreveiwDialog() {
      this.showHelpLinkDialog = !this.showHelpLinkDialog;
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
          // Component was pasted here or edited and saved
          if (this.patch.componentAddedStart) {
            this.addPatchToHistory();
          } else {
            // Tab changed, Edit saved, paste occurred
            if (typeof modified == 'boolean') {
              // Tab changed
              this.resetHistoryFlags();
            } else {
              // Edit saved or paste occurred
              this.addPatchToHistory();
            }
          }
        } else {
          // If we removed a component but not during an add action
          if (
            (!this.patch.componentAddedStart &&
              this.patch.componentRemovedStart) ||
            this.patch.componentMovedStart
          ) {
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
      // Determine if there is even a difference with the action
      const form = this.getPatch(this.patch.index + 1);
      const patch = compare(form, this.formSchema);

      if (patch.length > 0) {
        this.savedStatus = 'Save';
        this.isFormSaved = false;
        // Remove any actions past the action we were on
        this.patch.index += 1;
        if (this.patch.history.length > 0) {
          this.patch.history.length = this.patch.index;
        }
        // Add the patch to the history
        this.patch.history.push(patch);

        // If we've exceeded the limit on actions
        if (this.patch.history.length > this.patch.MAX_PATCHES) {
          // We need to set the original schema to the first patch
          const newHead = this.getPatch(0);
          this.patch.originalSchema = newHead;
          this.patch.history.shift();
          --this.patch.index;
        }
      }
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
    async undoPatchFromHistory() {
      // Only allow undo if there was an action made
      if (this.canUndoPatch()) {
        this.savedStatus = 'Save';
        this.isFormSaved = false;
        // Flag for formio to know we are setting the form
        this.patch.undoClicked = true;
        this.formSchema = this.getPatch(--this.patch.index);
      }
    },
    async redoPatchFromHistory() {
      // Only allow redo if there was an action made
      if (this.canRedoPatch()) {
        this.savedStatus = 'Save';
        this.isFormSaved = false;
        // Flag for formio to know we are setting the form
        this.patch.redoClicked = true;
        this.formSchema = this.getPatch(++this.patch.index);
      }
    },
    resetHistoryFlags(flag = false) {
      this.patch.componentAddedStart = flag;
      this.patch.componentMovedStart = flag;
      this.patch.componentRemovedStart = flag;
    },
    canUndoPatch() {
      return (
        this.patch.history.length &&
        this.patch.index >= 0 &&
        this.patch.index < this.patch.history.length
      );
    },
    canRedoPatch() {
      return (
        this.patch.history.length &&
        this.patch.index < this.patch.history.length - 1
      );
    },
    undoEnabled() {
      return this.canUndoPatch();
    },
    redoEnabled() {
      return this.canRedoPatch();
    },

    // ----------------------------------------------------------------------------------/ FormIO Handlers

    // ---------------------------------------------------------------------------------------------------
    // Saving the Schema
    // ---------------------------------------------------------------------------------------------------
    async submitFormSchema() {
      this.saving = true;
      await this.setDirtyFlag(false);
      try {
        this.saving = true;
        this.savedStatus = 'Saving';

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

        this.savedStatus = 'Saved';
        this.isFormSaved = true;
      } catch (error) {
        await this.setDirtyFlag(true);
        this.savedStatus = 'Not Saved';
        this.isFormSaved = false;
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
        enableCopyExistingSubmission: this.enableCopyExistingSubmission,
        enableStatusUpdates: this.enableStatusUpdates,
        showSubmissionConfirmation: this.showSubmissionConfirmation,
        allowSubmitterToUploadFile: this.allowSubmitterToUploadFile,
        submissionReceivedEmails: emailList,
        reminder_enabled: false,
      });

      // Navigate back to this page with ID updated
      this.$router
        .push({
          name: 'FormDesigner',
          query: {
            f: response.data.id,
            d: response.data.draft.id,
            sv: true,
            svs: 'Saved',
          },
        })
        .catch(() => {});
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
          svs: 'Saved',
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
        query: { ...this.$route.query, sv: true, svs: 'Saved' },
      });
    },
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

.formSubmit {
  background-color: red;
}

.formExport {
  position: sticky;
  top: 0;
  right: 0;

  position: -webkit-sticky;
}

.formImport {
  position: sticky;
  top: 0;
  right: 0;

  position: -webkit-sticky;
}

.formSetting {
  position: sticky;
  top: 0;
  right: 0;

  position: -webkit-sticky;
}
</style>
