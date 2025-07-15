const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const constants = require('../../../../../src/forms/common/constants');
const validateParameter = require('../../../../../src/forms/common/middleware/validateParameter');
const externalApiService = require('../../../../../src/forms/form/externalApi/service');
const formService = require('../../../../../src/forms/form/service');
const submissionService = require('../../../../../src/forms/submission/service');

// Various types of invalid UUIDs that we see in API calls.
const invalidUuids = [[''], ['undefined'], ['{{id}}'], ['${id}'], [uuid.v4() + '.'], [' ' + uuid.v4() + ' ']];

afterEach(() => {
  jest.clearAllMocks();
});

describe('validateComponentId', () => {
  const componentId = uuid.v4();

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('componentId is missing', async () => {
      const req = getMockReq({
        params: {},
      });
      const { res, next } = getMockRes();

      await validateParameter.validateComponentId(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test.each(invalidUuids)('componentId is "%s"', async (eachComponentId) => {
      const req = getMockReq({
        params: { componentId: eachComponentId },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateComponentId(req, res, next, eachComponentId);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('allows', () => {
    test('uuid for componentId', async () => {
      const req = getMockReq({
        params: {
          componentId: componentId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateComponentId(req, res, next, componentId);

      expect(next).toBeCalledWith();
    });
  });
});

describe('validateDocumentTemplateId', () => {
  const documentTemplateId = uuid.v4();
  const formId = uuid.v4();
  const formSubmissionId = uuid.v4();

  const mockReadDocumentTemplateResponse = {
    formId: formId,
    id: documentTemplateId,
  };

  const mockReadSubmissionResponse = {
    form: {
      id: formId,
    },
  };

  formService.documentTemplateRead = jest.fn().mockReturnValue(mockReadDocumentTemplateResponse);
  submissionService.read = jest.fn().mockReturnValue(mockReadSubmissionResponse);

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('documentTemplateId is missing', async () => {
      const req = getMockReq({
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateDocumentTemplateId(req, res, next);

      expect(formService.documentTemplateRead).toBeCalledTimes(0);
      expect(submissionService.read).toBeCalledTimes(0);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test.each(invalidUuids)('documentTemplateId is "%s"', async (eachDocumentTemplateId) => {
      const req = getMockReq({
        params: { formId: formId, documentTemplateId: eachDocumentTemplateId },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateDocumentTemplateId(req, res, next, eachDocumentTemplateId);

      expect(formService.documentTemplateRead).toBeCalledTimes(0);
      expect(submissionService.read).toBeCalledTimes(0);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('404 response when', () => {
    const expectedStatus = { status: 404 };

    test('formId and formSubmissionId are missing', async () => {
      const req = getMockReq({
        params: {
          documentTemplateId: documentTemplateId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateDocumentTemplateId(req, res, next, documentTemplateId);

      expect(formService.documentTemplateRead).toBeCalledTimes(0);
      expect(submissionService.read).toBeCalledTimes(0);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('formId does not match', async () => {
      formService.documentTemplateRead.mockReturnValueOnce({
        formId: uuid.v4(),
        id: documentTemplateId,
      });
      const req = getMockReq({
        params: {
          formId: formId,
          documentTemplateId: documentTemplateId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateDocumentTemplateId(req, res, next, documentTemplateId);

      expect(formService.documentTemplateRead).toBeCalledTimes(1);
      expect(submissionService.read).toBeCalledTimes(0);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('submission formId does not match', async () => {
      submissionService.read.mockReturnValueOnce({
        form: {
          id: uuid.v4(),
        },
      });
      const req = getMockReq({
        params: {
          formSubmissionId: formSubmissionId,
          documentTemplateId: documentTemplateId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateDocumentTemplateId(req, res, next, documentTemplateId);

      expect(formService.documentTemplateRead).toBeCalledTimes(1);
      expect(submissionService.read).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('handles error thrown by', () => {
    test('submissionService.read', async () => {
      const error = new Error();
      submissionService.read.mockRejectedValueOnce(error);
      const req = getMockReq({
        params: {
          formSubmissionId: formSubmissionId,
          documentTemplateId: documentTemplateId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateDocumentTemplateId(req, res, next, documentTemplateId);

      expect(formService.documentTemplateRead).toBeCalledTimes(0);
      expect(submissionService.read).toBeCalledTimes(1);
      expect(next).toBeCalledWith(error);
    });

    test('formService.documentTemplateRead', async () => {
      const error = new Error();
      formService.documentTemplateRead.mockRejectedValueOnce(error);
      const req = getMockReq({
        params: {
          formId: formId,
          documentTemplateId: documentTemplateId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateDocumentTemplateId(req, res, next, documentTemplateId);

      expect(formService.documentTemplateRead).toBeCalledTimes(1);
      expect(submissionService.read).toBeCalledTimes(0);
      expect(next).toBeCalledWith(error);
    });
  });

  describe('allows', () => {
    test('document template with matching form id', async () => {
      const req = getMockReq({
        params: {
          formId: formId,
          documentTemplateId: documentTemplateId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateDocumentTemplateId(req, res, next, documentTemplateId);

      expect(formService.documentTemplateRead).toBeCalledTimes(1);
      expect(submissionService.read).toBeCalledTimes(0);
      expect(next).toBeCalledWith();
    });

    test('document template with matching submission form id', async () => {
      const req = getMockReq({
        params: {
          formSubmissionId: formSubmissionId,
          documentTemplateId: documentTemplateId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateDocumentTemplateId(req, res, next, documentTemplateId);

      expect(formService.documentTemplateRead).toBeCalledTimes(1);
      expect(submissionService.read).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});

describe('validateExternalApiId', () => {
  const externalApiId = uuid.v4();
  const formId = uuid.v4();

  const mockReadExternalApiResponse = {
    formId: formId,
    id: externalApiId,
  };

  externalApiService.readExternalAPI = jest.fn().mockReturnValue(mockReadExternalApiResponse);

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('externalAPIId is missing', async () => {
      const req = getMockReq({
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateExternalAPIId(req, res, next);

      expect(externalApiService.readExternalAPI).toBeCalledTimes(0);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test.each(invalidUuids)('externalAPIId is "%s"', async (eachExternalApiId) => {
      const req = getMockReq({
        params: {
          formId: formId,
          externalAPIId: eachExternalApiId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateExternalAPIId(req, res, next, eachExternalApiId);

      expect(externalApiService.readExternalAPI).toBeCalledTimes(0);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('404 response when', () => {
    const expectedStatus = { status: 404 };

    test('externalApiId not found', async () => {
      externalApiService.readExternalAPI.mockReturnValueOnce(null);
      const req = getMockReq({
        params: {
          externalAPIId: externalApiId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateExternalAPIId(req, res, next, externalApiId);

      expect(externalApiService.readExternalAPI).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('formId does not match', async () => {
      externalApiService.readExternalAPI.mockReturnValueOnce({
        formId: uuid.v4(),
        id: externalApiId,
      });
      const req = getMockReq({
        params: {
          externalAPIId: externalApiId,
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateExternalAPIId(req, res, next, externalApiId);

      expect(externalApiService.readExternalAPI).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('handles error thrown by', () => {
    test('readVersion', async () => {
      const error = new Error();
      externalApiService.readExternalAPI.mockRejectedValueOnce(error);
      const req = getMockReq({
        params: {
          externalAPIId: externalApiId,
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateExternalAPIId(req, res, next, externalApiId);

      expect(externalApiService.readExternalAPI).toBeCalledTimes(1);
      expect(next).toBeCalledWith(error);
    });
  });

  describe('allows', () => {
    test('external api with matching form id', async () => {
      const req = getMockReq({
        params: {
          externalAPIId: externalApiId,
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateExternalAPIId(req, res, next, externalApiId);

      expect(externalApiService.readExternalAPI).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    test('external api id only', async () => {
      const req = getMockReq({
        params: {
          externalAPIId: externalApiId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateExternalAPIId(req, res, next, externalApiId);

      expect(externalApiService.readExternalAPI).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});

describe('validateFileId', () => {
  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('fileId is missing', async () => {
      const req = getMockReq({
        params: {},
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFileId(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test.each(invalidUuids)('fileId is "%s"', async (eachFileId) => {
      const req = getMockReq({
        params: { fileId: eachFileId },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFileId(req, res, next, eachFileId);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('allows', () => {
    test('uuid for fileId', async () => {
      const fileId = uuid.v4();
      const req = getMockReq({
        params: {
          fileId: fileId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFileId(req, res, next, fileId);

      expect(next).toBeCalledWith();
    });
  });
});

describe('validateFormId', () => {
  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('formId is missing', async () => {
      const req = getMockReq({
        params: {},
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormId(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test.each(invalidUuids)('formId is "%s"', async (eachFormId) => {
      const req = getMockReq({
        params: { formId: eachFormId },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormId(req, res, next, eachFormId);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('allows', () => {
    test('uuid for formId', async () => {
      const formId = uuid.v4();
      const req = getMockReq({
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormId(req, res, next, formId);

      expect(next).toBeCalledWith();
    });
  });
});

describe('validateFormSubmissionId', () => {
  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('formSubmissionId is missing', async () => {
      const req = getMockReq({
        params: {},
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormSubmissionId(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test.each(invalidUuids)('formSubmissionId is "%s"', async (eachFormSubmissionId) => {
      const req = getMockReq({
        params: { formSubmissionId: eachFormSubmissionId },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormSubmissionId(req, res, next, eachFormSubmissionId);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('allows', () => {
    test('uuid for formSubmissionId', async () => {
      const formSubmissionId = uuid.v4();
      const req = getMockReq({
        params: {
          formSubmissionId: formSubmissionId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormSubmissionId(req, res, next, formSubmissionId);

      expect(next).toBeCalledWith();
    });
  });
});

describe('validateFormVersionDraftId', () => {
  const formId = uuid.v4();
  const formVersionDraftId = uuid.v4();

  const mockReadDraftResponse = {
    formId: formId,
    id: formVersionDraftId,
  };

  formService.readDraft = jest.fn().mockReturnValue(mockReadDraftResponse);

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('formVersionDraftId is missing', async () => {
      const req = getMockReq({
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionDraftId(req, res, next);

      expect(formService.readDraft).toBeCalledTimes(0);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test.each(invalidUuids)('formVersionDraftId is "%s"', async (eachFormVersionDraftId) => {
      const req = getMockReq({
        params: { formId: formId, formVersionDraftId: eachFormVersionDraftId },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionDraftId(req, res, next, eachFormVersionDraftId);

      expect(formService.readDraft).toBeCalledTimes(0);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('404 response when', () => {
    const expectedStatus = { status: 404 };

    test('formId is missing', async () => {
      const req = getMockReq({
        params: {
          formVersionDraftId: formVersionDraftId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionDraftId(req, res, next, formVersionDraftId);

      expect(formService.readDraft).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('formId does not match', async () => {
      formService.readDraft.mockReturnValueOnce({
        formId: uuid.v4(),
        id: formVersionDraftId,
      });
      const req = getMockReq({
        params: {
          formId: formId,
          formVersionDraftId: formVersionDraftId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionDraftId(req, res, next, formVersionDraftId);

      expect(formService.readDraft).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('handles error thrown by', () => {
    test('readDraft', async () => {
      const error = new Error();
      formService.readDraft.mockRejectedValueOnce(error);
      const req = getMockReq({
        params: {
          formId: formId,
          formVersionDraftId: formVersionDraftId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionDraftId(req, res, next, formVersionDraftId);

      expect(formService.readDraft).toBeCalledTimes(1);
      expect(next).toBeCalledWith(error);
    });
  });

  describe('allows', () => {
    test('form version draft with matching form id', async () => {
      const req = getMockReq({
        params: {
          formId: formId,
          formVersionDraftId: formVersionDraftId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionDraftId(req, res, next, formVersionDraftId);

      expect(formService.readDraft).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});

describe('validateFormVersionId', () => {
  const formId = uuid.v4();
  const formVersionId = uuid.v4();

  const mockReadVersionResponse = {
    formId: formId,
    id: formVersionId,
  };

  formService.readVersion = jest.fn().mockReturnValue(mockReadVersionResponse);

  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('formVersionId is missing', async () => {
      const req = getMockReq({
        params: {
          formId: formId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionId(req, res, next);

      expect(formService.readVersion).toBeCalledTimes(0);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test.each(invalidUuids)('formVersionId is "%s"', async (eachFormVersionId) => {
      const req = getMockReq({
        params: { formId: formId, formVersionId: eachFormVersionId },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionId(req, res, next, eachFormVersionId);

      expect(formService.readVersion).toBeCalledTimes(0);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('404 response when', () => {
    const expectedStatus = { status: 404 };

    test('formId is missing', async () => {
      const req = getMockReq({
        params: {
          formVersionId: formVersionId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionId(req, res, next, formVersionId);

      expect(formService.readVersion).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('formId does not match', async () => {
      formService.readVersion.mockReturnValueOnce({
        formId: uuid.v4(),
        id: formVersionId,
      });
      const req = getMockReq({
        params: {
          formId: formId,
          formVersionId: formVersionId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionId(req, res, next, formVersionId);

      expect(formService.readVersion).toBeCalledTimes(1);
      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('handles error thrown by', () => {
    test('readVersion', async () => {
      const error = new Error();
      formService.readVersion.mockRejectedValueOnce(error);
      const req = getMockReq({
        params: {
          formId: formId,
          formVersionId: formVersionId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionId(req, res, next, formVersionId);

      expect(formService.readVersion).toBeCalledTimes(1);
      expect(next).toBeCalledWith(error);
    });
  });

  describe('allows', () => {
    test('form version with matching form id', async () => {
      const req = getMockReq({
        params: {
          formId: formId,
          formVersionId: formVersionId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateFormVersionId(req, res, next, formVersionId);

      expect(formService.readVersion).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });
  });
});

describe('validatePermissionCode', () => {
  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('code is missing', async () => {
      const req = getMockReq({
        params: {},
      });
      const { res, next } = getMockRes();

      await validateParameter.validatePermissionCode(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('code is invalid', async () => {
      const req = getMockReq({
        params: {
          code: 'this-is-not-valid',
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validatePermissionCode(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('allows', () => {
    test.each(Object.values(constants.Permissions))('code is "%s"', async (eachCode) => {
      const req = getMockReq({
        params: { code: eachCode },
      });
      const { res, next } = getMockRes();

      await validateParameter.validatePermissionCode(req, res, next, eachCode);

      expect(next).toBeCalledWith();
    });
  });
});

describe('validateRoleCode', () => {
  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('code is missing', async () => {
      const req = getMockReq({
        params: {},
      });
      const { res, next } = getMockRes();

      await validateParameter.validateRoleCode(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test('code is invalid', async () => {
      const req = getMockReq({
        params: {
          code: 'this-is-not-valid',
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateRoleCode(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('allows', () => {
    test.each(Object.values(constants.Roles))('code is "%s"', async (eachCode) => {
      const req = getMockReq({
        params: { code: eachCode },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateRoleCode(req, res, next, eachCode);

      expect(next).toBeCalledWith();
    });
  });
});

describe('validateUserId', () => {
  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    test('userId is missing', async () => {
      const req = getMockReq({
        params: {},
      });
      const { res, next } = getMockRes();

      await validateParameter.validateUserId(req, res, next);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });

    test.each(invalidUuids)('userId is "%s"', async (eachUserId) => {
      const req = getMockReq({
        params: { userId: eachUserId },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateUserId(req, res, next, eachUserId);

      expect(next).toBeCalledWith(expect.objectContaining(expectedStatus));
    });
  });

  describe('allows', () => {
    test('uuid for userId', async () => {
      const userId = uuid.v4();
      const req = getMockReq({
        params: {
          userId: userId,
        },
      });
      const { res, next } = getMockRes();

      await validateParameter.validateUserId(req, res, next, userId);

      expect(next).toBeCalledWith();
    });
  });
});
