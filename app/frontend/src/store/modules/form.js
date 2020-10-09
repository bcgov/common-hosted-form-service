import { getField, updateField } from 'vuex-map-fields';

import { IdentityProviders } from '@/utils/constants';
import { formService, rbacService } from '@/services';

// TODO: Consider moving or folding these bidirectional transformation functions somewhere else?
/**
 * @function generateIdps
 * Converts idps and userType to identity provider objects
 * @param {String[]} idps A string array of identity providers
 * @param {String} userType The type of users
 * @returns {Object[]} An object array of identity providers
 */
function generateIdps({ idps, userType }) {
  let identityProviders = [];
  if (userType === 'login') {
    identityProviders = identityProviders.concat(idps.map((i) => ({ code: i })));
  } else if (userType === IdentityProviders.PUBLIC) {
    identityProviders.push(IdentityProviders.PUBLIC);
  }
  return identityProviders;
}

/**
 * @function parseIdps
 * Converts identity provider objects to idps and userType
 * @param {Object[]} identityProviders An object array of identity providers
 * @returns {Object} An object containing idps and userType
 */
function parseIdps(identityProviders) {
  const result = {
    idps: [],
    userType: 'team',
  };
  if (identityProviders.length) {
    if (identityProviders[0] === IdentityProviders.PUBLIC) {
      result.userType = IdentityProviders.PUBLIC;
    } else {
      result.userType = 'login';
      result.idps = identityProviders.map((ip) => ip.code);
    }
  }
  return result;
}

/**
 * Form Module
 */
export default {
  namespaced: true,
  state: {
    form: {
      description: '',
      id: '',
      idps: [],
      name: '',
      userType: 'team'
    },
    formList: [],
    formSubmission: {
      confirmationId: '',
      submission: {
        data: {}
      }
    },
    submissionList: [],
    version: {}
  },
  getters: {
    getField, // vuex-map-fields
    form: state => state.form,
    formList: state => state.formList,
    formSubmission: state => state.formSubmission,
    submissionList: state => state.submissionList,
    version: state => state.version
  },
  mutations: {
    updateField, // vuex-map-fields
    ADD_FORM_TO_LIST(state, form) {
      state.formList.push(form);
    },
    ADD_SUBMISSION_TO_LIST(state, submission) {
      state.submissions.push(submission);
    },
    SET_FORM(state, form) {
      state.form = form;
    },
    SET_FORMLIST(state, forms) {
      state.formList = forms;
    },
    SET_FORMSUBMISSION(state, submission) {
      state.formSubmission = submission;
    },
    SET_SUBMISSIONLIST(state, submissions) {
      state.submissionList = submissions;
    },
    SET_VERSION(state, version) {
      state.version = version;
    },
  },
  actions: {
    //
    // User-specific form stuff
    //
    async getFormsForCurrentUser({ commit, dispatch }) {
      try {
        // Get the forms based on the user's permissions
        const response = await rbacService.getCurrentUser();
        const data = response.data;
        // Build up the list of forms for the table
        const forms = data.forms.map((f) => {
          return {
            currentVersionId: f.formVersionId,
            id: f.formId,
            idps: f.idps,
            name: f.formName,
            permissions: f.permissions
          };
        });
        commit('SET_FORMLIST', forms);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while fetching your forms.',
          consoleError: `Error getting user data: ${error}`,
        }, { root: true });
      }
    },

    //
    // Form
    //
    async fetchForm({ commit, dispatch }, formId) {
      try {
        // Get the form definition from the api
        const { data } = await formService.readForm(formId);
        const identityProviders = parseIdps(data.identityProviders);
        data.idps = identityProviders.idps;
        data.userType = identityProviders.userType;
        commit('SET_FORM', data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while fetching this form.',
          consoleError: `Error getting form ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async updateForm({ state }) {
      try {
        formService.updateForm(state.form.id, {
          name: state.form.name,
          description: state.form.description,
          identityProviders: generateIdps({
            idps: state.form.idps,
            userType: state.form.userType,
          })
        });
      } catch (error) {
        console.error(`Error updating form: ${error}`); // eslint-disable-line no-console
      }
    },

    //
    // Submission
    //
    async fetchSubmission({ commit, dispatch }, { formId, versionId, submissionId }) {
      try {
        // Get this submission
        const response = await formService.getSubmission(
          formId,
          versionId,
          submissionId
        );
        commit('SET_FORMSUBMISSION', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while fetching this submission.',
          consoleError: `Error getting submission ${submissionId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchSubmissions({ commit, dispatch }, formId) {
      try {
        commit('SET_SUBMISSIONLIST', []);
        // Get list of submissions for this form
        const response = await formService.listSubmissions(formId);
        commit('SET_SUBMISSIONLIST', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while fetching submissions for this form.',
          consoleError: `Error getting submissions for ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchVersion({ commit, dispatch }, { formId, versionId }) {
      try {
        // TODO: need a better 'set back to initial state' ability
        commit('SET_FORMSUBMISSION', {
          submission: {
            data: {}
          }
        });
        // Get details about the sepecific form version
        const response = await formService.readVersion(
          formId,
          versionId
        );
        commit('SET_VERSION', response.data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while fetching this form.',
          consoleError: `Error getting version ${versionId} for form ${formId}: ${error}`,
        }, { root: true });
      }
    }
  },
};
