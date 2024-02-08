const { getMockReq, getMockRes } = require('@jest-mock/express');
const { v4: uuidv4 } = require('uuid');

const params = require('../../../../../src/forms/auth/middleware/params');
const formService = require('../../../../../src/forms/form/service');

const formId = uuidv4();

// Various types of invalid UUIDs that we see in API calls.
const invalidUuids = [[''], ['undefined'], ['{{id}}'], ['${id}'], [uuidv4() + '.'], [' ' + uuidv4() + ' ']];

afterEach(() => {
  jest.clearAllMocks();
});

describe('validateFormId', () => {
  it('400s if the formId is missing', async () => {
    const req = getMockReq({
      params: {},
    });
    const { res, next } = getMockRes();

    await params.validateFormId(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  test.each(invalidUuids)('400s if the formId is "%s"', async (eachFormId) => {
    const req = getMockReq({
      params: { formId: eachFormId },
    });
    const { res, next } = getMockRes();

    await params.validateFormId(req, res, next, eachFormId);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('passes through if the formId is valid', async () => {
    const req = getMockReq({
      params: {
        formId: formId,
      },
    });
    const { res, next } = getMockRes();

    await params.validateFormId(req, res, next, formId);

    expect(next).toHaveBeenCalledWith();
  });
});

describe('validateFormVersionDraftId', () => {
  const formVersionDraftId = uuidv4();

  const mockReadDraftResponse = {
    formId: formId,
    id: formVersionDraftId,
  };

  formService.readDraft = jest.fn().mockReturnValue(mockReadDraftResponse);

  it('400s if the formVersionDraftId is missing', async () => {
    const req = getMockReq({
      params: {
        formId: formId,
      },
    });
    const { res, next } = getMockRes();

    await params.validateFormVersionDraftId(req, res, next);

    expect(formService.readDraft).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  test.each(invalidUuids)('400s if the formVersionDraftId is "%s"', async (eachFormVersionDraftId) => {
    const req = getMockReq({
      params: { formId: formId, formVersionDraftId: eachFormVersionDraftId },
    });
    const { res, next } = getMockRes();

    await params.validateFormVersionDraftId(req, res, next, eachFormVersionDraftId);

    expect(formService.readDraft).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('404s if the formId does not match', async () => {
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

    await params.validateFormVersionDraftId(req, res, next, formVersionDraftId);

    expect(formService.readDraft).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
  });

  it('propagates service errors', async () => {
    const error = new Error();
    formService.readDraft.mockRejectedValueOnce(error);
    const req = getMockReq({
      params: {
        formId: formId,
        formVersionDraftId: formVersionDraftId,
      },
    });
    const { res, next } = getMockRes();

    await params.validateFormVersionDraftId(req, res, next, formVersionDraftId);

    expect(formService.readDraft).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  it('passes through if the formVersionDraftId matches', async () => {
    const req = getMockReq({
      params: {
        formId: formId,
        formVersionDraftId: formVersionDraftId,
      },
    });
    const { res, next } = getMockRes();

    await params.validateFormVersionDraftId(req, res, next, formVersionDraftId);

    expect(formService.readDraft).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});

describe('validateFormVersionId', () => {
  const formVersionId = uuidv4();

  const mockReadVersionResponse = {
    formId: formId,
    id: formVersionId,
  };

  formService.readVersion = jest.fn().mockReturnValue(mockReadVersionResponse);

  it('400s if the formVersionId is missing', async () => {
    const req = getMockReq({
      params: {
        formId: formId,
      },
    });
    const { res, next } = getMockRes();

    await params.validateFormVersionId(req, res, next);

    expect(formService.readVersion).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  test.each(invalidUuids)('400s if the formVersionId is "%s"', async (eachFormVersionId) => {
    const req = getMockReq({
      params: { formId: formId, formVersionId: eachFormVersionId },
    });
    const { res, next } = getMockRes();

    await params.validateFormVersionId(req, res, next, eachFormVersionId);

    expect(formService.readVersion).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('404s if the formId does not match', async () => {
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

    await params.validateFormVersionId(req, res, next, formVersionId);

    expect(formService.readVersion).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));
  });

  it('propagates service errors', async () => {
    const error = new Error();
    formService.readVersion.mockRejectedValueOnce(error);
    const req = getMockReq({
      params: {
        formId: formId,
        formVersionId: formVersionId,
      },
    });
    const { res, next } = getMockRes();

    await params.validateFormVersionId(req, res, next, formVersionId);

    expect(formService.readVersion).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  it('passes through if the formVersionId matches', async () => {
    const req = getMockReq({
      params: {
        formId: formId,
        formVersionId: formVersionId,
      },
    });
    const { res, next } = getMockRes();

    await params.validateFormVersionId(req, res, next, formVersionId);

    expect(formService.readVersion).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});
