import { appAxios } from '@/services/interceptors';
import { ApiRoutes } from '@/utils/constants';

export default {
  /**
   * @function getCurrentUser
   * Get the current user details from the rbac endpoint
   * @returns {Promise} An axios response
   */
  getCurrentUser(params = {}) {
    return appAxios().get(`${ApiRoutes.RBAC}/current`, { params });
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
  },

  //
  // User Management calls
  //

  /**
   * @function getUserForms
   * Get the list of forms for associated user (admin use only at this point if needed, use /current for an actual user)
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  getUserForms(params = {}) {
    return appAxios().get(`${ApiRoutes.RBAC}/users`, { params });
  },

  /**
   * @function setUserForms
   * Set relationships between users, roles, forms
   * @param {Object} requestBody The request body for the relationships
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  setUserForms(requestBody, params = {}) {
    return appAxios().put(`${ApiRoutes.RBAC}/users`, requestBody, { params });
  }
};
