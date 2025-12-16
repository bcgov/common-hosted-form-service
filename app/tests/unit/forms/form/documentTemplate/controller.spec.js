const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const controller = require('../../../../../src/forms/form/documentTemplate/controller');
const service = require('../../../../../src/forms/form/documentTemplate/service');

const currentUser = {
  usernameIdp: 'TESTER',
};

const formId = uuid.v4();
const documentTemplateId = uuid.v4();

const validDocumentTemplate = {
  id: documentTemplateId,
  formId: formId,
  filename: 'test.txt',
  template: 'Template content',
};

const error = new Error('error');

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('documentTemplateCreate', () => {
  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.documentTemplateCreate = jest.fn().mockRejectedValueOnce(error);
      const req = getMockReq({
        params: { formId: formId },
        body: validDocumentTemplate,
        currentUser: currentUser,
      });
      const { res, next } = getMockRes();

      await controller.documentTemplateCreate(req, res, next);

      expect(service.documentTemplateCreate).toBeCalledWith(formId, validDocumentTemplate, currentUser.usernameIdp);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('201 response when', () => {
    it('has a successful service call', async () => {
      service.documentTemplateCreate = jest.fn().mockResolvedValue(validDocumentTemplate);
      const req = getMockReq({
        params: { formId: formId },
        body: validDocumentTemplate,
        currentUser: currentUser,
      });
      const { res, next } = getMockRes();

      await controller.documentTemplateCreate(req, res, next);

      expect(service.documentTemplateCreate).toBeCalledWith(formId, validDocumentTemplate, currentUser.usernameIdp);
      expect(res.json).toBeCalledWith(validDocumentTemplate);
      expect(res.status).toBeCalledWith(201);
      expect(next).not.toBeCalled();
    });
  });
});

describe('documentTemplateDelete', () => {
  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.documentTemplateDelete = jest.fn().mockRejectedValueOnce(error);
      const req = getMockReq({
        params: { documentTemplateId: documentTemplateId },
        currentUser: currentUser,
      });
      const { res, next } = getMockRes();

      await controller.documentTemplateDelete(req, res, next);

      expect(service.documentTemplateDelete).toBeCalledWith(documentTemplateId, currentUser.usernameIdp);
      expect(res.sendStatus).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('204 response when', () => {
    it('has a successful service call', async () => {
      service.documentTemplateDelete = jest.fn().mockResolvedValue();
      const req = getMockReq({
        params: { documentTemplateId: documentTemplateId },
        currentUser: currentUser,
      });
      const { res, next } = getMockRes();

      await controller.documentTemplateDelete(req, res, next);

      expect(service.documentTemplateDelete).toBeCalledWith(documentTemplateId, currentUser.usernameIdp);
      expect(res.sendStatus).toBeCalledWith(204);
      expect(next).not.toBeCalled();
    });
  });
});

describe('documentTemplateList', () => {
  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.documentTemplateList = jest.fn().mockRejectedValueOnce(error);
      const req = getMockReq({
        params: { formId: formId },
        currentUser: currentUser,
      });
      const { res, next } = getMockRes();

      await controller.documentTemplateList(req, res, next);

      expect(service.documentTemplateList).toBeCalledWith(formId);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      const templates = [validDocumentTemplate];
      service.documentTemplateList = jest.fn().mockResolvedValue(templates);
      const req = getMockReq({
        params: { formId: formId },
        currentUser: currentUser,
      });
      const { res, next } = getMockRes();

      await controller.documentTemplateList(req, res, next);

      expect(service.documentTemplateList).toBeCalledWith(formId);
      expect(res.json).toBeCalledWith(templates);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});

describe('documentTemplateRead', () => {
  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.documentTemplateRead = jest.fn().mockRejectedValueOnce(error);
      const req = getMockReq({
        params: { documentTemplateId: documentTemplateId },
        currentUser: currentUser,
      });
      const { res, next } = getMockRes();

      await controller.documentTemplateRead(req, res, next);

      expect(service.documentTemplateRead).toBeCalledWith(documentTemplateId);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('200 response when', () => {
    it('has a successful service call', async () => {
      service.documentTemplateRead = jest.fn().mockResolvedValue(validDocumentTemplate);
      const req = getMockReq({
        params: { documentTemplateId: documentTemplateId },
        currentUser: currentUser,
      });
      const { res, next } = getMockRes();

      await controller.documentTemplateRead(req, res, next);

      expect(service.documentTemplateRead).toBeCalledWith(documentTemplateId);
      expect(res.json).toBeCalledWith(validDocumentTemplate);
      expect(res.status).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});
