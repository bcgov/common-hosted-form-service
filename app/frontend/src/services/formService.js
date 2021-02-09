import { appAxios } from '@/services/interceptors';
import { ApiRoutes } from '@/utils/constants';

export default {
  //
  // Form calls
  //

  /**
   * @function readForm
   * Get the baseline form metadata
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  readForm(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}`);
  },

  /**
   * @function createForm
   * Create a new Form
   * @param {Object} formData An object containing the form details
   * @returns {Promise} An axios response
   */
  createForm(formData) {
    return appAxios().post(`${ApiRoutes.FORMS}`, formData);
  },

  /**
   * @function updateForm
   * Update a Form
   * @param {string} formId The form uuid
   * @param {Object} formData An object containing the form details
   * @returns {Promise} An axios response
   */
  updateForm(formId, formData) {
    return appAxios().put(`${ApiRoutes.FORMS}/${formId}`, formData);
  },

  /**
   * @function deleteForm
   * Soft delete a Form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  deleteForm(formId) {
    return appAxios().delete(`${ApiRoutes.FORMS}/${formId}`);
  },

  /**
  * @function getStatusCodes
  * Get the statuses that are available to a form
  * @param {string} formId The form identifier
  * @returns {Promise} An axios response
  */
  getStatusCodes(formId) {
    return appAxios().get(`/forms/${formId}/statusCodes`);
  },

  //
  // Form draft calls
  //

  /**
   * @function createDraft
   * Create a new Form draft
   * @param {string} formId The form uuid
   * @param {Object} data An object containing an updated schema object attribute
   * @returns {Promise} An axios response
   */
  createDraft(formId, data) {
    return appAxios().post(`${ApiRoutes.FORMS}/${formId}/drafts`, data);
  },

  /**
   * @function deleteDraft
   * Delete a Form draft
   * @param {string} formId The form uuid
   * @param {string} formVersionDraftId The form version draft uuid
   * @returns {Promise} An axios response
   */
  deleteDraft(formId, formVersionDraftId) {
    return appAxios().delete(`${ApiRoutes.FORMS}/${formId}/drafts/${formVersionDraftId}`);
  },

  /**
   * @function listDrafts
   * Get any drafts for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  listDrafts(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/drafts`);
  },

  /**
   * @function publishDraft
   * Publishes a specific form draft
   * @param {string} formId The form uuid
   * @param {string} formVersionDraftId The form version draft uuid
   * @returns {Promise} An axios response
   */
  publishDraft(formId, formVersionDraftId) {
    return appAxios().post(`${ApiRoutes.FORMS}/${formId}/drafts/${formVersionDraftId}/publish`);
  },

  /**
   * @function readDraft
   * Get a specific draft for a form
   * @param {string} formId The form uuid
   * @param {string} formVersionDraftId The draft uuid
   * @returns {Promise} An axios response
   */
  readDraft(formId, formVersionDraftId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/drafts/${formVersionDraftId}`);
  },

  /**
   * @function updateDraft
   * Update a draft with a new schema
   * @param {string} formId The form uuid
   * @param {string} formVersionDraftId The draft uuid
   * @param {Object} data The request body
   * @returns {Promise} An axios response
   */
  updateDraft(formId, formVersionDraftId, data) {
    return appAxios().put(`${ApiRoutes.FORMS}/${formId}/drafts/${formVersionDraftId}`, data);
  },

  //
  // Form version calls
  //

  /**
   * @function readPublished
   * Get the most recently published form version schema
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  readPublished(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/version`);
  },

  /**
   * @function readVersion
   * Get a specific form version schema
   * @param {string} formId The form uuid
   * @param {string} formVersionId The form version uuid
   * @returns {Promise} An axios response
   */
  readVersion(formId, formVersionId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/versions/${formVersionId}`);
  },

  /**
   * @function listVersions
   * Get the versions for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  listVersions(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/versions`);
  },

  /**
   * @function publishVersion
   * Publish or unpublish a specific form version. Publishing a verison will unpublish all others.
   * @param {string} formId The form uuid
   * @param {string} formVersionId The form version uuid
   * @param {Boolean} publish True to publish, false to unpublish
   * @returns {Promise} An axios response
   */
  publishVersion(formId, formVersionId, publish) {
    return appAxios().post(`${ApiRoutes.FORMS}/${formId}/versions/${formVersionId}/publish`, null, {
      params: {
        unpublish: !publish,
      }
    });
  },

  /**
   * @function updateVersion
   * Updates a specific form version schema
   * @param {string} formId The form uuid
   * @param {string} formVersionId The form version uuid
   * @param {Object} data An object containing an updated schema object attribute
   * @returns {Promise} An axios response
   */
  updateVersion(formId, formVersionId, data) {
    return appAxios().put(`${ApiRoutes.FORMS}/${formId}/versions/${formVersionId}`, data);
  },

  //
  // Form submission calls
  //

  /**
   * @function createSubmission
   * Submit the form data
   * @param {string} formId The form uuid
   * @param {string} versionId The form uuid
   * @param {Object} requestBody The form data for the submission
   * @returns {Promise} An axios response
   */
  createSubmission(formId, versionId, requestBody) {
    return appAxios().post(`${ApiRoutes.FORMS}/${formId}/versions/${versionId}/submissions`, requestBody);
  },

  /**
  * @function getSubmission
  * Get the form data + version + submission data
  * @param {string} submission The form submission identifier
  * @returns {Promise} An axios response
  */
  getSubmission(submissionId) {
    return appAxios().get(`/submissions/${submissionId}`);
  },

  /**
   * @function listSubmissions
   * Get the submissions for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  listSubmissions(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/submissions`);
  },

  /**
   * @function exportSubmissions
   * Get the export file for a range of form submittions
   * @param {string} minDate The form uuid
   * @param {string} maxDate The form uuid
   * @param {string} format The file format csv or json
   * @returns {Promise} An axios response
   */
  exportSubmissions(formId, minDate, maxDate, format) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/export`,
      {
        params: {
          format: format,
          type: 'submissions',
          minDate: minDate ? minDate : undefined,
          maxDate: maxDate ? maxDate : undefined
        },
        responseType: 'blob'
      }
    );
  },

  /**
  * @function getSubmissionNotes
  * Get the notes associated with the submission
  * @param {string} submissionId The form submission identifier
  * @returns {Promise} An axios response
  */
  getSubmissionNotes(submissionId) {
    return appAxios().get(`/submissions/${submissionId}/notes`);
  },

  /**
  * @function addNote
  * Add a new notes to the submission
  * @param {string} submissionId The form submission identifier
   * @param {Object} data The request body
  * @returns {Promise} An axios response
  */
  addNote(submissionId, data) {
    return appAxios().post(`/submissions/${submissionId}/notes`, data);
  },

  /**
  * @function getSubmissionStatuses
  * Get the current status history associated with the submission
  * @param {string} submissionId The form submission identifier
  * @returns {Promise} An axios response
  */
  getSubmissionStatuses(submissionId) {
    return appAxios().get(`/submissions/${submissionId}/status`);
  },

  //
  // Email
  //

  /**
  * @function requestReceiptEmail
  * Send a receipt email
  * @param {string} submissionId The submission uuid
  * @param {Object} requestBody The body for the api call: { to }
  * @returns {Promise} An axios response
  */
  requestReceiptEmail(submissionId, requestBody) {
    return appAxios().post(`${ApiRoutes.SUBMISSION}/${submissionId}/email`, requestBody);
  },
};
