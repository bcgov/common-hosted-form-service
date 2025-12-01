import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function listRetentionClassificationTypes
   * Gets the Retention Classification Types supported
   * @returns {Promise} An axios response
   */
  listRetentionClassificationTypes() {
    return appAxios().get(`${ApiRoutes.RECORDS_MANAGEMENT}/classifications`);
  },
  /**
   * @function getFormRetentionPolicy
   * Gets the retention policy for a form
   * @param {string} formId The form ID
   * @returns {Promise} An axios response
   */
  getFormRetentionPolicy(formId) {
    return appAxios().get(
      `${ApiRoutes.RECORDS_MANAGEMENT}/containers/${formId}/policies`
    );
  },
  /**
   * @function configureFormRetentionPolicy
   * Sets/updates the retention policy for a form
   * @param {string} formId The form ID
   * @param {Object} policyData The retention policy data
   * @returns {Promise} An axios response
   */
  configureFormRetentionPolicy(formId, policyData) {
    return appAxios().post(
      `${ApiRoutes.RECORDS_MANAGEMENT}/containers/${formId}/policies`,
      policyData
    );
  },
};
