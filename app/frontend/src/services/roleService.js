import { appAxios } from '@src/services/interceptors';
import { ApiRoutes } from '@src/utils/constants';

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
