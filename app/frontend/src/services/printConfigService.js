import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function readPrintConfig
   * Get the print configuration for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  readPrintConfig(formId) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.PRINT_CONFIG}`
    );
  },

  /**
   * @function upsertPrintConfig
   * Create or update the print configuration for a form
   * @param {string} formId The form uuid
   * @param {Object} data An object containing the print configuration
   * @returns {Promise} An axios response
   */
  upsertPrintConfig(formId, data) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.PRINT_CONFIG}`,
      data
    );
  },
};
