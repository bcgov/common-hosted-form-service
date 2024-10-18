const { MockModel, MockTransaction } = require('../../../../common/dbHelper');
const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const controller = require('../../../../../src/forms/form/eventStreamConfig/controller');
const service = require('../../../../../src/forms/form/eventStreamConfig/service');

jest.mock('../../../../../src/forms/common/models/tables/formEventStreamConfig', () => MockModel);

const currentUser = {
  usernameIdp: 'TESTER',
};

const formId = uuid.v4();

const validData = {
  id: uuid.v4(),
  formId: formId,
  enablePublicStream: true,
  enablePrivateStream: true,
  encryptionKeyId: uuid.v4(),
};

const validRequest = {
  body: {
    ...validData,
  },
  currentUser: currentUser,
  params: {
    formId: formId,
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

describe('readEventStreamConfig', () => {
  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.readEventStreamConfig = jest.fn().mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.readEventStreamConfig(req, res, next);

      expect(service.readEventStreamConfig).toBeCalledWith(validRequest.params.formId);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.readEventStreamConfig = jest.fn().mockResolvedValue(validData);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.readEventStreamConfig(req, res, next);

      expect(service.readEventStreamConfig).toBeCalledWith(validRequest.params.formId);
      expect(res.json).toBeCalledWith(validData);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});
