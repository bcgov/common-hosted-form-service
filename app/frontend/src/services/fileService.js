import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  async getFile(fileId) {
    return appAxios().get(`${ApiRoutes.FILES}/${fileId}`);
  },
};
