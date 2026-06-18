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
 * @returns {Promise<Object>} - The config object (creates with enabled: false if not found)
 */
const getV3Config = async (formId) => {
  try {
    if (!formId) {
      return null;
    }

    let config = await CDOGSV3Config.query().modify('findByFormId', formId).first();

    // If no config exists, create one with enabled: false as default
    if (!config) {
      config = await CDOGSV3Config.query().insert({ formId, enabled: false });
    }

    return config;
  } catch (error) {
    log.error('Error retrieving CDOGS v3 config', { formId, error: error.message });
    throw error;
  }
};

/**
 * Enable CDOGS v3 for a form
 * @param {string} formId - The form ID
 * @returns {Promise<Object>} - The created/updated config
 */
const enableV3 = async (formId) => {
  try {
    const config = await CDOGSV3Config.query().modify('findByFormId', formId).first();

    if (config) {
      return await CDOGSV3Config.query().patchAndFetchById(config.id, { enabled: true });
    } else {
      return await CDOGSV3Config.query().insert({ formId, enabled: true });
    }
  } catch (error) {
    log.error('Error enabling CDOGS v3', { formId, error: error.message });
    throw error;
  }
};

/**
 * Disable CDOGS v3 for a form
 * @param {string} formId - The form ID
 * @returns {Promise<Object>} - The updated config
 */
const disableV3 = async (formId) => {
  try {
    const config = await CDOGSV3Config.query().modify('findByFormId', formId).first();

    if (config) {
      return await CDOGSV3Config.query().patchAndFetchById(config.id, { enabled: false });
    } else {
      return await CDOGSV3Config.query().insert({ formId, enabled: false });
    }
  } catch (error) {
    log.error('Error disabling CDOGS v3', { formId, error: error.message });
    throw error;
  }
};

module.exports = {
  hasV3Access,
  getV3Config,
  enableV3,
  disableV3,
};
