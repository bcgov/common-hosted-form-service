const Problem = require('api-problem');

const uuid = require('uuid');
const { FormAllowedDomain, FormRequestedDomain } = require('../common/models');

const service = {
  /**
   * @function listAllowedDomains
   * Gets all allowed domains for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An array of allowed domains
   */
  listAllowedDomains: async (formId) => {
    return FormAllowedDomain.query().modify('filterFormId', formId);
  },

  /**
   * @function listRequestedDomains
   * Gets all requested domains for a form
   * @param {string} formId The form uuid
   * @param {Object} params The query params
   * @returns {Promise} An array of requested domains
   */
  listRequestedDomains: async (formId, params = {}) => {
    return FormRequestedDomain.query().modify('filterFormId', formId).modify('filterStatus', params.status);
  },

  /**
   * @function requestDomain
   * Requests a domain to be added to allowed domains
   * @param {string} formId The form uuid
   * @param {Object} data The request body
   * @param {Object} currentUser The current user
   * @returns {Promise} The created requested domain
   */
  requestDomain: async (formId, data, currentUser) => {
    // Check if domain is already allowed
    const existingAllowed = await FormAllowedDomain.query().modify('filterFormId', formId).where('domain', data.domain).first();

    if (existingAllowed) {
      throw new Problem(409, 'Domain is already allowed');
    }

    // Check if domain is already requested and pending
    const existingRequest = await FormRequestedDomain.query().modify('filterFormId', formId).where('domain', data.domain).where('status', 'pending').first();

    if (existingRequest) {
      throw new Problem(409, 'Domain request is already pending');
    }

    // Create a new request
    return FormRequestedDomain.query().insert({
      id: uuid.v4(),
      formId: formId,
      domain: data.domain,
      status: 'pending',
      requestedBy: currentUser.usernameIdp,
    });
  },

  /**
   * @function reviewDomainRequest
   * Reviews a domain request
   * @param {string} requestId The request uuid
   * @param {Object} data The review data
   * @param {Object} currentUser The current user
   * @returns {Promise} The updated request
   */
  reviewDomainRequest: async (requestId, data, currentUser) => {
    const request = await FormRequestedDomain.query().findById(requestId).throwIfNotFound();

    if (request.status !== 'pending') {
      throw new Problem(409, 'Request has already been reviewed');
    }

    let trx;
    try {
      trx = await FormRequestedDomain.startTransaction();

      // Update the request
      await FormRequestedDomain.query(trx).patchAndFetchById(requestId, {
        status: data.approved ? 'approved' : 'denied',
        reason: data.reason,
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser.usernameIdp,
      });

      // If approved, add to allowed domains
      if (data.approved) {
        await FormAllowedDomain.query(trx).insert({
          id: uuid.v4(),
          formId: request.formId,
          domain: request.domain,
          createdBy: currentUser.usernameIdp,
        });
      }

      await trx.commit();
      return FormRequestedDomain.query().findById(requestId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function removeDomain
   * Removes a domain from allowed domains
   * @param {string} domainId The domain uuid
   * @returns {Promise} The number of deleted domains
   */
  removeDomain: async (domainId) => {
    return FormAllowedDomain.query().deleteById(domainId);
  },

  /**
   * @function isEmbedAllowed
   * Checks if embedding is allowed for a form from a specific origin
   * @param {string} formId The form uuid
   * @param {string} origin The origin to check
   * @returns {Promise<boolean>} True if embedding is allowed
   */
  isEmbedAllowed: async (formId, origin) => {
    if (!origin) return false;

    try {
      // Parse the origin to extract domain
      const url = new URL(origin);
      const domain = url.hostname;

      // Check if the domain is in the allowed list
      const allowed = await FormAllowedDomain.query().modify('filterFormId', formId).whereRaw("? LIKE '%' || domain || '%'", [domain]).first();

      return !!allowed;
    } catch (error) {
      return false;
    }
  },
};

module.exports = service;
