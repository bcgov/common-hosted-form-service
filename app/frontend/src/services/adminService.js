import { appAxios } from '@/services/interceptors';
import { ApiRoutes } from '@/utils/constants';

export default {
  //
  // Form calls
  //

  /**
   * @function listForms
   * Read all the forms in the DB
   * @param {Boolean} active Don't shop deleted forms
   * @returns {Promise} An axios response
   */
  listForms(active = true) {
    return appAxios().get(`${ApiRoutes.ADMIN}${ApiRoutes.FORMS}`, { params: { active: active } }
    );
  },
};
