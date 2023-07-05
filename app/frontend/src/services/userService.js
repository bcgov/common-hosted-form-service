import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function getUsers
   * Get users (used for searching or filtering users by params)
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  getUsers(params = {}) {
    return appAxios().get(`${ApiRoutes.USERS}/`, { params });
  },

  /**
   * @function getUser
   * Get user information
   * @param {String} userId The user id to read
   * @returns {Promise} An axios response
   */
  getUser(userId) {
    return appAxios().get(`${ApiRoutes.USERS}/${userId}`);
  },

  /**
   * @function getUserFormPreferences
   * Get the preferences for a the current user for a specific form
   * @param {String} formId The form
   * @returns {Promise} An axios response
   */
  getUserFormPreferences(formId) {
    return appAxios().get(`${ApiRoutes.USERS}/preferences/forms/${formId}`);
  },

  /**
   * @function updateUserFormPreferences
   * Set the preferences for a the current user for a specific form
   * @param {String} formId The form
   * @param {Object} body The user form preferences
   * @returns {Promise} An axios response
   */
  updateUserFormPreferences(formId, body) {
    return appAxios().put(
      `${ApiRoutes.USERS}/preferences/forms/${formId}`,
      body
    );
  },
};
