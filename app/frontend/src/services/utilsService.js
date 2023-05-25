import { appAxios } from '@/services/interceptors';
import { ApiRoutes } from '@/utils/constants';

export default {
  //
  // Util calls
  //

  /**
   * @function draftDocGen
   * Upload a template and submission data to generate PDF from CDOGS API
   * @param {Object} body The request body containing the template and submission data
   * @returns {Promise} An axios response
   */
  draftDocGen(body) {
    return appAxios().post(`${ApiRoutes.UTILS}/template/render`, body, {
      responseType: 'arraybuffer', // Needed for binaries unless you want pain
      timeout: 30000, // Override default timeout as this call could take a while
    });
  },
};
