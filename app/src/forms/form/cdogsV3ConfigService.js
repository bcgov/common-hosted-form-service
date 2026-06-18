const { v4: uuidv4 } = require('uuid');
const { CDOGSV3Config } = require('../common/models');
const log = require('../../components/log')(module.filename);

/**
 * Check if a form has CDOGS v3 access enabled
 * @param {string} formId - The form ID to check
 * @returns {Promise<boolean>} - Whether the form has v3 access enabled
 */
const hasV3Access = async (formId) => {
  try {
    if (!formId) {
      return false;
    }

    const config = await CDOGSV3Config.query().modify('findByFormId', formId).select('enabled').first();

    return config ? config.enabled : false;
  } catch (error) {
    log.error('Error checking CDOGS v3 access', { formId, error: error.message });
    return false;
  }
};

/**
 * Get CDOGS v3 configuration for a form
 * @param {string} formId - The form ID
 * @returns {Promise<Object|null>} - The config object or null if not found
 */
const getV3Config = async (formId) => {
  try {
    if (!formId) {
      return null;
    }

    return await CDOGSV3Config.query().modify('findByFormId', formId).first();
  } catch (error) {
    log.error('Error retrieving CDOGS v3 config', { formId, error: error.message });
    throw error;
  }
};

/**
 * Upsert CDOGS v3 configuration for a form
 * @param {string} formId - The form ID
 * @param {boolean} enabled - Whether v3 should be enabled
 * @returns {Promise<Object>} - The created/updated config
 */
const upsertV3Config = async (formId, enabled) => {
  try {
    if (!formId) {
      throw new Error('formId is required');
    }

    const config = await CDOGSV3Config.query().modify('findByFormId', formId).first();

    if (config) {
      return await CDOGSV3Config.query().patchAndFetchById(config.id, { enabled });
    } else {
      return await CDOGSV3Config.query().insert({ id: uuidv4(), formId, enabled });
    }
  } catch (error) {
    log.error('Error upserting CDOGS v3 config', { formId, enabled, error: error.message });
    throw error;
  }
};

/**
 * Enable CDOGS v3 for a form
 * @param {string} formId - The form ID
 * @returns {Promise<Object>} - The created/updated config
 */
const enableV3 = async (formId) => {
  return upsertV3Config(formId, true);
};

/**
 * Disable CDOGS v3 for a form
 * @param {string} formId - The form ID
 * @returns {Promise<Object>} - The updated config
 */
const disableV3 = async (formId) => {
  return upsertV3Config(formId, false);
};

module.exports = {
  hasV3Access,
  getV3Config,
  upsertV3Config,
  enableV3,
  disableV3,
};
