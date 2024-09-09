<script setup>
import { FormBuilder } from '@formio/vue';
import { compare, applyPatch, deepClone } from 'fast-json-patch';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import BaseInfoCard from '~/components/base/BaseInfoCard.vue';
import FloatButton from '~/components/designer/FloatButton.vue';
import ProactiveHelpPreviewDialog from '~/components/infolinks/ProactiveHelpPreviewDialog.vue';
import formioIl8next from '~/internationalization/trans/formio/formio.json';
import templateExtensions from '~/plugins/templateExtensions';
import { formService, userService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { IdentityMode } from '~/utils/constants';
import { generateIdps } from '~/utils/transformUtils';

const { t, locale } = useI18n({ useScope: 'global' });
const router = useRouter();

const properties = defineProps({
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
});

const canSave = ref(false);
const component = ref({});
const displayVersion = ref(1);
const formSchema = ref({
  display: 'form',
  type: 'form',
  components: [],
});
const isFormSaved = ref(!properties.newVersion);
const patch = ref({
  componentAddedStart: false,
  componentRemovedStart: false,
  componentMovedStart: false,
  history: [],
  index: -1,
  MAX_PATCHES: 30,
  originalSchema: null,
  redoClicked: false,
  undoClicked: false,
});
const reRenderFormIo = ref(0);
const savedStatus = ref(properties.isSavedStatus);
const saving = ref(false);
const showHelpLinkDialog = ref(false);

const authStore = useAuthStore();
const formStore = useFormStore();

const { tokenParsed, user } = storeToRefs(authStore);

const { fcProactiveHelpImageUrl, form, isRTL, userLabels } =
  storeToRefs(formStore);

const ID_MODE = computed(() => IdentityMode);
const designerOptions = computed(() => {
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
          simplefile: form.value.userType !== ID_MODE.value.PUBLIC,
          bcaddress: true,
          simplebcaddress: true,
        },
      },
    },
    language: locale.value ? locale.value : 'en',
    i18n: formioIl8next,
    templates: templateExtensions,
    evalContext: {
      token: tokenParsed.value,
      user: user.value,
    },
  };
});

watch(form, (newFormValue, oldFormValue) => {
  if (newFormValue.userType != oldFormValue.userType) {
    reRenderFormIo.value += 1;
  }
});

watch(locale, (value) => {
  if (value) {
    reRenderFormIo.value += 1;
  }
});

if (properties.formId) {
  Promise.all([formStore.fetchForm(properties.formId), getFormSchema()]);
}

onMounted(async () => {
  // load up headers for any External API calls
  // from components (component makes calls during design phase).
  await setProxyHeaders();
  if (!properties.formId) {
    // We are creating a new form, so we obtain the original schema here.
    patch.value.originalSchema = deepClone(formSchema.value);
  }
});

async function setProxyHeaders() {
  try {
    let response = await formService.getProxyHeaders({
      formId: properties.formId,
      versionId: properties.versionId,
    });
    // error checking for response
    sessionStorage.setItem(
      'X-CHEFS-PROXY-DATA',
      response.data['X-CHEFS-PROXY-DATA']
    );
  } catch (error) {
    // need error handling
  }
}

async function getFormSchema() {
  try {
    let res;
    if (properties.versionId) {
      // Making a new draft from a previous version
      res = await formService.readVersion(
        properties.formId,
        properties.versionId
      );
    } else if (properties.draftId) {
      // Editing an existing draft
      res = await formService.readDraft(properties.formId, properties.draftId);
    }
    formSchema.value = {
      ...formSchema.value,
      ...res.data.schema,
    };
    if (patch.value.history.length === 0) {
      // We are fetching an existing form, so we get the original schema here because
      // using the original schema in the mount will give you the default schema
      patch.value.originalSchema = deepClone(formSchema.value);
    }
    reRenderFormIo.value += 1;
  } catch (error) {
    const notificationStore = useNotificationStore();
    notificationStore.addNotification({
      text: t('trans.formDesigner.formLoadErrMsg'),
      consoleError: t('trans.formDesigner.formLoadConsoleErrMsg', {
        formId: properties.formId,
        versionId: properties.versionId,
        draftId: properties.draftId,
        error: error,
      }),
    });
  }
  // get a version number to show in header
  displayVersion.value = form.value.versions.length + 1;
}

async function loadFile(event) {
  try {
    const file = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
      formSchema.value = JSON.parse(fileReader.result);
      addPatchToHistory();
      patch.value.undoClicked = false;
      patch.value.redoClicked = false;
      resetHistoryFlags();
      // Key-changing to force a re-render of the formio component when we want to load a new schema after the page is already in
      reRenderFormIo.value += 1;
    });
    fileReader.readAsText(file);
  } catch (error) {
    const notificationStore = useNotificationStore();
    notificationStore.addNotification({
      text: t('trans.formDesigner.formSchemaImportErrMsg'),
      consoleError: t('trans.formDesigner.formSchemaImportConsoleErrMsg', {
        error: error,
      }),
    });
  }
}

function onExportClick() {
  let snek = form.value.snake;
  if (!form.value.snake) {
    snek = form.value.name
      .replace(/\s+/g, '_')
      .replace(/[^-_0-9a-z]/gi, '')
      .toLowerCase();
  }

  const a = document.createElement('a');
  a.href = `data:application/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(formSchema.value)
  )}`;
  a.download = `${snek}_schema.json`;
  a.style.display = 'none';
  a.classList.add('hiddenDownloadTextElement');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---------------------------------------------------------------------------------------------------
// FormIO event handlers
// ---------------------------------------------------------------------------------------------------
function init() {
  formStore.setDirtyFlag(false);
}

function onChangeMethod(changed, flags, modified) {
  // Don't call an unnecessary action if already dirty
  if (!form.value.isDirty) formStore.setDirtyFlag(true);

  onSchemaChange(changed, flags, modified);
}

function onRenderMethod() {
  const el = document.querySelector('input.builder-sidebar_search:focus');
  if (el && el === '') reRenderFormIo.value += 1;
  formStore.setDirtyFlag(false);
}

function onAddSchemaComponent(_info, _parent, _path, _index, isNew) {
  if (isNew) {
    // Component Add Start, the user can still cancel/remove the add
    patch.value.componentAddedStart = true;
  } else {
    // The user has initiated a move
    patch.value.componentMovedStart = true;
  }
}

function onRemoveSchemaComponent() {
  // Component remove start
  patch.value.componentRemovedStart = true;
}

function onShowClosePreviewDialog() {
  showHelpLinkDialog.value = !showHelpLinkDialog.value;
}

// ----------------------------------------------------------------------------------/ FormIO Handlers

// ---------------------------------------------------------------------------------------------------
// Patch History
// ---------------------------------------------------------------------------------------------------
function onSchemaChange(_changed, flags, modified) {
  // If the form changed but was not done so through the undo
  // or redo button
  if (!patch.value.undoClicked && !patch.value.redoClicked) {
    // flags and modified are defined when a component is added
    if (flags !== undefined && modified !== undefined) {
      // Component was pasted here or edited and saved
      if (patch.value.componentAddedStart) {
        addPatchToHistory();
      } else {
        // Tab changed, Edit saved, paste occurred
        if (typeof modified == 'boolean') {
          // Tab changed
          resetHistoryFlags();
        } else {
          // Edit saved or paste occurred
          addPatchToHistory();
        }
      }
      canSave.value = true;
      modified?.components?.map((comp) => {
        if (comp.key === 'form') {
          const notificationStore = useNotificationStore();
          const msg = t('trans.formDesigner.fieldnameError', {
            label: comp.label,
          });
          notificationStore.addNotification({
            text: msg,
            consoleError: msg,
          });
          canSave.value = false;
        }
      });
    } else {
      // If we removed a component but not during an add action
      if (
        (!patch.value.componentAddedStart &&
          patch.value.componentRemovedStart) ||
        patch.value.componentMovedStart
      ) {
        // Component was removed or moved
        addPatchToHistory();
      }
    }
  } else {
    // We pressed undo or redo, so we just ignore
    // adding the action to the history
    patch.value.undoClicked = false;
    patch.value.redoClicked = false;
    resetHistoryFlags();
  }
}

function addPatchToHistory() {
  // Determine if there is even a difference with the action
  const frm = getPatch(patch.value.index + 1);
  const ptch = compare(frm, formSchema.value);

  if (ptch.length > 0) {
    canSave.value = true;
    savedStatus.value = 'Save';
    isFormSaved.value = false;
    // Remove any actions past the action we were on
    patch.value.index += 1;
    if (patch.value.history.length > 0) {
      patch.value.history.length = patch.value.index;
    }
    // Add the patch to the history
    patch.value.history.push(ptch);

    // If we've exceeded the limit on actions
    if (patch.value.history.length > patch.value.MAX_PATCHES) {
      // We need to set the original schema to the first patch
      const newHead = getPatch(0);
      patch.value.originalSchema = newHead;
      patch.value.history.shift();
      --patch.value.index;
    }
  }
  resetHistoryFlags();
}

function getPatch(idx) {
  // Generate the form from the original schema
  let frm = deepClone(patch.value.originalSchema);
  if (patch.value.index > -1 && patch.value.history.length > 0) {
    // Apply all patches until we reach the requested patch
    for (let i = -1; i < idx; i++) {
      let ptch = patch.value.history[i + 1];
      if (ptch !== undefined) {
        // remove reactivity from the form so we don't affect the original schema
        frm = deepClone(applyPatch(frm, ptch).newDocument);
      }
    }
  }
  return frm;
}

async function undoPatchFromHistory() {
  // Only allow undo if there was an action made
  if (canUndoPatch()) {
    savedStatus.value = 'Save';
    isFormSaved.value = false;
    canSave.value = true;
    // Flag for formio to know we are setting the form
    patch.value.undoClicked = true;
    formSchema.value = getPatch(--patch.value.index);
    reRenderFormIo.value += 1;
  }
}

async function redoPatchFromHistory() {
  // Only allow redo if there was an action made
  if (canRedoPatch()) {
    savedStatus.value = 'Save';
    isFormSaved.value = false;
    canSave.value = true;
    // Flag for formio to know we are setting the form
    patch.value.redoClicked = true;
    formSchema.value = getPatch(++patch.value.index);
    reRenderFormIo.value += 1;
  }
}

function resetHistoryFlags(flag = false) {
  patch.value.componentAddedStart = flag;
  patch.value.componentMovedStart = flag;
  patch.value.componentRemovedStart = flag;
}

function canUndoPatch() {
  return (
    patch.value.history.length &&
    patch.value.index >= 0 &&
    patch.value.index < patch.value.history.length
  );
}

function canRedoPatch() {
  return (
    patch.value.history.length &&
    patch.value.index < patch.value.history.length - 1
  );
}

function undoEnabled() {
  return canUndoPatch();
}

function redoEnabled() {
  return canRedoPatch();
}

// ---------------------------------------------------------------------------------------------------
// Saving the Schema
// ---------------------------------------------------------------------------------------------------
async function submitFormSchema() {
  saving.value = true;
  await formStore.setDirtyFlag(false);
  try {
    saving.value = true;
    savedStatus.value = 'Saving';

    // Once the form is done disable the "leave site/page" messages so they can quit without getting whined at
    await formStore.setDirtyFlag(false);

    if (properties.formId) {
      if (properties.versionId) {
        // If creating a new draft from an existing version
        await schemaCreateDraftFromVersion();
      } else if (properties.draftId) {
        // If updating an existing draft
        await schemaUpdateExistingDraft();
      }
    } else {
      // If creating a new form, add the form and a draft
      await schemaCreateNew();
    }

    savedStatus.value = 'Saved';
    isFormSaved.value = true;
    canSave.value = false;
  } catch (error) {
    await formStore.setDirtyFlag(true);
    const notificationStore = useNotificationStore();
    savedStatus.value = 'Not Saved';
    isFormSaved.value = false;
    notificationStore.addNotification({
      text: t('trans.formDesigner.formDesignSaveErrMsg'),
      consoleError: t('trans.formDesigner.formSchemaImportConsoleErrMsg', {
        formId: properties.formId,
        versionId: properties.versionId,
        draftId: properties.draftId,
        error: error,
      }),
    });
  } finally {
    saving.value = false;
  }
}

async function onUndoClick() {
  undoPatchFromHistory();
}

async function onRedoClick() {
  redoPatchFromHistory();
}

async function schemaCreateNew() {
  const response = await formService.createForm({
    name: form.value.name,
    description: form.value.description,
    schema: formSchema.value,
    identityProviders: generateIdps({
      idps: form.value.idps,
      userType: form.value.userType,
    }),
    sendSubmissionReceivedEmail: form.value.sendSubmissionReceivedEmail,
    enableSubmitterDraft: form.value.enableSubmitterDraft,
    enableCopyExistingSubmission: form.value.enableCopyExistingSubmission,
    wideFormLayout: form.value.wideFormLayout,
    enableStatusUpdates: form.value.enableStatusUpdates,
    showSubmissionConfirmation: form.value.showSubmissionConfirmation,
    submissionReceivedEmails: form.value.submissionReceivedEmails,
    reminder_enabled: false,
    deploymentLevel: form.value.deploymentLevel,
    ministry: form.value.ministry,
    apiIntegration: form.value.apiIntegration,
    useCase: form.value.useCase,
    labels: form.value.labels,
  });
  // update user labels with any new added labels
  if (
    form.value.labels.some((label) => userLabels.value.indexOf(label) === -1)
  ) {
    const response = await userService.updateUserLabels(form.value.labels);
    userLabels.value = response.data;
  }

  // Navigate back to this page with ID updated
  router
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
}

async function schemaCreateDraftFromVersion() {
  const { data } = await formService.createDraft(properties.formId, {
    schema: formSchema.value,
    formVersionId: properties.versionId,
  });

  // Navigate back to this page with ID updated
  router.push({
    name: 'FormDesigner',
    query: {
      f: properties.formId,
      d: data.id,
      sv: true,
      svs: 'Saved',
    },
  });
}

async function schemaUpdateExistingDraft() {
  await formService.updateDraft(properties.formId, properties.draftId, {
    schema: formSchema.value,
  });

  // Update this route with saved flag
  router.replace({
    name: 'FormDesigner',
    query: { ...router.currentRoute.value.query, sv: true, svs: 'Saved' },
  });
}

// ----------------------------------------------------------------------------------/ Patch History
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <!-- page title -->
      <div :lang="locale">
        <h1>{{ $t('trans.formDesigner.formDesign') }}</h1>
        <h3 v-if="form.name">{{ form.name }}</h3>
        <em :lang="locale"
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
              :title="$t('trans.formDesigner.exportDesign')"
              @click="onExportClick"
            >
              <v-icon icon="mdi:mdi-download"></v-icon>
            </v-btn>
          </template>
          <span :lang="locale">{{
            $t('trans.formDesigner.exportDesign')
          }}</span>
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              class="mx-1"
              color="primary"
              icon
              size="x-small"
              v-bind="props"
              :title="$t('trans.formDesigner.importDesign')"
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
          <span :lang="locale">{{
            $t('trans.formDesigner.importDesign')
          }}</span>
        </v-tooltip>
      </div>
    </div>
    <BaseInfoCard class="my-6" :class="{ 'dir-rtl': isRTL }">
      <h4 class="text-primary" :lang="locale">
        <v-icon
          :class="isRTL ? 'ml-1' : 'mr-1'"
          color="primary"
          icon="mdi:mdi-information"
        ></v-icon
        >{{ $t('trans.formDesigner.important') }}!
      </h4>
      <p
        class="my-0"
        :lang="locale"
        v-html="$t('trans.formDesigner.formDesignInfoA')"
      ></p>
      <p
        class="my-0"
        :lang="locale"
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
    />
    <ProactiveHelpPreviewDialog
      :show-dialog="showHelpLinkDialog"
      :component="component"
      :fc-proactive-help-image-url="fcProactiveHelpImageUrl"
      @close-dialog="onShowClosePreviewDialog"
    />
    <FloatButton
      class="position-fixed bottom-0"
      style="right: 0"
      :saved-status="savedStatus"
      :is-form-saved="isFormSaved"
      :new-version="newVersion"
      :is-saving="saving"
      :saved="saved"
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
