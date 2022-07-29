import { appAxios } from '@/services/interceptors';
import { ApiRoutes } from '@/utils/constants';
//import axios from 'axios';

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
   * @function addFormComponentHelpInfo
   * Create a new Form
   * @param {Object} data An Object containing each form component help information
   * @returns {Promise} An axios response
   */
  addFormComponentHelpInfo(data){
    return appAxios().post(`${ApiRoutes.ADMIN}/formComponents/helpInfo/object`, data);
  },


  /**
   * @function updateFormComponentsHelpInfoStatus
   * Update publish status of each Form Components Help Link Information
   * @param {boolean} publishStatus This is used to determine if the help link information is published or not
   * @param {string} componentId component id
   * @returns {Promise} An axios response
   */
  updateFormComponentsHelpInfoStatus(componentId, publishStatus){
    return appAxios().put(`${ApiRoutes.ADMIN}/formComponents/helpInfo/${publishStatus}/${componentId}`);
  },

  /**
   * @function uploadImage
   * upload image to storage facility (e.g. s3)
   * @param {Object} imageData component name and component image encoded into base64
   * @returns {Promise} An axios response
   */
  async uploadImage(imageData) {
    return appAxios().post(`${ApiRoutes.ADMIN}/formComponents/helpInfo/upload`,imageData);
    
    //return await axios.post('http://localhost:3000/api/v1/object/singleUpload/1d295570-2ad7-491e-a23b-c7eac158fe72',
    //  {'folder':'commoncomponenthelplink',imageData:{...imageData}});
  },

  /**
   * @function getPresignedUrl
   * get signed image upload url
   * @param {Object} imageName component name and component image encoded into base64
   * @returns {Promise} An axios response
  */
  async getPresignedUrl(imageName) {
    return appAxios().get(`${ApiRoutes.ADMIN}/formComponents/helpInfo/signedUrl/${imageName}`);

    //return await axios.get('http://localhost:3000/api/v1/object/signedUrl/1d295570-2ad7-491e-a23b-c7eac158fe72',
    //  { params: { imageName: imageName,folder:'commoncomponenthelplink'  } });
  }
};

