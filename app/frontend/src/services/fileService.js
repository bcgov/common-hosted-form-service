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
    const url = `${ApiRoutes.FILES}?formId=${config.formId}`;
    return appAxios().post(url, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    });
  },
};
