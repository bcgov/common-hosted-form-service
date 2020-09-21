import formService from '@/services/formService.js';

export default {
  namespaced: true,
  state: {
    form: {
      description: '',
      id: '',
      idps: [],
      name: '',
    },
    formList: [],
    submission: {
      confirmationId: '',
      submission: {
        data: {}
      }
    },
    submissionList: [],
    version: {}
  },
  getters: {
    form: state => state.form,
    formList: state => state.formList,
    submission: state => state.submission,
    submissionList: state => state.submissionList,
    version: state => state.version
  },
  mutations: {
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
    SET_SUBMISSION(state, submission) {
      state.submission = submission;
    },
    SET_SUBMISSIONLIST(state, submissions) {
      state.submissionList = submissions;
    },
    SET_VERSION(state, version) {
      state.version = version;
    },
  },
  actions: {
    async fetchForm({ commit }, formId) {
      try {
        // Get the form definition from the api
        const response = await formService.readForm(formId);
        commit('SET_FORM', response.data);
      } catch (error) {
        console.error(`Error getting form ${formId}: ${error}`); // eslint-disable-line no-console
      }
    },
    async fetchSubmission({ commit }, { formId, versionId, submissionId }) {
      try {
        // Get this submission
        const response = await formService.getSubmission(
          formId,
          versionId,
          submissionId
        );
        commit('SET_SUBMISSION', response.data);
      } catch (error) {
        console.error(`Error getting submission ${submissionId}: ${error}`); // eslint-disable-line no-console
      }
    },
    async fetchSubmissions({ commit }, formId) {
      try {
        commit('SET_SUBMISSIONLIST', []);
        // Get list of submissions for this form
        const response = await formService.listSubmissions(formId);
        commit('SET_SUBMISSIONLIST', response.data);
      } catch (error) {
        console.error(`Error getting submissions for ${formId}: ${error}`); // eslint-disable-line no-console
      }
    },
    async fetchVersion({ commit }, { formId, versionId }) {
      try {
        // Get details about the sepecific form version
        const response = await formService.readVersion(
          formId,
          versionId
        );
        commit('SET_VERSION', response.data);
      } catch (error) {
        console.error(`Error getting version for ${formId}: ${error}`); // eslint-disable-line no-console
      }
    }
  },
};
