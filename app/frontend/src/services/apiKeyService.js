import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function readApiKey
   * Get the current api key for the form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  readApiKey(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}${ApiRoutes.APIKEY}`);
  },

  /**
   * @function generateApiKey
   * Create a new API key for a form, will overwrite any existing key
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  generateApiKey(formId) {
    return appAxios().put(`${ApiRoutes.FORMS}/${formId}${ApiRoutes.APIKEY}`);
  },

  /**
   * @function deleteApiKey
   * Hard delete an API Key
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  deleteApiKey(formId) {
    return appAxios().delete(`${ApiRoutes.FORMS}/${formId}${ApiRoutes.APIKEY}`);
  },

  /**
   * @function filesApiKeyAccess
   * Set the boolean for the API key to access files
   * @param {string} formId The form uuid, {boolean} filesApiAcces true/false to allow/deny access
   * @returns {Promise} An axios response
   */
  filesApiKeyAccess(formId, filesApiAccess) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.APIKEY}${ApiRoutes.FILES_API_ACCESS}`,
      { filesApiAccess }
    );
  },
};
