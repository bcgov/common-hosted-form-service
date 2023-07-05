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
};
