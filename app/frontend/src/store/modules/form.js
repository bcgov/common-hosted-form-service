import { getField, updateField } from 'vuex-map-fields';

import { IdentityMode, NotificationTypes } from '@/utils/constants';
import { formService, rbacService } from '@/services';
import { generateIdps, parseIdps } from '@/utils/transformUtils';

const genInitialForm = () => ({
  description: '',
  enableStatusUpdates: false,
  id: '',
  idps: [],
  isDirty: false,
  name: '',
  sendSubRecieviedEmail: false,
  showSubmissionConfirmation: true,
  submissionReceivedEmails: [],
  userType: IdentityMode.TEAM
});

/**
 * Form Module
 */
export default {
  namespaced: true,
  state: {
    drafts: [],
    form: genInitialForm(),
    formList: [],
    formSubmission: {
      confirmationId: '',
      submission: {
        data: {}
      }
    },
    permissions: [],
    submissionList: [],
    version: {}
  },
  getters: {
    getField, // vuex-map-fields
    drafts: state => state.drafts,
    form: state => state.form,
    formList: state => state.formList,
    formSubmission: state => state.formSubmission,
    permissions: state => state.permissions,
    submissionList: state => state.submissionList,
    version: state => state.version
  },
  mutations: {
    updateField, // vuex-map-fields
    ADD_FORM_TO_LIST(state, form) {
      state.formList.push(form);
    },
    ADD_SUBMISSION_TO_LIST(state, submission) {
      state.submissionList.push(submission);
    },
    SET_DRAFTS(state, drafts) {
      state.drafts = drafts;
    },
    SET_FORM(state, form) {
      state.form = form;
    },
    SET_FORM_DIRTY(state, isDirty) {
      state.form.isDirty = isDirty;
    },
    SET_FORM_PERMISSIONS(state, permissions) {
      state.permissions = permissions;
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
    // Current User
    //
    async getFormsForCurrentUser({ commit, dispatch }) {
      try {
        // Get the forms based on the user's permissions
        const response = await rbacService.getCurrentUser();
        const data = response.data;
        // Build up the list of forms for the table
        const forms = data.forms.map((f) => ({
          currentVersionId: f.formVersionId,
          id: f.formId,
          idps: f.idps,
          name: f.formName,
          description: f.formDescription,
          permissions: f.permissions
        }));
        commit('SET_FORMLIST', forms);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while fetching your forms.',
          consoleError: `Error getting user data: ${error}`,
        }, { root: true });
      }
    },
    async getFormPermissionsForUser({ commit, dispatch }, formId) {
      try {
        commit('SET_FORM_PERMISSIONS', []);
        // Get the forms based on the user's permissions
        const response = await rbacService.getCurrentUser({ formId: formId });
        const data = response.data;
        if (data.forms[0]) {
          commit('SET_FORM_PERMISSIONS', data.forms[0].permissions);
        } else {
          throw new Error('No form found');
        }
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while fetching your user data for this form.',
          consoleError: `Error getting user data using formID ${formId}: ${error}`,
        }, { root: true });
      }
    },

    //
    // Form
    //
    async deleteCurrentForm({ state, dispatch }) {
      try {
        await formService.deleteForm(state.form.id);
        dispatch('notifications/addNotification', {
          message:
            `Form "${state.form.name}" has been deleted successfully.`,
          type: NotificationTypes.SUCCESS
        }, { root: true });
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            `An error occurred while attempting to delete "${state.form.name}".`,
          consoleError: `Error deleting form ${state.form.id}: ${error}`,
        }, { root: true });
      }
    },
    async deleteDraft({ dispatch }, { formId, draftId }) {
      try {
        await formService.deleteDraft(formId, draftId);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while deleting this draft.',
          consoleError: `Error deleting ${draftId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchDrafts({ commit, dispatch }, formId) {
      try {
        // Get any drafts for this form from the api
        const { data } = await formService.listDrafts(formId);
        commit('SET_DRAFTS', data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while scanning for drafts for this form.',
          consoleError: `Error getting drafts for form ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchForm({ commit, dispatch }, formId) {
      try {
        // Get the form definition from the api
        const { data } = await formService.readForm(formId);
        const identityProviders = parseIdps(data.identityProviders);
        data.idps = identityProviders.idps;
        data.userType = identityProviders.userType;
        data.sendSubRecieviedEmail = data.submissionReceivedEmails && data.submissionReceivedEmails.length;
        commit('SET_FORM', data);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while fetching this form.',
          consoleError: `Error getting form ${formId}: ${error}`,
        }, { root: true });
      }
    },
    async publishDraft({ dispatch }, { formId, draftId }) {
      try {
        await formService.publishDraft(formId, draftId);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while publishing.',
          consoleError: `Error publishing ${draftId}: ${error}`,
        }, { root: true });
      }
    },
    async toggleVersionPublish({ dispatch }, { formId, versionId, publish }) {
      try {
        await formService.publishVersion(formId, versionId, publish);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            `An error occurred while ${publish ? 'publishing' : 'unpublishing'}.`,
          consoleError: `Error in toggleVersionPublish ${versionId} ${publish}: ${error}`,
        }, { root: true });
      }
    },
    resetForm({ commit }) {
      commit('SET_FORM', genInitialForm());
    },
    async setDirtyFlag({ commit, state }, isDirty) {
      // When the form is detected to be dirty set the browser guards for closing the tab etc
      // There are also Vue route-specific guards so that we can ask before navigating away with the links
      // Look for those in the Views for the relevant pages, look for "beforeRouteLeave" lifecycle
      if (!state.form || state.form.isDirty === isDirty) return; // don't do anything if not changing the val (or if form is blank for some reason)
      window.onbeforeunload = isDirty ? () => true : null;
      commit('SET_FORM_DIRTY', isDirty);
    },
    async updateForm({ state, dispatch }) {
      try {
        const emailList =
          state.form.sendSubRecieviedEmail &&
            state.form.submissionReceivedEmails &&
            Array.isArray(state.form.submissionReceivedEmails)
            ? state.form.submissionReceivedEmails
            : [];
        await formService.updateForm(state.form.id, {
          name: state.form.name,
          description: state.form.description,
          enableStatusUpdates: state.form.enableStatusUpdates,
          identityProviders: generateIdps({
            idps: state.form.idps,
            userType: state.form.userType,
          }),
          showSubmissionConfirmation: state.form.showSubmissionConfirmation,
          submissionReceivedEmails: emailList
        });
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while updating the settings for this form.',
          consoleError: `Error updating form ${state.form.id}: ${error}`,
        }, { root: true });
      }
    },

    //
    // Submission
    //
    async deleteSubmission({ dispatch }, { submissionId }) {
      try {
        // Get this submission
        await formService.deleteSubmission(submissionId);
      } catch (error) {
        dispatch('notifications/addNotification', {
          message:
            'An error occurred while deleting this submission.',
          consoleError: `Error deleting submission ${submissionId}: ${error}`,
        }, { root: true });
      }
    },
    async fetchSubmission({ commit, dispatch }, { submissionId }) {
      try {
        // Get this submission
        const response = await formService.getSubmission(
          submissionId
        );
        commit('SET_FORMSUBMISSION', response.data.submission);
        commit('SET_FORM', response.data.form);
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
        const response = await formService.listSubmissions(formId, false);
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
