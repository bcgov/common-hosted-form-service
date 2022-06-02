import { appAxios } from '@/services/interceptors';
import { ApiRoutes } from '@/utils/constants';
import axios from 'axios';

export default {
  //
  // Form calls
  //

  /**
   * @function deleteApiKey
   * Hard delete an API Key
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  deleteApiKey(formId) {
    return appAxios().delete(`${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}${ApiRoutes.APIKEY}`);
  },

  /**
   * @function listForms
   * Read all the forms in the DB
   * @param {Boolean} active Don't show deleted forms
   * @returns {Promise} An axios response
   */
  listForms(active = true) {
    return appAxios().get(`${ApiRoutes.ADMIN}${ApiRoutes.FORMS}`, { params: { active: active } });
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
    return appAxios().get(`${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}/formUsers`);
  },

  /**
   * @function readApiDetails
   * Gets the form's API Key details
   * @param {string} formId The GUID
   * @returns {Promise} An axios response
   */
  readApiDetails(formId) {
    return appAxios().get(`${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}${ApiRoutes.APIKEY}`);
  },

  /**
   * @function restoreForm
   * Restore a deleted form
   * @param {string} formId The GUID
   * @returns {Promise} An axios response
   */
  restoreForm(formId) {
    return appAxios().put(`${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}/restore`);
  },

  /**
   * @function readVersion
   * Get a specific form version schema
   * @param {string} formId The form uuid
   * @param {string} formVersionId The form version uuid
   * @returns {Promise} An axios response
   */
  readVersion(formId, formVersionId) {
    return appAxios().get(`${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${formId}/versions/${formVersionId}`);
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
   * @function listCommonCompsHelpLinkInfo
   * Read a user in the DB
   * @returns {Promise} An axios response
   */
  listCommonCompsHelpLinkInfo() {
    return appAxios().get(`${ApiRoutes.ADMIN}/commonCompsHelpInfo/list`);
  },

  /**
   * @function addCommonCompsHelpInfo
   * Create a new Form
   * @param {Object} data An Object containing each common component help link information
   * @returns {Promise} An axios response
   */
  addCommonCompsHelpInfo(data){
    return appAxios().post(`${ApiRoutes.ADMIN}/commonCompsHelpInfo`, data);
  },


  /**
   * @function updateCommonCompsHelpInfoStatus
   * Update publish status of Common Components Help Link Information
   * @param {boolean} publishStatus This is used to determine if the help link information is published or not
   * @param {string} componentId component id
   * @returns {Promise} An axios response
   */
  updateCommonCompsHelpInfoStatus(componentId, publishStatus){
    return appAxios().put(`${ApiRoutes.ADMIN}/commonCompsHelpInfo/${publishStatus}/${componentId}`);
  },

  /**
   * @function uploadImageUrl
   * Create a new Form
   * @param {String} imageName An Object containing each common component help link information
   * @returns {Promise} An axios response
   */
  async uploadImageUrl(imageName){

    return await appAxios().post(`${ApiRoutes.ADMIN}/commonCompsHelpInfo/upload/${imageName}`);
  },

  /**
   * @function uploadCommonCompsHelpInfoImage
   * Create a new Form
   * @param {Object} file An Object containing each common component help link information
   * @returns {Promise} An axios response
   */
  async uploadCommonCompsHelpInfoImage(url,file){
    
    return await axios().put(url,file,{headers: {'Content-Type': 'multipart/form-data' }});
  },
};
