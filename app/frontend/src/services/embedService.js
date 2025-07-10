import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function getFormEmbedDomainStatusCodes
   * List all domain statuses
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  getFormEmbedDomainStatusCodes(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/embed/statusCodes`);
  },

  /**
   * @function listDomains
   * List all domains for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  listDomains(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/embed`);
  },

  /**
   * @function requestDomain
   * Request a domain to be added to allowed domains
   * @param {string} formId The form uuid
   * @param {Object} data The domain data
   * @returns {Promise} An axios response
   */
  requestDomain(formId, data) {
    return appAxios().post(`${ApiRoutes.FORMS}/${formId}/embed`, data);
  },

  /**
   * @function removeDomain
   * Remove a domain from requested domains
   * @param {string} formId The form uuid
   * @param {string} formEmbedDomainId The form embed domain uuid
   * @returns {Promise} An axios response
   */
  removeDomain(formId, formEmbedDomainId) {
    return appAxios().delete(
      `${ApiRoutes.FORMS}/${formId}/embed/${formEmbedDomainId}`
    );
  },

  /**
   * @function getDomainHistory
   * List all domains for a form
   * @param {string} formId The form uuid
   * @param {string} formEmbedDomainId The form embed domain uuid
   * @returns {Promise} An axios response
   */
  getDomainHistory(formId, formEmbedDomainId) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}/embed/${formEmbedDomainId}/history`
    );
  },
};
