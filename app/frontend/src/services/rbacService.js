import { appAxios } from '@/services/interceptors';
import { ApiRoutes } from '@/utils/constants';

export default {
  /**
   * @function getCurrentUser
   * Get the current user details from the rbac endpoint
   * @returns {Promise} An axios response
   */
  getCurrentUser() {
    return appAxios().get(`${ApiRoutes.RBAC}/current`);
  },

  //
  // Form Management calls
  //

  /**
   * @function getFormUsers
   * Get the list of form and associated users
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  getFormUsers(params = {}) {
    return appAxios().get(`${ApiRoutes.RBAC}/forms`, { params });
  },

  /**
   * @function setFormUsers
   * Set relationships between forms, roles, users
   * @param {Object} requestBody The request body for the relationships
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  setFormUsers(requestBody, params = {}) {
    return appAxios().put(`${ApiRoutes.RBAC}/forms`, requestBody, { params });
  }
};
