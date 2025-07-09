const Problem = require('api-problem');
const uuid = require('uuid');
const { FormEmbedDomain, FormEmbedDomainHistory, FormEmbedDomainHistoryVw } = require('../common/models');
const { FormEmbedDomainStatuses } = require('../common/constants');
const log = require('../../components/log');

const service = {
  /**
   * @function listDomains
   * Gets all domains for a form
   * @param {string} formId The form uuid
   * @param {Object} params The query params
   * @returns {Promise} An array of requested domains
   */
  listDomains: async (formId, params = {}) => {
    return FormEmbedDomain.query().modify('filterFormId', formId).modify('filterStatus', params.status);
  },

  /**
   * @function getDomainHistory
   * Gets the history for a domain
   * @param {string} formEmbedDomainId The form embed domain uuid
   * @returns {Promise} The domain history
   */
  getDomainHistory: async (formEmbedDomainId) => {
    return FormEmbedDomainHistoryVw.query().modify('formEmbedDomainId', formEmbedDomainId).modify('orderDefault');
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
      if (existing.status === FormEmbedDomainStatuses.DENIED) {
        let trx;
        try {
          trx = await FormEmbedDomain.startTransaction();

          // Add history record for the status change
          await FormEmbedDomainHistory.query(trx).insert({
            id: uuid.v4(),
            formEmbedDomainId: existing.id,
            previousStatus: existing.status,
            newStatus: FormEmbedDomainStatuses.PENDING,
            createdBy: currentUser.usernameIdp,
            createdAt: new Date().toISOString(),
          });

          // Update status to pending
          const updated = await FormEmbedDomain.query(trx).patchAndFetchById(existing.id, {
            status: FormEmbedDomainStatuses.PENDING,
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
    return await FormEmbedDomain.query().insert({
      id: uuid.v4(),
      formId: formId,
      domain: data.domain,
      status: FormEmbedDomainStatuses.SUBMITTED,
      requestedAt: new Date().toISOString(),
      requestedBy: currentUser.usernameIdp,
    });
  },

  /**
   * @function removeDomain
   * Permanently removes a domain
   * @param {string} formEmbedDomainId The form embed domain uuid
   * @returns {Promise} The number of deleted domains
   */
  removeDomain: async (formEmbedDomainId) => {
    // First delete history records
    await FormEmbedDomainHistory.query().where('formEmbedDomainId', formEmbedDomainId).delete();

    // Then delete the domain
    return FormEmbedDomain.query().deleteById(formEmbedDomainId);
  },

  /**
   * @function isEmbedAllowed
   * Checks if embedding is allowed for a form from a specific origin
   * @param {string} formId The form uuid
   * @param {string} origin The origin to check
   * @returns {Promise<boolean>} True if embedding is allowed
   * @throws {Error} If there's an error parsing the URL or querying the database
   */
  isEmbedAllowed: async (formId, origin) => {
    if (!origin) {
      log.debug(`Embedding denied: No origin provided for form ${formId}`);
      return false;
    }

    let domain;
    try {
      // Parse the origin to extract domain
      const url = new URL(origin);
      domain = url.hostname;
    } catch (error) {
      log.error(`Invalid origin URL format for form ${formId}: ${origin}`, error);
      const enhancedError = new Error(`Invalid origin URL format: ${origin}`);
      enhancedError.originalError = error;
      throw enhancedError;
    }

    try {
      // Check if the domain is in the approved list
      const allowed = await FormEmbedDomain.query()
        .modify('filterFormId', formId)
        .modify('filterStatus', FormEmbedDomainStatuses.APPROVED)
        .whereRaw("? LIKE '%' || domain || '%'", [domain])
        .first();

      const isAllowed = !!allowed;
      if (!isAllowed) {
        log.debug(`Embedding denied: Domain ${domain} not approved for form ${formId}`);
      }
      return isAllowed;
    } catch (error) {
      log.error(`Database error checking allowed domains for form ${formId} and domain ${domain}`, error);
      const enhancedError = new Error(`Database error checking allowed domains for form ${formId}`);
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },
};

module.exports = service;
