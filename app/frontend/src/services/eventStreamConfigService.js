import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function createEventStreamConfig
   * Create new event stream configuration for the form
   * @param {string} formId The form uuid
   * @param {Object} data An object containing the event stream configuration details
   * @returns {Promise} An axios response
   */
  createEventStreamConfig(formId, data = {}) {
    return appAxios().post(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.EVENT_STREAM_CONFIG}`,
      data
    );
  },

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

  /**
   * @function updateEventStreamConfig
   * Update an event stream configuration
   * @param {string} formId The form uuid
   * @param {Object} data An object containing the event stream configuration details
   * @returns {Promise} An axios response
   */
  updateEventStreamConfig(formId, data = {}) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.EVENT_STREAM_CONFIG}`,
      data
    );
  },

  /**
   * @function deleteEventStreamConfig
   * Delete an event stream configuration
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  deleteEventStreamConfig(formId) {
    return appAxios().delete(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.EVENT_STREAM_CONFIG}`
    );
  },
};
