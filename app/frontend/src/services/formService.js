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

  //
  // Form version calls
  //

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
  * Get the form data
  * @param {string} formId The form uuid
  * @param {string} versionId The form version uuid
  * @param {string} submission The form submission identifier
  * @returns {Promise} An axios response
  */
  getSubmission(formId, versionId, submissionId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/versions/${versionId}/submissions/${submissionId}`);
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
   * @returns {Promise} An axios response
   */
  exportSubmissions(formId, minDate, maxDate) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/export?format=csv&type=submissions${minDate ? `&minDate=${minDate}` : ''}${maxDate ? `&maxDate=${maxDate}` : ''}`, { responseType: 'blob', });
  },
};
