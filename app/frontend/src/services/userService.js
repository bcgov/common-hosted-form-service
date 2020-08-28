import { appAxios } from '@/services/interceptors';

export default {
  //
  // Form Designer calls
  //

  /**
   * @function getCurrentUser
   * Get the current user details from the rbac endpoint
   * @returns {Promise} An axios response
   */
  getCurrentUser() {
    return appAxios().get('/rbac/current');
  },
};
