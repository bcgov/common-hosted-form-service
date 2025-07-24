import { defineStore } from 'pinia';
import { i18n } from '~/internationalization';

import { formService, formModuleService } from '~/services';
import { useNotificationStore } from '~/store/notification';

const genInitialBuilder = () => ({
  basic: false,
  premium: false,
  advanced: false,
  layout: false,
  data: false,
});

const genInitialFormModule = () => ({
  id: '',
  pluginName: '',
  isDirty: false,
  versions: [],
  identityProviders: [],
  idpTypes: [], // these are the selected fields during import
});

const genInitialFormModuleVersion = () => ({
  id: '',
  formModuleId: '',
  externalUris: [],
  config: '',
});

export const useFormModuleStore = defineStore('formModule', {
  state: () => ({
    formModule: genInitialFormModule(),
    formModuleList: [],
    formModuleVersion: genInitialFormModuleVersion(),
    formModuleVersionList: [],
    builder: genInitialBuilder(),
  }),
  actions: {
    async getFormModuleList(activeOnly) {
      try {
        this.formModuleList = [];
        const response = await formModuleService.listFormModules({
          active: activeOnly,
        });
        this.formModuleList = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.formModule.getFormModuleListErrMsg'),
          consoleError: i18n.t(
            'trans.store.formModule.getFormModuleListConsErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },
    async getFormModuleVersionList(formModuleId) {
      try {
        this.formModuleVersionList = [];
        const response = await formModuleService.listFormModuleVersions(
          formModuleId
        );
        this.formModuleVersionList = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.formModule.getFormModuleVersionListErrMsg'),
          consoleError: i18n.t(
            'trans.store.formModule.getFormModuleVersionListConsErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },
    async fetchFormModule(formModuleId) {
      try {
        this.formModule = {};
        // Get the form definition from the api
        const { data } = await formModuleService.readFormModule(formModuleId);
        data.idpTypes = data.identityProviders.map((ip) => ip.code);
        this.formModule = data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.formModule.fetchFormModuleErrMsg'),
          consoleError: i18n.t(
            'trans.store.formModule.fetchFormModuleConsErrMsg',
            {
              formModuleId: formModuleId,
              error: error,
            }
          ),
        });
      }
    },
    async fetchFormModuleVersion({ formModuleId, formModuleVersionId }) {
      try {
        this.formModuleVersion = {};
        // Get the form definition from the api
        const { data } = await formModuleService.readFormModuleVersion(
          formModuleId,
          formModuleVersionId
        );
        data.externalUris = data.externalUris.map((uri, index) => ({
          id: index,
          uri: uri,
        }));
        data.config = JSON.stringify(data.config);
        this.formModuleVersion = data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.formModule.fetchFormModuleVersionErrMsg'),
          consoleError: i18n.t(
            'trans.store.formModule.fetchFormModuleVersionConsErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },
    async getFormVersionFormModuleVersions({ formId, formVersionId }) {
      try {
        this.formModuleVersionList = [];
        const response = await formService.listFormVersionFormModuleVersions(
          formId,
          formVersionId
        );
        this.formModuleVersionList = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t(
            'trans.store.formModule.getFormVersionFormModuleVersionsErrMsg'
          ),
          consoleError: i18n.t(
            'trans.store.formModule.getFormVersionFormModuleVersionsConsErrMsg',
            {
              error: error,
            }
          ),
        });
      }
    },
    async toggleFormModule({ formModuleId, active }) {
      try {
        await formModuleService.toggleFormModule(formModuleId, active);
      } catch (error) {
        let state = active ? 'activating' : 'deactivating';
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.formModule.toggleFormModuleErrMsg', {
            state: state,
          }),
          consoleError: i18n.t(
            'trans.store.formModule.toggleFormModuleConsErrMsg',
            {
              state: state,
              formModuleId: formModuleId,
              error: error,
            }
          ),
        });
      }
    },
    resetFormModule() {
      this.formModule = genInitialFormModule();
    },
    resetFormModuleVersion() {
      this.formModuleVersion = genInitialFormModuleVersion();
    },
    setIdpTypes(idps) {
      this.formModule.idpTypes = idps;
    },
    async updateFormModule() {
      try {
        await formModuleService.updateFormModule(this.formModule.id, {
          pluginName: this.formModule.pluginName,
          identityProviders: this.formModule.idpTypes.map((i) => ({ code: i })),
        });
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t('trans.store.formModule.updateFormModuleErrMsg'),
          consoleError: i18n.t(
            'trans.store.formModule.updateFormModuleConsErrMsg',
            {
              formModuleId: this.formModule.id,
              error: error,
            }
          ),
        });
      }
    },
    async updateFormModuleVersion() {
      const notificationStore = useNotificationStore();
      try {
        let configValue = null;
        if (this.formModuleVersion.config) {
          try {
            configValue = JSON.parse(this.formModuleVersion.config);
          } catch (error) {
            notificationStore.addNotification({
              text: i18n.t('trans.formModuleAddVersion.invalidConfigErrMsg'),
              consoleError: i18n.t(
                'trans.formModuleAddVersion.invalidConfigConsErrMsg',
                {
                  error: error.message,
                }
              ),
            });
            return;
          }
        }
        await formModuleService.updateFormModuleVersion(
          this.formModule.id,
          this.formModuleVersion.id,
          {
            config: configValue,
            externalUris: this.formModuleVersion.externalUris.map(
              (euri) => euri.uri
            ),
          }
        );
      } catch (error) {
        notificationStore.addNotification({
          text: i18n.t('trans.store.formModule.updateFormModuleVersionErrMsg'),
          consoleError: i18n.t(
            'trans.store.formModule.updateFormModuleVersionConsErrMsg',
            {
              formModuleVersionId: this.formModuleVersion.id,
              error: error,
            }
          ),
        });
      }
    },
    async setDirtyFlag(isDirty) {
      if (!this.formModule || this.formModule.isDirty === isDirty) return;
      window.onbeforeunload = isDirty ? () => true : null;
      this.formModule.isDirty = isDirty;
    },

    //
    // Form modules
    //
    async registerComponent({ group, component, data }) {
      if (group === undefined || component === undefined) return;
      let builder = this.builder;
      builder[group]['components'][component] = data;
      this.builder = builder;
    },
    resetBuilder() {
      this.builder = genInitialBuilder();
    },
    setBuilder(builder) {
      this.builder = builder;
    },
    setBuilderCategory({ categoryKey, categoryValue }) {
      if (!('components' in categoryValue)) {
        categoryValue['components'] = {};
      }
      this.builder[categoryKey] = categoryValue;
    },
  },
});
