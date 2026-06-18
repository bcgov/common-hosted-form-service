import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

/**
 * Service to intelligently route CDOGS template rendering requests
 * Handles the logic for determining whether to use v1 or v2 endpoints
 * based on CDOGS v3 configuration status
 */
export default {
  /**
   * Determine which CDOGS route to use based on v3 config status
   * @param {string} formId - The form ID
   * @returns {Promise<string>} - 'v1' or 'v2' indicating which endpoint to use
   * @throws {Error} - If v3 is configured but not enabled (403)
   */
  async determineCdogsVersion(formId) {
    try {
      // Try to fetch CDOGS v3 config
      const response = await appAxios().get(
        `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`
      );

      // Config exists - check if enabled
      if (response.data?.enabled) {
        return 'v2';
      } else {
        // Config exists but not enabled - fail fast
        throw new Error(
          'CDOGS v3 is not enabled for this form. Contact your administrator.'
        );
      }
    } catch (error) {
      // If 404, config doesn't exist - use v1 (legacy behavior)
      if (error.response?.status === 404) {
        return 'v1';
      }

      // If 403, config exists but not enabled - propagate error
      if (error.response?.status === 403) {
        throw error;
      }

      // For other errors, default to v1 to maintain backward compatibility
      return 'v1';
    }
  },

  /**
   * Submit a document generation request using the appropriate version
   * @param {string} formId - The form ID (required for v3 check)
   * @param {string} submissionId - The submission ID (optional, for existing submissions)
   * @param {Object} body - The request body
   * @returns {Promise} - The axios response
   */
  async docGen(formId, submissionId, body) {
    const version = await this.determineCdogsVersion(formId);

    if (version === 'v2' && submissionId) {
      // Use v2 submission endpoint
      return appAxios().post(
        `${ApiRoutes.SUBMISSION}/${submissionId}/template/render`,
        body,
        {
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );
    } else {
      // Use v1 submission endpoint (default)
      return appAxios().post(
        `${ApiRoutes.SUBMISSION}/${submissionId}/template/render`,
        body,
        {
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );
    }
  },

  /**
   * Submit a draft document generation request using the appropriate version
   * @param {string} formId - The form ID
   * @param {Object} body - The request body (must include formId, template, submission)
   * @returns {Promise} - The axios response
   */
  async draftDocGen(formId, body) {
    const version = await this.determineCdogsVersion(formId);

    // Both v1 and v2 use the same endpoint for drafts, but v2 requires formId in body
    if (version === 'v2') {
      return appAxios().post(`${ApiRoutes.UTILS}/template/render`, body, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
    } else {
      // v1 - same endpoint but without formId requirement
      return appAxios().post(`${ApiRoutes.UTILS}/template/render`, body, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
    }
  },
};
