<template>
  <div>
    <h1 class="text-center">Loading FormIO modules</h1>
    <h5 class="text-center">Remaining objects: {{remainingObjects}} / {{totalObjects}}</h5>
    <v-list flat dark>
      <template
        v-for="(log, index) in log"
      >
        <v-list-item
          :key="index"
        >
          {{ log }}
        </v-list-item>
      </template>
    </v-list>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

import { formService } from '@/services';
import { importExternalFile } from '@/utils/formModuleUtils';

export default {
  name: 'FormModuleLoader',
  props: {
    formId: String,
    formVersionId: String,
    formDraftId: String,
  },
  data() {
    return {
      formModuleUris: [],
      log: [],
      objectsLoaded: 0,
    };
  },
  computed: {
    ...mapGetters('formModule', ['builder', 'formModuleList', 'formModuleVersion', 'formModuleVersionList']),
    totalObjects() {
      return this.formModuleUris.length;
    },
    remainingObjects() {
      return this.totalObjects - this.objectsLoaded;
    },
  },
  methods: {
    ...mapActions('formModule', ['registerComponent', 'setBuilderCategory', 'setBuilder', 'resetBuilder']),
    ...mapActions('formModule', ['getFormModuleList', 'getFormModuleVersionList', 'fetchFormModuleVersion', 'getFormVersionFormModuleVersions']),
    ...mapActions('notifications', ['addNotification']),
    async loadDefaultModules() {
      await this.getFormModuleList({ active: true });
      for (const module of this.formModuleList) {
        for (const moduleVersion of module.formModuleVersions) {
          for (const uri of moduleVersion.externalUris) {
            this.formModuleUris.push(uri);
          }
        }
      }
    },
    async loadModulesWithFormVersion(formVersionId) {
      await this.getFormVersionFormModuleVersions({ formId: this.formId, formVersionId: formVersionId });
      for (const fmv of this.formModuleVersionList) {
        await this.fetchFormModuleVersion({ formModuleId: fmv.formModuleVersion.formModuleId, formModuleVersionId: fmv.formModuleVersionId });
        for (const uri of this.formModuleVersion.externalUris) {
          if (typeof uri !== 'string')
            this.formModuleUris.push(uri.uri);
          else
            this.formModuleUris.push(uri);
        }
      }
    },
    async loadModules() {
      await this.resetBuilder();

      try {
        if (this.formId) {
          let versionId = '';
          if (this.formVersionId) {
            versionId = this.formVersionId;
            await this.loadModulesWithFormVersion(versionId);
          } else if (this.formDraftId) {
            await this.loadDefaultModules();
          } else {
            // If getting the HEAD form version (IE making a new submission)
            let response = await formService.readPublished(this.formId);
            if (
              !response.data ||
              !response.data.versions ||
              !response.data.versions[0]
            ) {
              throw new Error(
                `No published version found in response. FormID: ${this.formId}`
              );
            }
            versionId = response.data.versions[0].id;
            await this.loadModulesWithFormVersion(versionId);
          }
        } else {
          await this.loadDefaultModules();
        }

        let builder = this.builder;
        
        for (const uri of this.formModuleUris) {
          this.log.push(`Importing ${uri}`);
          importExternalFile(document, uri, () => {
            this.log.push(`Imported ${uri}`);
            if (uri.split('.').pop().toLowerCase() !== 'js') {
              this.objectsLoaded++;
              return;
            }
            this.formModuleList.forEach((formModule) => {
              formModule.formModuleVersions.forEach((formModuleVersion) => {
                let importData = JSON.parse(JSON.stringify(formModuleVersion.importData));
                if ('builderCategories' in importData.components) {
                  // Prep any builder categories, if the module creates a category, give it a components object
                  for (let [key, value] of Object.entries(importData.components['builderCategories'])) {
                    // If the builder category exists and hasn't been initialized yet
                    if (key in builder && typeof builder[key] === 'object') {
                      // Map the modules builder category to update it
                      Object.keys(value).map((entryKey) => {
                        builder[key][entryKey] = value[entryKey];
                      });
                    } else {
                      // This is a new builder category
                      builder[key] = value;
                    }
                    if (typeof builder[key] === 'object' && !('components' in builder[key])) {
                      builder[key]['components'] = {};
                    }
                  }
                }
                
                if (formModuleVersion.externalUris.includes(uri)) {
                  for (const [categoryKey, categoryValue] of Object.entries(importData.components.builder)) {
                    for (const [componentKey, componentValue] of Object.entries(categoryValue)) {
                      if (typeof componentValue === 'boolean') {
                        this.builder[categoryKey.toString()]['components'][componentKey.toString()] = componentValue;
                      } else {
                        if ('userType' in importData.components.builder[categoryKey][componentKey]) {
                          if ('blacklist' in importData.components.builder[categoryKey][componentKey]['userType']) {
                            this.builder[categoryKey]['components'][componentKey] = importData.components.builder[categoryKey][componentKey]['userType']['blacklist'].includes(this.userType);
                          }
                        }
                      }
                    }
                  }
                }
              });
            });
            this.setBuilder(builder);
            this.objectsLoaded++;
          });
        }
      } catch (error) {
        this.addNotification({
          message: 'An error occurred while loading formio modules.',
          consoleError: `Error loading form modules: ${error}`,
        });
      }
    },
  },
  created() {
    this.loadModules();
  },
  watch: {
    remainingObjects(newValue) {
      if (newValue === 0) {
        this.$emit('update:parent', false);
      }
    }
  }
};
</script>
