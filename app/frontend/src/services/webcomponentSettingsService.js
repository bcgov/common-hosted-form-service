import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function readWebcomponentSettings
   * Get the web component settings for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  readWebcomponentSettings(formId) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.WEBCOMPONENT_SETTINGS}`
    );
  },

  /**
   * @function upsertWebcomponentSettings
   * Create or update the web component settings for a form
   * @param {string} formId The form uuid
   * @param {Object} data An object containing the allowed origins
   * @returns {Promise} An axios response
   */
  upsertWebcomponentSettings(formId, data) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.WEBCOMPONENT_SETTINGS}`,
      data
    );
  },
};
