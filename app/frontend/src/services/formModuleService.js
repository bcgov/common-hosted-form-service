import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  //
  // Form module calls
  //
  /**
   * @function listFormModule
   * Read all the form modules in the DB
   * @returns {Promise} An axios response
   */
  listFormModules(params = {}) {
    return appAxios().get(`${ApiRoutes.FORMMODULES}`, { params: params });
  },

  /**
   * @function readFormModule
   * Get the baseline form module metadata
   * @param {string} formModuleId The form module uuid
   * @returns {Promise} An axios response
   */
  readFormModule(formModuleId) {
    return appAxios().get(`${ApiRoutes.FORMMODULES}/${formModuleId}`);
  },

  /**
   * @function createFormModule
   * Create a new Form module
   * @param {Object} formModuleData An object containing the form module details
   * @returns {Promise} An axios response
   */
  createFormModule(formModuleData) {
    return appAxios().post(`${ApiRoutes.FORMMODULES}`, formModuleData);
  },

  /**
   * @function updateFormModule
   * Update a Form module
   * @param {string} formModuleId The form module uuid
   * @param {Object} formModuleData An object containing the form module details
   * @returns {Promise} An axios response
   */
  updateFormModule(formModuleId, formModuleData) {
    return appAxios().put(
      `${ApiRoutes.FORMMODULES}/${formModuleId}`,
      formModuleData
    );
  },

  /**
   * @function toggleFormModule
   * Toggle a Form module to active or inactive
   * @param {string} formModuleId The form module uuid
   * @param {Object} active True to enable, false to deactivate
   * @returns {Promise} An axios response
   */
  toggleFormModule(formModuleId, active) {
    return appAxios().post(
      `${ApiRoutes.FORMMODULES}/${formModuleId}/toggle`,
      null,
      {
        params: {
          active: active,
        },
      }
    );
  },

  /**
   * @function listFormModuleVersion
   * Read all the form module versions in the DB
   * @returns {Promise} An axios response
   */
  listFormModuleVersions(formModuleId, params = {}) {
    return appAxios().get(
      `${ApiRoutes.FORMMODULES}/${formModuleId}/version`,
      params
    );
  },

  /**
   * @function readFormModuleVersion
   * Get the baseline form module version metadata
   * @param {string} formModuleId The form module uuid
   * @param {string} formModuleVersionId The form module version uuid
   * @returns {Promise} An axios response
   */
  readFormModuleVersion(formModuleId, formModuleVersionId) {
    return appAxios().get(
      `${ApiRoutes.FORMMODULES}/${formModuleId}/version/${formModuleVersionId}`
    );
  },

  /**
   * @function createFormModuleVersion
   * Create a new Form module version
   * @param {string} formModuleId The form module uuid
   * @param {Object} formModuleData An object containing the form module version details
   * @returns {Promise} An axios response
   */
  createFormModuleVersion(formModuleId, formModuleVersionData) {
    return appAxios().post(
      `${ApiRoutes.FORMMODULES}/${formModuleId}/version`,
      formModuleVersionData
    );
  },

  /**
   * @function updateFormModuleVersion
   * Update a Form module version
   * @param {string} formModuleId The form module uuid
   * @param {string} formModuleVersionId The form module version uuid
   * @param {Object} formModuleVersionData An object containing the form module version details
   * @returns {Promise} An axios response
   */
  updateFormModuleVersion(
    formModuleId,
    formModuleVersionId,
    formModuleVersionData
  ) {
    return appAxios().put(
      `${ApiRoutes.FORMMODULES}/${formModuleId}/version/${formModuleVersionId}`,
      formModuleVersionData
    );
  },

  /**
   * @function listFormModuleIdentityProviders
   * Read all the form module's identity providers in the DB
   * @returns {Promise} An axios response
   */
  listFormModuleIdentityProviders(formModuleId, params = {}) {
    return appAxios().get(`${ApiRoutes.FORMMODULES}/${formModuleId}/idp`, {
      params: params,
    });
  },
};
