import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function createFormMetadata
   * Create new form metadata for the form
   * @param {string} formId The form uuid
   * @param {Object} data An object containing the form metadata  details
   * @returns {Promise} An axios response
   */
  createFormMetadata(formId, data = {}) {
    return appAxios().post(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.FORM_METADATA}`,
      data
    );
  },

  /**
   * @function getFormMetadata
   * Get the form metadata
   * @param {string} formId The form uuid
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  getFormMetadata(formId, params = {}) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.FORM_METADATA}`,
      { params }
    );
  },

  /**
   * @function updateFormMetadata
   * Update the form metadata
   * @param {string} formId The form uuid
   * @param {Object} data An object containing the form metadata  details
   * @returns {Promise} An axios response
   */
  updateFormMetadata(formId, data = {}) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.FORM_METADATA}`,
      data
    );
  },

  /**
   * @function deleteFormMetadata
   * Delete the form metadata
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  deleteFormMetadata(formId) {
    return appAxios().delete(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.FORM_METADATA}`
    );
  },
};
