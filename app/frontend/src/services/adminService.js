import { appAxios } from '@/services/interceptors';
import { ApiRoutes } from '@/utils/constants';

export default {
  //
  // Form calls
  //

  /**
   * @function listForms
   * Read all the forms in the DB
   * @param {Boolean} active Don't show deleted forms
   * @returns {Promise} An axios response
   */
  listForms(active = true) {
    return appAxios().get(`${ApiRoutes.ADMIN}${ApiRoutes.FORMS}`, { params: { active: active } });
  },

  //
  // USer calls
  //

  /**
   * @function getUsers
   * Read all the users in the DB
   * @returns {Promise} An axios response
   */
  getUsers() {
    return appAxios().get(`${ApiRoutes.ADMIN}${ApiRoutes.USERS}`);
  },
};
