import { appAxios } from '@/services/interceptors';
import { ApiRoutes } from '@/utils/constants';

export default {

  /**
  * @function getUsers
  * Get users (used for searching or filtering users by params)
  * @param {Object} [params={}] The query parameters
  * @returns {Promise} An axios response
  */
  getUsers(params = {}) {
    return appAxios().get(`${ApiRoutes.USERS}/`, { params });
  }

};
