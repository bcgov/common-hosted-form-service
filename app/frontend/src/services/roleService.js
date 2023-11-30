import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  //
  // Role Management calls
  //

  /**
   * @function list
   * List roles in the system
   * @returns {Promise} An axios response
   */
  list() {
    return appAxios().get(`${ApiRoutes.ROLES}`);
  },
};
