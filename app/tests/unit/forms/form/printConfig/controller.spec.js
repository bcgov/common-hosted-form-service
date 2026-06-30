const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const controller = require('../../../../../src/forms/form/printConfig/controller');
const service = require('../../../../../src/forms/form/printConfig/service');
const { PrintConfigTypes } = require('../../../../../src/forms/common/constants');

const currentUser = {
  usernameIdp: 'TESTER',
};

const formId = uuid.v4();
const templateId = uuid.v4();

const validDefaultConfig = {
  id: uuid.v4(),
  formId: formId,
  code: PrintConfigTypes.DEFAULT,
  templateId: null,
  outputFileType: null,
  reportName: null,
  reportNameOption: null,
};

const validDirectConfig = {
  id: uuid.v4(),
  formId: formId,
  code: PrintConfigTypes.DIRECT,
  templateId: templateId,
  outputFileType: 'pdf',
  reportName: null,
  reportNameOption: 'formName',
};

const validRequest = {
  params: {
    formId: formId,
  },
  body: {
    code: PrintConfigTypes.DEFAULT,
  },
  currentUser: currentUser,
};

const error = new Error('error');

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('readPrintConfig', () => {
  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.readPrintConfig = jest.fn().mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.readPrintConfig(req, res, next);

      expect(service.readPrintConfig).toBeCalledWith(validRequest.params.formId);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call returning config', async () => {
      service.readPrintConfig = jest.fn().mockResolvedValue(validDefaultConfig);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.readPrintConfig(req, res, next);

      expect(service.readPrintConfig).toBeCalledWith(validRequest.params.formId);
      expect(res.json).toBeCalledWith(validDefaultConfig);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });

    it('has a successful service call returning null', async () => {
      service.readPrintConfig = jest.fn().mockResolvedValue(null);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.readPrintConfig(req, res, next);

      expect(service.readPrintConfig).toBeCalledWith(validRequest.params.formId);
      expect(res.json).toBeCalledWith(null);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('upsertPrintConfig', () => {
  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.upsert = jest.fn().mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.upsertPrintConfig(req, res, next);

      expect(service.upsert).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call creating config', async () => {
      service.upsert = jest.fn().mockResolvedValue(validDefaultConfig);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.upsertPrintConfig(req, res, next);

      expect(service.upsert).toBeCalledWith(validRequest.params.formId, validRequest.body, validRequest.currentUser);
      expect(res.json).toBeCalledWith(validDefaultConfig);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });

    it('has a successful service call updating config', async () => {
      const updateRequest = {
        ...validRequest,
        body: {
          code: PrintConfigTypes.DIRECT,
          templateId: templateId,
          outputFileType: 'pdf',
        },
      };
      service.upsert = jest.fn().mockResolvedValue(validDirectConfig);
      const req = getMockReq(updateRequest);
      const { res, next } = getMockRes();

      await controller.upsertPrintConfig(req, res, next);

      expect(service.upsert).toBeCalledWith(updateRequest.params.formId, updateRequest.body, updateRequest.currentUser);
      expect(res.json).toBeCalledWith(validDirectConfig);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });

    it('has a successful service call updating config with reportName and reportNameOption', async () => {
      const updateRequest = {
        ...validRequest,
        body: {
          code: PrintConfigTypes.DIRECT,
          templateId: templateId,
          outputFileType: 'pdf',
          reportName: 'Custom Report Name',
          reportNameOption: 'custom',
        },
      };
      const configWithReportName = {
        ...validDirectConfig,
        reportName: 'Custom Report Name',
        reportNameOption: 'custom',
      };
      service.upsert = jest.fn().mockResolvedValue(configWithReportName);
      const req = getMockReq(updateRequest);
      const { res, next } = getMockRes();

      await controller.upsertPrintConfig(req, res, next);

      expect(service.upsert).toBeCalledWith(updateRequest.params.formId, updateRequest.body, updateRequest.currentUser);
      expect(res.json).toBeCalledWith(configWithReportName);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});
