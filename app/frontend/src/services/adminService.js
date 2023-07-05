import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  //
  // Form calls
  //

  /**
   * @function addFormUser
   * Add a form user role (specific administrative task, for real form/user/role management see rbac service)
   * @param {formId} formId The request body for the relationships
   * @param {userId} userId The request body for the relationships
   * @param {String[]} [roles] The list of roles to add
   * @returns {Promise} An axios response
   */
  addFormUser(userId, formId, roles) {
    return appAxios().put(
      `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}/addUser`,
      roles.map((role) => ({
        userId: userId,
        formId: formId,
        role: role,
      })),
      { params: { userId: userId } }
    );
  },

  /**
   * @function deleteApiKey
   * Hard delete an API Key
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  deleteApiKey(formId) {
    return appAxios().delete(
      `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}${ApiRoutes.APIKEY}`
    );
  },

  /**
   * @function listForms
   * Read all the forms in the DB
   * @param {Boolean} active Don't show deleted forms
   * @returns {Promise} An axios response
   */
  listForms(active = true) {
    return appAxios().get(`${ApiRoutes.ADMIN}${ApiRoutes.FORMS}`, {
      params: { active: active },
    });
  },

  /**
   * @function readForm
   * Get a form
   * @param {string} formId The GUID
   * @returns {Promise} An axios response
   */
  readForm(formId) {
    return appAxios().get(`${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}`);
  },

  /**
   * @function readRoles
   * Get roles for form user
   * @param {string} formId The GUID
   * @returns {Promise} An axios response
   */
  readRoles(formId) {
    return appAxios().get(
      `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}/formUsers`
    );
  },

  /**
   * @function readApiDetails
   * Gets the form's API Key details
   * @param {string} formId The GUID
   * @returns {Promise} An axios response
   */
  readApiDetails(formId) {
    return appAxios().get(
      `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}${ApiRoutes.APIKEY}`
    );
  },

  /**
   * @function restoreForm
   * Restore a deleted form
   * @param {string} formId The GUID
   * @returns {Promise} An axios response
   */
  restoreForm(formId) {
    return appAxios().put(
      `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}/restore`
    );
  },

  /**
   * @function readVersion
   * Get a specific form version schema
   * @param {string} formId The form uuid
   * @param {string} formVersionId The form version uuid
   * @returns {Promise} An axios response
   */
  readVersion(formId, formVersionId) {
    return appAxios().get(
      `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}/versions/${formVersionId}`
    );
  },

  //
  // User calls
  //
  /**
   * @function listUsers
   * Read all the users in the DB
   * @returns {Promise} An axios response
   */
  listUsers() {
    return appAxios().get(`${ApiRoutes.ADMIN}${ApiRoutes.USERS}`);
  },

  /**
   * @function readUser
   * Read a user in the DB
   * @param {string} userId The GUID
   * @returns {Promise} An axios response
   */
  readUser(userId) {
    return appAxios().get(`${ApiRoutes.ADMIN}${ApiRoutes.USERS}/${userId}`);
  },

  /**
   * addFormComponentsProactiveHelp
   * @function addFCProactiveHelp
   * Create a new Form
   * @param {Object} data An Object containing each form component help information
   * @returns {Promise} An axios response
   */
  addFCProactiveHelp(data) {
    return appAxios().post(
      `${ApiRoutes.ADMIN}/formcomponents/proactivehelp/object`,
      data
    );
  },

  /**
   * updateFormComponentsProactiveHelpStatus
   * @function updateFCProactiveHelpStatus
   * Update publish status of each Form Components Help Link Information
   * @param {boolean} publishStatus This is used to determine if the help link information is published or not
   * @param {string} componentId component id
   * @returns {Promise} An axios response
   */
  updateFCProactiveHelpStatus(componentId, publishStatus) {
    return appAxios().put(
      `${ApiRoutes.ADMIN}/formcomponents/proactivehelp/${publishStatus}/${componentId}`
    );
  },

  /**
   * @function getPresignedUrl
   * get signed image upload url
   * @param {Object} imageName component name and component image encoded into base64
   * @returns {Promise} An axios response
   */
  async getFCProactiveHelpImageUrl(componentId) {
    return appAxios().get(
      `${ApiRoutes.ADMIN}/formcomponents/proactivehelp/imageUrl/${componentId}`
    );
  },

  /**
   * listFormComponentsProactiveHelp
   * @function listFCProactiveHelp
   * Reads all form components help information
   * @returns {Promise} An axios response
   */
  async listFCProactiveHelp() {
    return await appAxios().get(
      `${ApiRoutes.ADMIN}/formcomponents/proactivehelp/list`
    );
  },
};
