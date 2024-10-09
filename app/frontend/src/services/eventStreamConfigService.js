import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function getEventStreamConfig
   * Get the event stream configuration
   * @param {string} formId The form uuid
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  getEventStreamConfig(formId, params = {}) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.EVENT_STREAM_CONFIG}`,
      { params }
    );
  },
};
