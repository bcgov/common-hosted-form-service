const { getMockReq, getMockRes } = require('@jest-mock/express');
const { v4: uuidv4 } = require('uuid');

const validateParameter = require('../../../../../src/forms/common/middleware/validateParameter');
const formService = require('../../../../../src/forms/form/service');
const submissionService = require('../../../../../src/forms/submission/service');

const formId = uuidv4();
const formSubmissionId = uuidv4();

// Various types of invalid UUIDs that we see in API calls.
const invalidUuids = [[''], ['undefined'], ['{{id}}'], ['${id}'], [uuidv4() + '.'], [' ' + uuidv4() + ' ']];

afterEach(() => {
  jest.clearAllMocks();
});

describe('validateDocumentTemplateId', () => {
  const documentTemplateId = uuidv4();

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
        formId: uuidv4(),
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
          id: uuidv4(),
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

describe('validateFormVersionDraftId', () => {
  const formVersionDraftId = uuidv4();

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
        formId: uuidv4(),
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
  const formVersionId = uuidv4();

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
        formId: uuidv4(),
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
