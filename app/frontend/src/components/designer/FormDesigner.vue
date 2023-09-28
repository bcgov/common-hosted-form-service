<script>
import { FormBuilder } from '@formio/vue';
import { compare, applyPatch, deepClone } from 'fast-json-patch';
import { mapActions, mapState } from 'pinia';

import BaseInfoCard from '~/components/base/BaseInfoCard.vue';
import FloatButton from '~/components/designer/FloatButton.vue';
import ProactiveHelpPreviewDialog from '~/components/infolinks/ProactiveHelpPreviewDialog.vue';
import { i18n } from '~/internationalization';
import formioIl8next from '~/internationalization/trans/formio/formio.json';
import templateExtensions from '~/plugins/templateExtensions';
import { formService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { IdentityMode, NotificationTypes } from '~/utils/constants';
import { generateIdps } from '~/utils/transformUtils';

export default {
  components: {
    BaseInfoCard,
    FormBuilder,
    FloatButton,
    ProactiveHelpPreviewDialog,
  },
  props: {
    draftId: {
      type: String,
      default: null,
    },
    formId: {
      type: String,
      default: null,
    },
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
    versionId: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      canSave: false,
      component: {},
      displayVersion: 1,
      formSchema: {
        display: 'form',
        type: 'form',
        components: [],
      },
      isFormSaved: !this.newVersion,
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
      reRenderFormIo: 0,
      savedStatus: this.isSavedStatus,
      saving: false,
      showHelpLinkDialog: false,
    };
  },
  computed: {
    ...mapState(useFormStore, [
      'fcProactiveHelpGroupList',
      'fcProactiveHelpImageUrl',
      'builder',
      'form',
      'isRTL',
      'lang',
    ]),
    ...mapState(useAuthStore, ['tokenParsed', 'user']),
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
              simplebcaddress: false,
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
              simplefile: this.form.userType !== this.ID_MODE.PUBLIC,
              bcaddress: true,
              simplebcaddress: true,
            },
          },
        },
        language: this.lang ? this.lang : 'en',
        i18n: formioIl8next,
        templates: templateExtensions,
        evalContext: {
          token: this.tokenParsed,
          user: this.user,
        },
      };
    },
  },
  watch: {
    form(newValue, oldValue) {
      if (newValue.userType !== oldValue.userType) {
        this.reRenderFormIo += 1;
      }
    },
    lang(value) {
      if (value) {
        this.reRenderFormIo += 1;
      }
    },
  },
  created() {
    if (this.formId) {
      Promise.all([this.fetchForm(this.formId), this.getFormSchema()]);
    }
  },
  mounted() {
    if (!this.formId) {
      // We are creating a new form, so we obtain the original schema here.
      this.patch.originalSchema = deepClone(this.formSchema);
    }
  },

  methods: {
    ...mapActions(useFormStore, [
      'fetchForm',
      'setDirtyFlag',
      'getFCProactiveHelpImageUrl',
    ]),
    ...mapActions(useNotificationStore, ['addNotification']),

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
        this.formSchema = {
          ...this.formSchema,
          ...res.data.schema,
        };
        if (this.patch.history.length === 0) {
          // We are fetching an existing form, so we get the original schema here because
          // using the original schema in the mount will give you the default schema
          this.patch.originalSchema = deepClone(this.formSchema);
        }
        this.reRenderFormIo += 1;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.formDesigner.formLoadErrMsg'),
          consoleError: i18n.t('trans.formDesigner.formLoadConsoleErrMsg', {
            formId: this.formId,
            versionId: this.versionId,
            draftId: this.draftId,
            error: error,
          }),
        });
      }
      // get a version number to show in header
      this.displayVersion = this.form.versions.length + 1;
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
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.formDesigner.formSchemaImportErrMsg'),
          consoleError: i18n.t(
            'trans.formDesigner.formSchemaImportConsoleErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },
    onExportClick() {
      let snek = this.form.snake;
      if (!this.form.snake) {
        snek = this.form.name
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
      if (!this.form.isDirty) this.setDirtyFlag(true);

      this.onSchemaChange(changed, flags, modified);
    },
    onRenderMethod() {
      const el = document.querySelector('input.builder-sidebar_search:focus');
      if (el && el === '') this.reRenderFormIo += 1;
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
                      this.showHelperClicked(elementName, groupName);
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
      this.onShowClosePreviewDialog();
    },
    onShowClosePreviewDialog() {
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
          this.canSave = true;
          modified?.components?.map((comp) => {
            if (comp.key === 'form') {
              this.addNotification({
                ...NotificationTypes.ERROR,
                message: this.$t('trans.formDesigner.fieldnameError', {
                  label: comp.label,
                }),
              });
              this.canSave = false;
            }
          });
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
      const frm = this.getPatch(this.patch.index + 1);
      const ptch = compare(frm, this.formSchema);

      if (ptch.length > 0) {
        this.canSave = true;
        this.savedStatus = 'Save';
        this.isFormSaved = false;
        // Remove any actions past the action we were on
        this.patch.index += 1;
        if (this.patch.history.length > 0) {
          this.patch.history.length = this.patch.index;
        }
        // Add the patch to the history
        this.patch.history.push(ptch);

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
      let frm = deepClone(this.patch.originalSchema);
      if (this.patch.index > -1 && this.patch.history.length > 0) {
        // Apply all patches until we reach the requested patch
        for (let i = -1; i < idx; i++) {
          let ptch = this.patch.history[i + 1];
          if (ptch !== undefined) {
            // remove reactivity from the form so we don't affect the original schema
            frm = deepClone(applyPatch(frm, ptch).newDocument);
          }
        }
      }
      return frm;
    },
    async undoPatchFromHistory() {
      // Only allow undo if there was an action made
      if (this.canUndoPatch()) {
        this.savedStatus = 'Save';
        this.isFormSaved = false;
        this.canSave = true;
        // Flag for formio to know we are setting the form
        this.patch.undoClicked = true;
        this.formSchema = this.getPatch(--this.patch.index);
        this.reRenderFormIo += 1;
      }
    },
    async redoPatchFromHistory() {
      // Only allow redo if there was an action made
      if (this.canRedoPatch()) {
        this.savedStatus = 'Save';
        this.isFormSaved = false;
        this.canSave = true;
        // Flag for formio to know we are setting the form
        this.patch.redoClicked = true;
        this.formSchema = this.getPatch(++this.patch.index);
        this.reRenderFormIo += 1;
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
        this.canSave = false;
      } catch (error) {
        await this.setDirtyFlag(true);
        const notificationStore = useNotificationStore();
        this.savedStatus = 'Not Saved';
        this.isFormSaved = false;
        notificationStore.addNotification({
          text: i18n.t('trans.formDesigner.formDesignSaveErrMsg'),
          consoleError: i18n.t(
            'trans.formDesigner.formSchemaImportConsoleErrMsg',
            {
              formId: this.formId,
              versionId: this.versionId,
              draftId: this.draftId,
              error: error,
            }
          ),
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
        this.form.sendSubReceivedEmail &&
        this.form.submissionReceivedEmails &&
        Array.isArray(this.form.submissionReceivedEmails)
          ? this.form.submissionReceivedEmails
          : [];

      const response = await formService.createForm({
        name: this.form.name,
        description: this.form.description,
        schema: this.formSchema,
        identityProviders: generateIdps({
          idps: this.form.idps,
          userType: this.form.userType,
        }),
        enableSubmitterDraft: this.form.enableSubmitterDraft,
        enableCopyExistingSubmission: this.form.enableCopyExistingSubmission,
        enableStatusUpdates: this.form.enableStatusUpdates,
        showSubmissionConfirmation: this.form.showSubmissionConfirmation,
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

    // ----------------------------------------------------------------------------------/ Patch History
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <!-- page title -->
      <div :lang="lang">
        <h1>{{ $t('trans.formDesigner.formDesign') }}</h1>
        <h3 v-if="form.name">{{ form.name }}</h3>
        <em :lang="lang"
          >{{ $t('trans.formDesigner.version') }} : {{ displayVersion }}</em
        >
      </div>
      <!-- buttons -->
      <div>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              class="mx-1"
              color="primary"
              icon
              size="x-small"
              v-bind="props"
              @click="onExportClick"
            >
              <v-icon icon="mdi:mdi-download"></v-icon>
            </v-btn>
          </template>
          <span :lang="lang">{{ $t('trans.formDesigner.exportDesign') }}</span>
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              class="mx-1"
              color="primary"
              icon
              size="x-small"
              v-bind="props"
              @click="$refs.uploader.click()"
            >
              <v-icon icon="mdi:mdi-publish"></v-icon>
              <input
                ref="uploader"
                class="d-none"
                type="file"
                accept=".json"
                @change="loadFile"
              />
            </v-btn>
          </template>
          <span :lang="lang">{{ $t('trans.formDesigner.importDesign') }}</span>
        </v-tooltip>
      </div>
    </div>
    <BaseInfoCard class="my-6" :class="{ 'dir-rtl': isRTL }">
      <h4 class="text-primary" :lang="lang">
        <v-icon
          :class="isRTL ? 'ml-1' : 'mr-1'"
          color="primary"
          icon="mdi:mdi-information"
        ></v-icon
        >{{ $t('trans.formDesigner.important') }}!
      </h4>
      <p
        class="my-0"
        :lang="lang"
        v-html="$t('trans.formDesigner.formDesignInfoA')"
      ></p>
      <p
        class="my-0"
        :lang="lang"
        v-html="$t('trans.formDesigner.formDesignInfoB')"
      ></p>
    </BaseInfoCard>
    <FormBuilder
      ref="formioForm"
      :key="reRenderFormIo"
      :form="formSchema"
      :options="designerOptions"
      class="form-designer"
      :class="{ 'v-locale--is-ltr': isRTL }"
      @change="onChangeMethod"
      @render="onRenderMethod"
      @initialized="init"
      @addComponent="onAddSchemaComponent"
      @removeComponent="onRemoveSchemaComponent"
      @formLoad="onFormLoad"
    />
    <ProactiveHelpPreviewDialog
      :show-dialog="showHelpLinkDialog"
      :component="component"
      :fc-proactive-help-image-url="fcProactiveHelpImageUrl"
      @close-dialog="onShowClosePreviewDialog"
    />
    <FloatButton
      placement="bottom-right"
      :base-f-a-b-items-b-g-color="'#ffffff'"
      :base-f-a-b-icon-color="'#1976D2'"
      :base-f-a-b-border-color="'#C0C0C0'"
      :fab-z-index="1"
      :size="'small'"
      fab-items-gap="7px"
      :saving="saving"
      :saved-status="savedStatus"
      :saved="saved"
      :is-form-saved="isFormSaved"
      :can-save="canSave"
      :form-id="formId"
      :draft-id="draftId"
      :undo-enabled="undoEnabled() === 0 ? false : undoEnabled()"
      :redo-enabled="redoEnabled() === 0 ? false : redoEnabled()"
      @undo="onUndoClick"
      @redo="onRedoClick"
      @save="submitFormSchema"
    />
  </div>
</template>

<style lang="scss">
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
