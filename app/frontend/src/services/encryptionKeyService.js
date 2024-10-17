import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function listEncryptionAlgorithms
   * Get the Encryption Key Algortithms supported
   * @returns {Promise} An axios response
   */
  listEncryptionAlgorithms(params = {}) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${ApiRoutes.ENCRYPTION_KEY}/algorithms`,
      { params }
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
};
