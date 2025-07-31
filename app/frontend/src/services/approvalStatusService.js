import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  //
  // Form module calls
  //
  /**
   * @function listApprovalStatusCodes
   * Read all the approval status codes in the DB
   * @returns {Promise} An axios response
   */
  listApprovalStatusCodes() {
    return appAxios().get(`${ApiRoutes.APPROVAL_STATUS}`);
  },
};
