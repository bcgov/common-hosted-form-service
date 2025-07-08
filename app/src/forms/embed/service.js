const Problem = require('api-problem');
const uuid = require('uuid');
const { FormEmbedDomain, FormEmbedDomainHistory, FormEmbedDomainHistoryVw } = require('../common/models');

const service = {
  /**
   * @function listAllowedDomains
   * Gets all allowed domains for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An array of allowed domains
   */
  listAllowedDomains: async (formId) => {
    return FormEmbedDomain.query().modify('filterFormId', formId).modify('filterStatus', 'approved');
  },

  /**
   * @function listRequestedDomains
   * Gets all requested domains for a form
   * @param {string} formId The form uuid
   * @param {Object} params The query params
   * @returns {Promise} An array of requested domains
   */
  listRequestedDomains: async (formId, params = {}) => {
    return FormEmbedDomain.query().modify('filterFormId', formId).modify('filterStatus', params.status);
  },

  /**
   * @function getDomainHistory
   * Gets the history for a domain
   * @param {string} domainId The domain uuid
   * @returns {Promise} The domain history
   */
  getDomainHistory: async (domainId) => {
    return FormEmbedDomainHistoryVw.query().modify('filterDomainId', domainId).modify('orderDefault');
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
    // Check if domain already exists for this form
    const existing = await FormEmbedDomain.query().modify('filterFormId', formId).where('domain', data.domain).first();

    if (existing) {
      // If it exists but was previously denied, we can resubmit
      if (existing.status === 'denied') {
        let trx;
        try {
          trx = await FormEmbedDomain.startTransaction();

          // Add history record for the status change
          await FormEmbedDomainHistory.query(trx).insert({
            id: uuid.v4(),
            formEmbedDomainId: existing.id,
            previousStatus: existing.status,
            newStatus: 'pending',
            createdBy: currentUser.usernameIdp,
          });

          // Update status to pending
          const updated = await FormEmbedDomain.query(trx).patchAndFetchById(existing.id, {
            status: 'pending',
            updatedBy: currentUser.usernameIdp,
          });

          await trx.commit();
          return updated;
        } catch (err) {
          if (trx) await trx.rollback();
          throw err;
        }
      } else {
        // If it's pending or approved, don't allow a new request
        throw new Problem(409, `Domain request already exists with status: ${existing.status}`);
      }
    }

    // Create a new domain request
    return FormEmbedDomain.query().insert({
      id: uuid.v4(),
      formId: formId,
      domain: data.domain,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      requestedBy: currentUser.usernameIdp,
      createdBy: currentUser.usernameIdp,
    });
  },

  /**
   * @function removeDomain
   * Permanently removes a domain
   * @param {string} domainId The domain uuid
   * @returns {Promise} The number of deleted domains
   */
  removeDomain: async (domainId) => {
    // First delete history records
    await FormEmbedDomainHistory.query().where('formEmbedDomainId', domainId).delete();

    // Then delete the domain
    return FormEmbedDomain.query().deleteById(domainId);
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

      // Check if the domain is in the approved list
      const allowed = await FormEmbedDomain.query().modify('filterFormId', formId).modify('filterStatus', 'approved').whereRaw("? LIKE '%' || domain || '%'", [domain]).first();

      return !!allowed;
    } catch (error) {
      return false;
    }
  },
};

module.exports = service;
