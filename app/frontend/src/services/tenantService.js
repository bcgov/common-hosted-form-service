import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function getTenantsForUser
   * Get the list of tenants current user belongs
   * @returns {Promise} An axios response
   */
  getTenantsForUser(params = {}) {
    return appAxios().get(`${ApiRoutes.TENANTS}/me`, { params });
  },
};
