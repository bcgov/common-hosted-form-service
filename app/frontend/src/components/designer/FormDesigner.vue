<script setup>
import { FormBuilder } from '@formio/vue';
import { compare, applyPatch, deepClone } from 'fast-json-patch';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import BaseInfoCard from '~/components/base/BaseInfoCard.vue';
import FloatButton from '~/components/designer/FloatButton.vue';
import { exportFormSchema, importFormSchemaFromFile } from '~/composables/form';
import formioIl8next from '~/internationalization/trans/formio/formio.json';
import templateExtensions from '~/plugins/templateExtensions';
import { formService, userService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { FormDesignerBuilderOptions, IdentityMode } from '~/utils/constants';
import { generateIdps } from '~/utils/transformUtils';

const { locale, t } = useI18n({ useScope: 'global' });
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

const authStore = useAuthStore();
const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { tokenParsed, user } = storeToRefs(authStore);
const { form, isRTL, userLabels } = storeToRefs(formStore);

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

onMounted(async () => {
  if (properties.formId) {
    await formStore.fetchForm(properties.formId);
    await getFormSchema();
  }

  // load up headers for any External API calls
  // from components (component makes calls during design phase).
  await setProxyHeaders();
  if (!properties.formId) {
    // We are creating a new form, so we obtain the original schema here.
    patch.value.originalSchema = deepClone(formSchema.value);
  }
});

const designerOptions = computed(() => {
  return {
    sanitizeConfig: {
      addTags: ['iframe'],
      ALLOWED_TAGS: ['iframe'],
    },
    noDefaultSubmitButton: false,
    builder: {
      ...FormDesignerBuilderOptions,
      customControls: {
        ...FormDesignerBuilderOptions.customControls,
        components: {
          ...FormDesignerBuilderOptions.customControls.components,
          simplefile: form.value.userType !== ID_MODE.value.PUBLIC,
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

const DISPLAY_VERSION = computed(() =>
  form.value?.versions?.length ? form.value.versions.length + 1 : 1
);

const ID_MODE = computed(() => IdentityMode);

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
  if (el === '') reRenderFormIo.value += 1;
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
      // Component was added into the form and save was clicked
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
// ----------------------------------------------------------------------------------/ Patch History

// ---------------------------------------------------------------------------------------------------
// Saving the Schema
// ---------------------------------------------------------------------------------------------------
async function submitFormSchema() {
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
    formMetadata: form.value.formMetadata,
  });
  // update user labels with any new added labels
  if (
    form.value.labels.some((label) => userLabels.value.indexOf(label) === -1)
  ) {
    const userLabelResponse = await userService.updateUserLabels(
      form.value.labels
    );
    userLabels.value = userLabelResponse.data;
  }

  // Navigate back to this page with ID updated
  router.push({
    name: 'FormDesigner',
    query: {
      f: response.data.id,
      d: response.data.draft.id,
      sv: true,
      svs: 'Saved',
    },
  });
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
// ----------------------------------------------------------------------------------/ Saving the Schema
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
    notificationStore.addNotification({
      text: 'Failed to set proxy headers',
      consoleError: error,
    });
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
}

async function loadFile(event) {
  try {
    const result = await importFormSchemaFromFile(event.target.files[0]);

    formSchema.value = JSON.parse(result);
    addPatchToHistory();
    patch.value.undoClicked = false;
    patch.value.redoClicked = false;
    resetHistoryFlags();
    // Key-changing to force a re-render of the formio component when we want to load a new schema after the page is already in
    reRenderFormIo.value += 1;
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formDesigner.formSchemaImportErrMsg'),
      consoleError: t('trans.formDesigner.formSchemaImportConsoleErrMsg', {
        error: error,
      }),
    });
  }
}

defineExpose({ designerOptions, reRenderFormIo });
</script>
<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div class="d-flex flex-wrap">
      <!-- page title -->
      <div :lang="locale" class="flex-1-0">
        <h1>{{ $t('trans.formDesigner.formDesign') }}</h1>
        <h3 v-if="form.name">{{ form.name }}</h3>
      </div>
      <!-- buttons -->
      <div class="d-flex flex-row">
        <div class="d-flex flex-column ma-2" style="align-items: center">
          <span :lang="locale">{{
            $t('trans.formDesigner.exportDesign')
          }}</span>
          <v-btn
            class="mx-1"
            color="primary"
            icon
            size="x-small"
            :title="$t('trans.formDesigner.exportDesign')"
            @click="exportFormSchema(form.name, formSchema, form.snake)"
          >
            <v-icon icon="mdi:mdi-download"></v-icon>
          </v-btn>
        </div>
        <div class="d-flex flex-column ma-2" style="align-items: center">
          <span :lang="locale">{{
            $t('trans.formDesigner.importDesign')
          }}</span>
          <v-btn
            class="mx-1"
            color="primary"
            icon
            size="x-small"
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
        </div>
      </div>
    </div>
    <div>
      <!-- page version -->
      <div :lang="locale">
        <em :lang="locale"
          >{{ $t('trans.formDesigner.version') }} : {{ DISPLAY_VERSION }}</em
        >
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
