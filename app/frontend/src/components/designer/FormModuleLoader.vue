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
    required: true,
  },
  formVersionId: {
    type: String,
    required: true,
  },
  formDraftId: {
    type: String,
    required: true,
  },
  submissionId: {
    type: String,
    required: true,
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

async function loadDefaultModules() {
  await formModuleStore.getFormModuleList({ active: true });
  for (const module of formModuleList.value) {
    for (const moduleVersion of module.formModuleVersions) {
      for (const uri of moduleVersion.externalUris) {
        formModuleUris.value.push(uri);
      }
    }
  }
}

async function loadModulesWithFormVersion(formId, formVersionId) {
  await formModuleStore.getFormVersionFormModuleVersions({
    formId: formId,
    formVersionId: formVersionId,
  });
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
      for (const uri of formModuleVersion.value.externalUris) {
        if (typeof uri !== 'string') formModuleUris.value.push(uri.uri);
        else formModuleUris.value.push(uri);
      }
    }
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

    var uris = JSON.parse(JSON.stringify(formModuleUris.value));
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
        if (!idps.includes(user.value.idp)) return;
      }
      formModule.formModuleVersions.forEach((formModuleVersion) => {
        parseFormModuleVersion(formModuleVersion);
      });
    });
  } else if (formModuleVersion.valueList.length > 0) {
    formModuleVersionList.value.forEach((formModuleVersion) => {
      parseFormModuleVersion(formModuleVersion.formModuleVersion);
    });
  }
  formModuleStore.setBuilder(builder.value);
}

function parseFormModuleVersion(fmv) {
  let importData = JSON.parse(JSON.stringify(fmv.importData));
  if ('components' in importData) {
    if ('builderCategories' in importData.components) {
      // Prep any builder categories, if the module creates a category, give it a components object
      for (let [key, value] of Object.entries(
        importData.components['builderCategories']
      )) {
        // If the builder category exists and hasn't been initialized yet
        if (key in builder.value && typeof builder.value[key] === 'object') {
          // Map the modules builder category to update it
          Object.keys(value).map((entryKey) => {
            builder.value[key][entryKey] = value[entryKey];
          });
        } else {
          // This is a new builder category
          builder.value[key] = value;
        }
        if (
          typeof builder.value[key] === 'object' &&
          !('components' in builder.value[key])
        ) {
          builder.value[key]['components'] = {};
        }
      }
    }

    for (const [categoryKey, categoryValue] of Object.entries(
      importData.components.builder
    )) {
      for (const [componentKey, componentValue] of Object.entries(
        categoryValue
      )) {
        if (typeof componentValue === 'boolean') {
          formModuleStore.registerComponent(
            categoryKey.toString(),
            componentKey.toString(),
            componentValue
          );
        } else {
          if (
            'userType' in
            importData.components.builder[categoryKey][componentKey]
          ) {
            if (
              'denylist' in
              importData.components.builder[categoryKey][componentKey][
                'userType'
              ]
            ) {
              formModuleStore.registerComponent(
                categoryKey.toString(),
                componentKey.toString(),
                !importData.components.builder[categoryKey][componentKey][
                  'userType'
                ]['denylist'].includes(form.userType)
              );
            }
          }
        }
      }
    }
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
