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
  /**
   * @function scheduleSubmissionDeletion
   * Schedules a submission for deletion based on the form's retention policy
   * @param {string} formSubmissionId The form submission ID
   * @returns {Promise} An axios response
   */
  scheduleSubmissionDeletion(formSubmissionId, formId) {
    return appAxios().post(
      `${ApiRoutes.RECORDS_MANAGEMENT}/assets/${formSubmissionId}/schedule`,
      {
        formId: formId,
      }
    );
  },
  /**
   * @function cancelScheduledSubmissionDeletion
   * Cancels a scheduled deletion for a submission
   * @param {string} formSubmissionId The form submission ID
   * @returns {Promise} An axios response
   */
  cancelScheduledSubmissionDeletion(formSubmissionId) {
    return appAxios().delete(
      `${ApiRoutes.RECORDS_MANAGEMENT}/assets/${formSubmissionId}/schedule`
    );
  },
};
