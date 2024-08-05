import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function listEncryptionAlgorithms
   * Get the Encryption Key Algortithms supported
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  listEncryptionAlgorithms(formId, params = {}) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.ENCRYPTION_KEY}/algorithms`,
      { params }
    );
  },
  /**
   * @function listEncryptionKeys
   * List the encryption keys for the form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  listEncryptionKeys(formId, params = {}) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.ENCRYPTION_KEY}`,
      { params }
    );
  },

  /**
   * @function createEncryptionKey
   * Create new encryption key for the form
   * @param {string} formId The form uuid
   * @param {Object} data An object containing the encryption key details
   * @returns {Promise} An axios response
   */
  createEncryptionKey(formId, data = {}) {
    return appAxios().post(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.ENCRYPTION_KEY}`,
      data
    );
  },

  /**
   * @function getEncryptionKey
   * Get the encryption key
   * @param {string} formId The form uuid
   * @param {string} formEncryptionKeyId The form encryption key uuid
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  getEncryptionKey(formId, formEncryptionKeyId, params = {}) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.ENCRYPTION_KEY}/${formEncryptionKeyId}`,
      { params }
    );
  },

  /**
   * @function updateEncryptionKey
   * Update an encryption key
   * @param {string} formId The form uuid
   * @param {string} formEncryptionKeyId The form encryption key uuid
   * @param {Object} data An object containing the encryption key details
   * @returns {Promise} An axios response
   */
  updateEncryptionKey(formId, formEncryptionKeyId, data = {}) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.ENCRYPTION_KEY}/${formEncryptionKeyId}`,
      data
    );
  },

  /**
   * @function deleteEncryptionKey
   * Delete an encryption key
   * @param {string} formId The form uuid
   * @param {string} formEncryptionKeyId The form encryption key uuid
   * @returns {Promise} An axios response
   */
  deleteEncryptionKey(formId, formEncryptionKeyId) {
    return appAxios().delete(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.ENCRYPTION_KEY}/${formEncryptionKeyId}`
    );
  },
};
