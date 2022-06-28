import { getField, updateField } from 'vuex-map-fields';

import { formService, formModuleService } from '@/services';

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
  importData: '',
});

export default {
  namespaced: true,
  state: {
    formModule: genInitialFormModule(),
    formModuleList: [],
    formModuleVersion: genInitialFormModuleVersion(),
    formModuleVersionList: [],
    builder: genInitialBuilder(),
  },
  getters: {
    getField, // vuex-map-fields
    formModule: state => state.formModule,
    formModuleList: state => state.formModuleList,
    formModuleVersion: state => state.formModuleVersion,
    formModuleVersionList: state => state.formModuleVersionList,
    builder: state => state.builder,
  },
  mutations: {
    updateField, // vuex-map-fields
    ADD_FORM_MODULE_TO_LIST(state, formModule) {
      state.formModuleList.push(formModule);
    },
    SET_FORM_MODULE(state, formModule) {
      state.formModule = formModule;
    },
    SET_FORM_MODULE_DIRTY(state, isDirty) {
      state.formModule.isDirty = isDirty;
    },
    SET_FORM_MODULE_LIST(state, formModules) {
      state.formModuleList = formModules;
    },
    SET_FORM_MODULE_VERSION(state, formModuleVersion) {
      state.formModuleVersion = formModuleVersion;
    },
    SET_FORM_MODULE_VERSION_LIST(state, formModuleVersions) {
      state.formModuleVersionList = formModuleVersions;
    },
    SET_IDP_TYPES(state, idps) {
      state.formModule.idpTypes = idps;
    },
    SET_BUILDER(state, builder) {
      state.builder = builder;
    },
    SET_BUILDER_CATEGORY(state, { categoryKey, categoryValue }) {
      if (!('components' in categoryValue)) {
        categoryValue['components'] = {};
      }
      state.builder[categoryKey] = categoryValue;
    },
  },
  actions: {
    async getFormModuleList({ commit, dispatch }, activeOnly) {
      try {
        commit('SET_FORM_MODULE_LIST', []);
        const response = await formModuleService.listFormModules({ active: activeOnly });
        commit('SET_FORM_MODULE_LIST', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while trying to fetch the form modules.',
          consoleError: `Error getting form modules: ${error}`,
        }, { root: true });
      }
    },
    async getFormModuleVersionList({ commit, dispatch }, formModuleId) {
      try {
        commit('SET_FORM_MODULE_VERSION_LIST', []);
        const response = await formModuleService.listFormModuleVersions(formModuleId);
        commit('SET_FORM_MODULE_VERSION_LIST', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while trying to fetch the form modules.',
          consoleError: `Error getting form modules: ${error}`,
        }, { root: true });
      }
    },
    async fetchFormModule({ commit, dispatch }, formModuleId) {
      try {
        commit('SET_FORM_MODULE', {});
        // Get the form definition from the api
        const { data } = await formModuleService.readFormModule(formModuleId);
        data.idpTypes = data.identityProviders.map((ip) => ip.code);
        commit('SET_FORM_MODULE', data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching this form module.',
          consoleError: `Error getting form module ${formModuleId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchFormModuleVersion({ commit, dispatch }, { formModuleId, formModuleVersionId}) {
      try {
        commit('SET_FORM_MODULE_VERSION', {});
        // Get the form definition from the api
        const { data } = await formModuleService.readFormModuleVersion(formModuleId, formModuleVersionId);
        data.externalUris = data.externalUris.map((uri, index) => ({
          id: index,
          uri: uri,
        }));
        data.importData = JSON.stringify(data.importData);
        commit('SET_FORM_MODULE_VERSION', data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while fetching this form module version.',
          consoleError: `Error getting form module version ${formModuleVersionId}: ${error}`,
        }, { root: true });
      }
    },
    async getFormVersionFormModuleVersions({ commit, dispatch }, { formId, formVersionId}) {
      try {
        commit('SET_FORM_MODULE_VERSION_LIST', []);
        const response = await formService.listFormVersionFormModuleVersions(formId, formVersionId);
        commit('SET_FORM_MODULE_VERSION_LIST', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while trying to fetch the form modules.',
          consoleError: `Error getting form modules: ${error}`,
        }, { root: true });
      }
    },
    async toggleFormModule({ dispatch }, { formModuleId, active }) {
      try {
        await formModuleService.toggleFormModule(formModuleId, active);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: `An error occurred while ${active ? 'activating' : 'disabling'}.`,
          consoleError: `Error in toggleFormModule ${formModuleId} ${active}: ${error}`,
        }, { root: true });
      }
    },
    resetFormModule({ commit }) {
      commit('SET_FORM_MODULE', genInitialFormModule());
    },
    resetFormModuleVersion({ commit }) {
      commit('SET_FORM_MODULE_VERSION', genInitialFormModuleVersion());
    },
    setIdpTypes({ commit }, idps) {
      commit('SET_IDP_TYPES', idps);
    },
    async updateFormModule({ state, dispatch }) {
      try {
        let identityProviders = [];
        await formModuleService.updateFormModule(state.formModule.id, {
          pluginName: state.formModule.pluginName,
          identityProviders: identityProviders.concat(state.formModule.idpTypes.map((i) => ({ code: i }))),
        });
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while updating the settings for this form module.',
          consoleError: `Error updating form ${state.formModule.id}: ${error}`,
        }, { root: true });
      }
    },
    async updateFormModuleVersion({ state, dispatch }) {
      try {
        let uris = [];
        await formModuleService.updateFormModuleVersion(state.formModule.id, state.formModuleVersion.id, {
          importData: state.formModuleVersion.importData,
          externalUris: uris.concat(state.formModuleVersion.externalUris.map((euri) => euri.uri)),
        });
      } catch (error) {
        dispatch('notifications/addNotification', {
          message: 'An error occurred while updating the settings for this form module version.',
          consoleError: `Error updating form module version ${state.formModuleVersion.id}: ${error}`,
        }, { root: true });
      }
    },
    async setDirtyFlag({ commit, state }, isDirty) {
      if (!state.formModule || state.formModule.isDirty === isDirty) return;
      window.onbeforeunload = isDirty ? () => true : null;
      commit('SET_FORM_MODULE_DIRTY', isDirty);
    },

    //
    // Form modules
    //
    async registerComponent({ commit, state }, { group, component, data }) {
      if (group === undefined || component === undefined) return;
      let builder = state.builder;
      builder[group]['components'][component] = data;
      commit('SET_BUILDER', builder);
    },
    resetBuilder({ commit }) {
      commit('SET_BUILDER', genInitialBuilder());
    },
    setBuilder({ commit }, builder) {
      commit('SET_BUILDER', builder);
    },
    setBuilderCategory({ commit }, { categoryKey, categoryValue }) {
      commit('SET_BUILDER_CATEGORY', { categoryKey, categoryValue });
    }
  },
};
