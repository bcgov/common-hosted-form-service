import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  /**
   * @function createCorsOriginRequest
   * Create a new CORS origin request
   * @param {Object} data The CORS origin request object to create
   * @returns {Promise} An axios response
   */
  createCorsOriginRequest(data) {
    return appAxios().post(ApiRoutes.CORS, data);
  },

  /**
   * @function updateCorsOriginRequest
   * Update an existing CORS origin request
   * @param {Object} item The CORS origin request object to update
   * @returns {Promise} An axios response
   */
  updateCorsOriginRequest(item) {
    return appAxios().put(`${ApiRoutes.CORS}/${item.id}`, item);
  },

  /**
   * @function deleteCorsOriginRequest
   * Delete a CORS origin request by ID
   * @param {string} id The ID of the CORS origin request to delete
   * @returns {Promise} An axios response
   */
  deleteCorsOriginRequest(id) {
    return appAxios().delete(`${ApiRoutes.CORS}/${id}`);
  },
};
