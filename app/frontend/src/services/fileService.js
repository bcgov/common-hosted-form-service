import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  async deleteFile(fileId) {
    return appAxios().delete(`${ApiRoutes.FILES}/${fileId}`);
  },
  async getFile(fileId, options = {}) {
    return appAxios().get(`${ApiRoutes.FILES}/${fileId}`, options);
  },
  async uploadFile(file, config = {}) {
    return appAxios().post(`${ApiRoutes.FILES}`, file, config);
  },
};
