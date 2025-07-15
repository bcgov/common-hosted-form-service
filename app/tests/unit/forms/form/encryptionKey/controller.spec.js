const { MockModel, MockTransaction } = require('../../../../common/dbHelper');
const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const controller = require('../../../../../src/forms/form/encryptionKey/controller');
const service = require('../../../../../src/forms/form/encryptionKey/service');

jest.mock('../../../../../src/forms/common/models/tables/formEncryptionKey', () => MockModel);

const currentUser = {
  usernameIdp: 'TESTER',
};

const formId = uuid.v4();

const validData = {
  id: uuid.v4(),
  formId: formId,
  name: 'test',
  algorithm: 'aes-256-gcm',
  key: 'ad5520469720325d1694c87511afda28a0432dd974cb77b5b4b9f946a5af6985',
};

const validRequest = {
  body: {
    ...validData,
  },
  currentUser: currentUser,
  params: {
    formId: formId,
    formEncryptionKeyId: validData.id,
  },
};

const error = new Error('error');

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('readEncryptionKey', () => {
  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.readEncryptionKey = jest.fn().mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.readEncryptionKey(req, res, next);

      expect(service.readEncryptionKey).toBeCalledWith(validRequest.params.formId, validRequest.params.formEncryptionKeyId);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.readEncryptionKey = jest.fn().mockResolvedValue(validData);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.readEncryptionKey(req, res, next);

      expect(service.readEncryptionKey).toBeCalledWith(validRequest.params.formId, validRequest.params.formEncryptionKeyId);
      expect(res.json).toBeCalledWith(validData);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('listEncryptionAlgorithms', () => {
  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.listEncryptionAlgorithms = jest.fn().mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.listEncryptionAlgorithms(req, res, next);

      expect(service.listEncryptionAlgorithms).toBeCalledWith();
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.listEncryptionAlgorithms = jest.fn().mockResolvedValue([{ code: 'abc', display: 'ABC' }]);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.listEncryptionAlgorithms(req, res, next);

      expect(service.listEncryptionAlgorithms).toBeCalledWith();
      expect(res.json).toBeCalledWith([{ code: 'abc', display: 'ABC' }]);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});
