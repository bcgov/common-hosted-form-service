import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

const resourcePath = (formId, submissionId) =>
  submissionId
    ? `${ApiRoutes.SUBMISSION}/${submissionId}/turnstile`
    : `${ApiRoutes.FORMS}/${formId}/turnstile`;

export default {
  readStatus(formId, submissionId, unused = false) {
    return appAxios().get(resourcePath(formId, submissionId), {
      params: { unused: unused || undefined },
    });
  },

  verifyChallenge(formId, token, submissionId, unused = false) {
    return appAxios().post(
      resourcePath(formId, submissionId),
      { token },
      { params: { unused: unused || undefined } }
    );
  },
};
