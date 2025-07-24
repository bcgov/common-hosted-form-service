<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { formService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useFormModuleStore } from '~/store/formModule';
import { useNotificationStore } from '~/store/notification';
import { importExternalFile } from '~/utils/formModuleUtils';

const { locale, t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    type: String,
    default: null,
  },
  formVersionId: {
    type: String,
    default: null,
  },
  formDraftId: {
    type: String,
    default: null,
  },
  submissionId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['update:parent']);

const formModuleUris = ref([]);
const log = ref([]);
const objectsLoaded = ref(0);

const authStore = useAuthStore();
const formStore = useFormStore();
const formModuleStore = useFormModuleStore();
const notificationStore = useNotificationStore();

const { user } = storeToRefs(authStore);
const { form } = storeToRefs(formStore);
const { builder, formModuleList, formModuleVersion, formModuleVersionList } =
  storeToRefs(formModuleStore);

const totalObjects = computed(() => formModuleUris.value.length);
const remainingObjects = computed(
  () => totalObjects.value - objectsLoaded.value
);

watch(remainingObjects, (value) => {
  if (value === 0) {
    emit('update:parent', false);
  }
});

// Extract helper function to get latest version
function getLatestVersion(versions) {
  if (!Array.isArray(versions) || versions.length === 0) return null;

  return [...versions].sort((a, b) => {
    const aDate = new Date(a.updatedAt || a.createdAt);
    const bDate = new Date(b.updatedAt || b.createdAt);
    return bDate - aDate;
  })[0];
}

// Extract helper function to get URIs from a version
function getUrisFromVersion(version) {
  if (!version || !Array.isArray(version.externalUris)) return [];

  return version.externalUris.map((uri) =>
    typeof uri === 'string' ? uri : uri.uri
  );
}

function latestModuleUris(modules) {
  if (!Array.isArray(modules)) return [];

  // Use flatMap to reduce nesting
  const uris = modules
    .filter(
      (module) =>
        Array.isArray(module.formModuleVersions) &&
        module.formModuleVersions.length > 0
    )
    .map((module) => getLatestVersion(module.formModuleVersions))
    .filter(Boolean) // Remove null/undefined versions
    .flatMap((version) => getUrisFromVersion(version));

  // Deduplicate
  return [...new Set(uris)];
}

async function loadDefaultModules() {
  await formModuleStore.getFormModuleList({ active: true });
  formModuleUris.value = latestModuleUris(formModuleList.value);
}

async function loadModulesWithFormVersion(formId, formVersionId) {
  await formModuleStore.getFormVersionFormModuleVersions({
    formId: formId,
    formVersionId: formVersionId,
  });
  const modules = [];
  if (
    formModuleVersionList.value &&
    Array.isArray(formModuleVersionList.value) &&
    formModuleVersionList.value.length > 0
  ) {
    for (const fmv of formModuleVersionList.value) {
      await formModuleStore.fetchFormModuleVersion({
        formModuleId: fmv.formModuleVersion.formModuleId,
        formModuleVersionId: fmv.formModuleVersionId,
      });
      modules.push({
        formModuleVersions: [
          JSON.parse(JSON.stringify(formModuleVersion.value)),
        ],
      });
    }
    formModuleUris.value = latestModuleUris(modules);
  } else {
    await loadDefaultModules();
  }
}

async function loadModules() {
  await formModuleStore.resetBuilder();

  try {
    if (properties.formId) {
      let versionId = '';
      if (properties.formVersionId) {
        versionId = properties.formVersionId;
        await loadModulesWithFormVersion(properties.formId, versionId);
      } else if (properties.formDraftId) {
        await loadDefaultModules();
      } else {
        // If getting the HEAD form version (IE making a new submission)
        let response = await formService.readPublished(properties.formId);
        if (
          !response.data ||
          !response.data.versions ||
          !response.data.versions[0]
        ) {
          throw new Error(
            t('trans.formModuleLoader.noPublishedVersion', {
              formId: properties.formId,
            })
          );
        }
        versionId = response.data.versions[0].id;
        await loadModulesWithFormVersion(properties.formId, versionId);
      }
    } else if (properties.submissionId) {
      const response = await formService.getSubmission(properties.submissionId);
      if (!response.data && !response.data.version) {
        throw new Error(
          t('trans.formModuleLoader.noPublishedVersion', {
            formId: properties.formId,
          })
        );
      }
      await loadModulesWithFormVersion(
        response.data.form.id,
        response.data.version.id
      );
    } else {
      await loadDefaultModules();
    }

    const uris = JSON.parse(JSON.stringify(formModuleUris.value));
    for (const uri of uris) {
      log.value.push(t('trans.formModuleLoader.logImport', { uri: uri }));
      importExternalFile(document, uri, () => {
        log.value.push(t('trans.formModuleLoader.logImported', { uri: uri }));
        if (uri.split('.').pop().toLowerCase() === 'js') {
          updateBuilder();
        }
        objectsLoaded.value++;
      });
    }
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.formModuleLoader.loadingFormModulesErr'),
      consoleError: t('trans.formModuleLoader.loadingFormModulesConsErr', {
        error: error,
      }),
    });
  }
}

function updateBuilder() {
  formModuleStore.resetBuilder();
  if (formModuleList.value.length > 0) {
    formModuleList.value.forEach((formModule) => {
      if (
        properties.formDraftId ||
        (!properties.formId &&
          !properties.formDraftId &&
          !properties.formVersionId)
      ) {
        let idps = formModule.identityProviders.map((fm) => fm.idp);
        if (!idps.includes(user.value.idp.code)) return;
      }
      formModuleList.value.forEach((formModule) => {
        // Only use the latest version for each module
        const latestVersion = [...formModule.formModuleVersions].sort(
          (a, b) => {
            const aDate = new Date(a.updatedAt || a.createdAt);
            const bDate = new Date(b.updatedAt || b.createdAt);
            return bDate - aDate;
          }
        )[0];
        if (latestVersion) {
          parseFormModuleVersion(latestVersion);
        }
      });
    });
  } else if (formModuleVersionList.length > 0) {
    formModuleVersionList.value.forEach((formModuleVersion) => {
      parseFormModuleVersion(formModuleVersion.formModuleVersion);
    });
  }
  formModuleStore.setBuilder(builder.value);
}

// Helper to parse config data safely
function parseConfig(config) {
  return typeof config === 'string'
    ? JSON.parse(config)
    : JSON.parse(JSON.stringify(config));
}

// Helper to process categories section
function processCategories(categories) {
  if (!categories) return;

  Object.entries(categories).forEach(([key, value]) => {
    // Initialize category if needed
    builder.value[key] = builder.value[key] || {};

    // Update with module values
    Object.assign(builder.value[key], value);

    // Ensure components object exists
    if (!('components' in builder.value[key])) {
      builder.value[key]['components'] = {};
    }
  });
}

// Helper to determine if component should be enabled for current user
function shouldEnableComponent(componentValue) {
  if (typeof componentValue === 'boolean') {
    return componentValue;
  }

  if (
    componentValue &&
    typeof componentValue === 'object' &&
    'userType' in componentValue &&
    'denylist' in componentValue.userType
  ) {
    return !componentValue.userType.denylist.includes(form.value.userType);
  }

  return false;
}

// Helper to process builder components section
function processBuilderComponents(builderData) {
  if (!builderData) return;

  Object.entries(builderData).forEach(([categoryKey, categoryValue]) => {
    // Initialize category and components
    builder.value[categoryKey] = builder.value[categoryKey] || {};
    builder.value[categoryKey]['components'] =
      builder.value[categoryKey]['components'] || {};

    // Process each component
    Object.entries(categoryValue).forEach(([componentKey, componentValue]) => {
      builder.value[categoryKey]['components'][componentKey] =
        shouldEnableComponent(componentValue);
    });
  });
}

// Main function with reduced complexity
function parseFormModuleVersion(fmv) {
  const importData = parseConfig(fmv.config);

  // Apply global config if available
  if ('config' in importData) {
    window.FORMIO_CONFIG = importData.config;
  }

  // Exit early if no components
  if (!('components' in importData)) return;

  // Process categories if present
  if ('categories' in importData.components) {
    processCategories(importData.components.categories);
  }

  // Process builder components if present
  if ('builder' in importData.components) {
    processBuilderComponents(importData.components.builder);
  }
}

loadModules();
</script>
<template>
  <div>
    <h1 class="text-center" :lang="locale">
      {{ $t('trans.formModuleLoader.loadingFormModules') }}
    </h1>
    <h5 class="text-center" :lang="locale">
      {{
        $t('trans.formModuleLoader.remainingObjects', {
          remainingObjects: remainingObjects,
          totalObjects: totalObjects,
        })
      }}
    </h5>
    <v-list :items="log"></v-list>
  </div>
</template>
