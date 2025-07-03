import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function listAllowedDomains
   * List all allowed domains for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  listAllowedDomains(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/embed/allowed`);
  },

  /**
   * @function listRequestedDomains
   * List all requested domains for a form
   * @param {string} formId The form uuid
   * @param {Object} [params={}] The query parameters
   * @returns {Promise} An axios response
   */
  listRequestedDomains(formId, params = {}) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/embed/requested`, {
      params,
    });
  },

  /**
   * @function requestDomain
   * Request a domain to be added to allowed domains
   * @param {string} formId The form uuid
   * @param {Object} data The domain data
   * @returns {Promise} An axios response
   */
  requestDomain(formId, data) {
    return appAxios().post(`${ApiRoutes.FORMS}/${formId}/embed/request`, data);
  },

  /**
   * @function reviewDomainRequest
   * Review a domain request
   * @param {string} formId The form uuid
   * @param {string} requestId The request uuid
   * @param {Object} data The review data
   * @returns {Promise} An axios response
   */
  reviewDomainRequest(formId, requestId, data) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${formId}/embed/request/${requestId}`,
      data
    );
  },

  /**
   * @function removeDomain
   * Remove a domain from allowed domains
   * @param {string} formId The form uuid
   * @param {string} domainId The domain uuid
   * @returns {Promise} An axios response
   */
  removeDomain(formId, domainId) {
    return appAxios().delete(
      `${ApiRoutes.FORMS}/${formId}/embed/allowed/${domainId}`
    );
  },
};
