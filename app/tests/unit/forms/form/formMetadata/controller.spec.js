const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');
const { MockModel } = require('../../../../common/dbHelper');

const controller = require('../../../../../src/forms/form/formMetadata/controller');
const service = require('../../../../../src/forms/form/formMetadata/service');

jest.mock('../../../../../src/forms/common/models/tables/formMetadata', () => MockModel);

const currentUser = {
  usernameIdp: 'TESTER',
};

const error = new Error('error');

afterEach(() => {
  jest.restoreAllMocks();
});

describe('read', () => {
  describe('200 response when', () => {
    it('has a successful query call', async () => {
      service.read = jest.fn().mockReturnValue({});
      const req = getMockReq({
        params: {
          formId: '123',
        },
      });
      const { res, next } = getMockRes();

      await controller.read(req, res, next);

      expect(service.read).toBeCalledWith('123');
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('create', () => {
  beforeEach(() => {
    MockModel.mockReset();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const formId = uuid.v4();
  const item = {
    id: uuid.v4(),
    formId: formId,
    headerName: 'X-FORM-METADATA',
    attributeName: 'formMetadata',
    metadata: { externalId: '456' },
  };
  const validRequest = {
    body: {
      ...item,
    },
    currentUser: currentUser,
    params: {
      formId: formId,
    },
  };

  describe('error response when', () => {
    it('has no current user', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.currentUser;
      const req = getMockReq(invalidRequest);
      const { res, next } = getMockRes();

      await controller.create(req, res, next);

      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(expect.any(TypeError));
    });

    it('has an unsuccessful service call', async () => {
      service.create = jest.fn().mockRejectedValue(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.create(req, res, next);

      expect(service.create).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.create = jest.fn().mockResolvedValue(item);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.create(req, res, next);

      expect(service.create).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser);
      expect(res.json).toBeCalledWith(
        expect.objectContaining({
          ...item,
        })
      );
      expect(res.status).toBeCalledWith(201);
      expect(next).not.toBeCalled();
    });
  });
});

describe('update', () => {
  beforeEach(() => {
    MockModel.mockReset();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const formId = uuid.v4();
  const itemId = uuid.v4();
  const item = {
    id: itemId,
    formId: formId,
    headerName: 'X-FORM-METADATA',
    attributeName: 'formMetadata',
    metadata: { externalId: '456' },
  };
  const validRequest = {
    body: {
      ...item,
    },
    currentUser: currentUser,
    params: {
      formId: formId,
    },
  };

  describe('error response when', () => {
    it('has no current user', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.currentUser;
      const req = getMockReq(invalidRequest);
      const { res, next } = getMockRes();

      await controller.update(req, res, next);

      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(expect.any(TypeError));
    });

    it('has an unsuccessful service call', async () => {
      service.update = jest.fn().mockRejectedValue(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.update(req, res, next);

      expect(service.update).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.update = jest.fn().mockResolvedValue(item);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.update(req, res, next);

      expect(service.update).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser);
      expect(res.json).toBeCalledWith(
        expect.objectContaining({
          ...item,
        })
      );
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('delete', () => {
  beforeEach(() => {
    MockModel.mockReset();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const formId = uuid.v4();

  const validRequest = {
    currentUser: currentUser,
    params: {
      formId: formId,
    },
  };

  describe('error response when', () => {
    it('has no current user', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.currentUser;
      const req = getMockReq(invalidRequest);
      const { res, next } = getMockRes();

      await controller.delete(req, res, next);

      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(expect.any(TypeError));
    });

    it('has an unsuccessful service call', async () => {
      service.delete = jest.fn().mockRejectedValue(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.delete(req, res, next);

      expect(service.delete).toBeCalledWith(validRequest.params.formId);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.delete = jest.fn().mockResolvedValue();
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.delete(req, res, next);

      expect(service.delete).toBeCalledWith(validRequest.params.formId);
      expect(res.json).not.toBeCalled();
      expect(res.sendStatus).toBeCalledWith(204);
      expect(next).not.toBeCalled();
    });
  });
});
