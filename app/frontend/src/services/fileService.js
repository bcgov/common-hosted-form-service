import { appAxios } from '@src/services/interceptors';
import { ApiRoutes } from '@src/utils/constants';

export default {
  async getFile(fileId) {
    return appAxios().get(`${ApiRoutes.FILES}/${fileId}`);
  },
};
