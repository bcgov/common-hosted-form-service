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
    // formSubmissionId names the submission being edited, so people who can
    // edit only that submission may upload to it.
    const submissionQuery = config.formSubmissionId
      ? `&formSubmissionId=${config.formSubmissionId}`
      : '';
    const url = `${ApiRoutes.FILES}?formId=${config.formId}${submissionQuery}`;
    return appAxios().post(url, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    });
  },
};
