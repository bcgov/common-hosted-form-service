const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const { ENCRYPTION_ALGORITHMS } = require('../../../../../src/components/encryptionService');

const controller = require('../../../../../src/forms/form/externalApi/controller');
const service = require('../../../../../src/forms/form/externalApi/service');
const { ExternalAPI } = require('../../../../../src/forms/common/models');
const ExternalAPIStatuses = require('../../../../../src/forms/common/constants');

const currentUser = {
  usernameIdp: 'TESTER',
};

const error = new Error('error');

afterEach(() => {
  jest.restoreAllMocks();
});

describe('listExternalAPIs', () => {
  describe('200 response when', () => {
    it('has a successful query call', async () => {
      service.listExternalAPIs = jest.fn().mockReturnValue([]);
      const req = getMockReq({
        params: {
          formId: '123',
        },
      });
      const { res, next } = getMockRes();

      await controller.listExternalAPIs(req, res, next);

      expect(service.listExternalAPIs).toBeCalledWith('123');
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('listExternalAPIAlgorithms', () => {
  describe('200 response when', () => {
    it('has a successful query call', async () => {
      service.listExternalAPIAlgorithms = jest.fn().mockReturnValue([]);
      const req = getMockReq({
        params: {
          formId: '123',
        },
      });
      const { res, next } = getMockRes();

      await controller.listExternalAPIAlgorithms(req, res, next);

      expect(service.listExternalAPIAlgorithms).toBeCalled(); // service doesn't use form id
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('listExternalAPIStatusCodes', () => {
  describe('200 response when', () => {
    it('has a successful query call', async () => {
      service.listExternalAPIStatusCodes = jest.fn().mockReturnValue([]);
      const req = getMockReq({
        params: {
          formId: '123',
        },
      });
      const { res, next } = getMockRes();

      await controller.listExternalAPIStatusCodes(req, res, next);

      expect(service.listExternalAPIStatusCodes).toBeCalled(); // service doesn't use form id
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('createExternalAPI', () => {
  let returnValue = null;
  beforeEach(() => {
    returnValue = null;
    ExternalAPI.mockReturnValue = (value) => {
      returnValue = value;
    };
    ExternalAPI.query = jest.fn().mockReturnThis();
    ExternalAPI.where = jest.fn().mockReturnThis();
    ExternalAPI.modify = jest.fn().mockReturnThis();
    ExternalAPI.first = jest.fn().mockReturnThis();
    ExternalAPI.startTransaction = jest.fn();
    ExternalAPI.throwIfNotFound = jest.fn().mockReturnThis();
    ExternalAPI.then = jest.fn((done) => {
      done(returnValue);
    });
  });

  const formId = uuid.v4();
  const externalApi = {
    id: uuid.v4(),
    formId: formId,
    name: 'test_api',
    endpointUrl: 'http://external.api/',
    sendApiKey: true,
    apiKeyHeader: 'X-API-KEY',
    apiKey: 'my-api-key',
    allowSendUserToken: false,
    sendUserToken: false,
    userTokenHeader: null,
    userTokenBearer: false,
    sendUserInfo: true,
    userInfoHeader: 'X-API-USER',
    userInfoEncrypted: true,
    userInfoEncryptionKey: '0489aa2a7882dc53be7c76db43be1800e56627c31a88a0011d85ccc255b79d00',
    userInfoEncryptionAlgo: ENCRYPTION_ALGORITHMS.AES_256_GCM,
    code: ExternalAPIStatuses.SUBMITTED,
  };
  const validRequest = {
    body: {
      ...externalApi,
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

      await controller.createExternalAPI(req, res, next);

      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(expect.any(TypeError));
    });

    it('has an unsuccessful service call', async () => {
      service.createExternalAPI = jest.fn().mockRejectedValue(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.createExternalAPI(req, res, next);

      expect(service.createExternalAPI).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.createExternalAPI = jest.fn().mockResolvedValue(externalApi);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.createExternalAPI(req, res, next);

      expect(service.createExternalAPI).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser);
      expect(res.json).toBeCalledWith(
        expect.objectContaining({
          ...externalApi,
        })
      );
      expect(res.status).toBeCalledWith(201);
      expect(next).not.toBeCalled();
    });
  });
});

describe('updateExternalAPI', () => {
  let returnValue = null;
  beforeEach(() => {
    returnValue = null;
    ExternalAPI.mockReturnValue = (value) => {
      returnValue = value;
    };
    ExternalAPI.query = jest.fn().mockReturnThis();
    ExternalAPI.where = jest.fn().mockReturnThis();
    ExternalAPI.modify = jest.fn().mockReturnThis();
    ExternalAPI.first = jest.fn().mockReturnThis();
    ExternalAPI.startTransaction = jest.fn();
    ExternalAPI.throwIfNotFound = jest.fn().mockReturnThis();
    ExternalAPI.then = jest.fn((done) => {
      done(returnValue);
    });
  });

  const formId = uuid.v4();
  const externalAPIId = uuid.v4();
  const externalApi = {
    id: externalAPIId,
    formId: formId,
    name: 'test_api',
    endpointUrl: 'http://external.api/',
    sendApiKey: true,
    apiKeyHeader: 'X-API-KEY',
    apiKey: 'my-api-key',
    sendUserToken: true,
    userTokenHeader: 'Authorization',
    userTokenBearer: true,
    sendUserInfo: true,
    userInfoHeader: 'X-API-USER',
    userInfoEncrypted: true,
    userInfoEncryptionKey: '0489aa2a7882dc53be7c76db43be1800e56627c31a88a0011d85ccc255b79d00',
    userInfoEncryptionAlgo: ENCRYPTION_ALGORITHMS.AES_256_GCM,
    code: ExternalAPIStatuses.SUBMITTED,
  };
  const validRequest = {
    body: {
      ...externalApi,
    },
    currentUser: currentUser,
    params: {
      formId: formId,
      externalAPIId: externalAPIId,
    },
  };

  describe('error response when', () => {
    it('has no current user', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.currentUser;
      const req = getMockReq(invalidRequest);
      const { res, next } = getMockRes();

      await controller.updateExternalAPI(req, res, next);

      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(expect.any(TypeError));
    });

    it('has an unsuccessful service call', async () => {
      service.updateExternalAPI = jest.fn().mockRejectedValue(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.updateExternalAPI(req, res, next);

      expect(service.updateExternalAPI).toBeCalledWith(validRequest.params.formId, validRequest.params.externalAPIId, validRequest.body, validRequest.currentUser);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.updateExternalAPI = jest.fn().mockResolvedValue(externalApi);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.updateExternalAPI(req, res, next);

      expect(service.updateExternalAPI).toBeCalledWith(validRequest.params.formId, validRequest.params.externalAPIId, validRequest.body, validRequest.currentUser);
      expect(res.json).toBeCalledWith(
        expect.objectContaining({
          ...externalApi,
        })
      );
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('deleteExternalAPI', () => {
  let returnValue = null;
  beforeEach(() => {
    returnValue = null;
    ExternalAPI.mockReturnValue = (value) => {
      returnValue = value;
    };
    ExternalAPI.query = jest.fn().mockReturnThis();
    ExternalAPI.where = jest.fn().mockReturnThis();
    ExternalAPI.modify = jest.fn().mockReturnThis();
    ExternalAPI.first = jest.fn().mockReturnThis();
    ExternalAPI.startTransaction = jest.fn();
    ExternalAPI.throwIfNotFound = jest.fn().mockReturnThis();
    ExternalAPI.then = jest.fn((done) => {
      done(returnValue);
    });
  });

  const formId = uuid.v4();
  const externalAPIId = uuid.v4();

  const validRequest = {
    currentUser: currentUser,
    params: {
      formId: formId,
      externalAPIId: externalAPIId,
    },
  };

  describe('error response when', () => {
    it('has no current user', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.currentUser;
      const req = getMockReq(invalidRequest);
      const { res, next } = getMockRes();

      await controller.deleteExternalAPI(req, res, next);

      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(expect.any(TypeError));
    });

    it('has an unsuccessful service call', async () => {
      service.deleteExternalAPI = jest.fn().mockRejectedValue(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.deleteExternalAPI(req, res, next);

      expect(service.deleteExternalAPI).toBeCalledWith(validRequest.params.formId, validRequest.params.externalAPIId);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.deleteExternalAPI = jest.fn().mockResolvedValue();
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.deleteExternalAPI(req, res, next);

      expect(service.deleteExternalAPI).toBeCalledWith(validRequest.params.formId, validRequest.params.externalAPIId);
      expect(res.json).not.toBeCalled();
      expect(res.sendStatus).toBeCalledWith(204);
      expect(next).not.toBeCalled();
    });
  });
});
