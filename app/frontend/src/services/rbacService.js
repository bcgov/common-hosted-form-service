import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function getIdentityProviders
   * Get the Identity Provider details from the rbac endpoint
   * @returns {Promise} An axios response
   */
  getIdentityProviders(params = {}) {
    return appAxios().get(`${ApiRoutes.RBAC}/idps`, { params });
  },
  /**
   * @function getCurrentUser
   * Get the current user details from the rbac endpoint
   * @returns {Promise} An axios response
   */
  getCurrentUser() {
    return appAxios().get(`${ApiRoutes.RBAC}/current`, {});
  },
  /**
   * @function getCurrentUserForms
   * Get the current user's forms from the rbac endpoint
   * @returns {Promise} An axios response
   */
  getCurrentUserForms(params = {}) {
    return appAxios().get(`${ApiRoutes.RBAC}/current/forms`, { params });
  },

  /**
   * @function getUserSubmissions
   * Get the submissions for a form that the current user has permissions on
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  getUserSubmissions(params = {}) {
    return appAxios().get(`${ApiRoutes.RBAC}/current/submissions`, { params });
  },

  //
  // Tenant Management calls
  //

  /**
   * @function getCurrentUserTenants
   * Get the list of tenants available to the current user
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  getCurrentUserTenants(params = {}) {
    return appAxios().get(`${ApiRoutes.RBAC}/current/tenants`, { params });
  },

  /**
   * @function getGroupsForCurrentTenant
   * Get the list of groups for the current tenant
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  getGroupsForCurrentTenant(params = {}) {
    return appAxios().get(`${ApiRoutes.RBAC}/current/groups`, { params });
  },

  /**
   * @function getFormGroups
   * Get the list of groups associated with a form
   * @param {String} formId The form ID
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  getFormGroups(formId, params = {}) {
    return appAxios().get(`${ApiRoutes.RBAC}/forms/${formId}/groups`, {
      params,
    });
  },

  /**
   * @function assignGroupsToForm
   * Assign groups to a form
   * @param {String} formId The form ID
   * @param {Array} groupIds The array of group IDs to assign
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  assignGroupsToForm(formId, groupIds, params = {}) {
    return appAxios().put(
      `${ApiRoutes.RBAC}/forms/${formId}/groups`,
      { groupIds },
      { params }
    );
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
   * @function isUserAssignedToFormTeams
   * Determine if user is in form team
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  isUserAssignedToFormTeams(params = {}) {
    return appAxios().get(`${ApiRoutes.RBAC}/form/user`, { params });
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
  },

  /**
   * @function removeMultiUsers
   * removes selected users from the from
   * @param {Object} requestBody The request body for the relationships
   * @returns {Promise} An axios response
   */
  removeMultiUsers(requestBody, params = {}) {
    return appAxios().delete(
      `${ApiRoutes.RBAC}/users?formId=${params.formId}`,
      { data: requestBody },
      { params }
    );
  },

  //
  // Submission Management calls
  //

  /**
   * @function getSubmissionUsers
   * Get the list of associated users for a submission
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  getSubmissionUsers(params = {}) {
    return appAxios().get(`${ApiRoutes.RBAC}/submissions`, { params });
  },

  /**
   * @function setFormUsers
   * Set permissions for a user on the form
   * @param {Object} requestBody The request body containing the permissions list
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  setSubmissionUserPermissions(requestBody, params = {}) {
    return appAxios().put(`${ApiRoutes.RBAC}/submissions`, requestBody, {
      params,
    });
  },
};
