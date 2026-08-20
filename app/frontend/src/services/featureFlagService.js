import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function listFeatures
   * Get the public feature catalogue (code/name/description/enabled). The global
   * enabled flags are also bootstrapped via /config; this endpoint is the live
   * source of truth.
   * @returns {Promise} An axios response
   */
  listFeatures() {
    return appAxios().get(`${ApiRoutes.FEATURES}`);
  },

  /**
   * @function check
   * Resolve which features are active for a given context (form and/or tenant).
   * Allowlist membership is evaluated server-side; only booleans are returned.
   * @param {Object} [params={}] Query params: { formId, tenantId, code }
   * @returns {Promise} An axios response resolving to { <code>: active(boolean) }
   */
  check(params = {}) {
    return appAxios().get(`${ApiRoutes.FEATURES}/check`, { params });
  },
};
