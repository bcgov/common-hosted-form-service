const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const controller = require('../../../../src/forms/file/controller');
const service = require('../../../../src/forms/file/service');
const storageService = require('../../../../src/forms/file/storage/storageService');

const currentUser = {
  usernameIdp: 'TESTER',
};

const fileStorage = {
  createdAt: '2024-06-25T13:53:01-0700',
  createdBy: currentUser.usernameIdp,
  id: uuid.v4(),
  mimeType: 'text/plain',
  originalName: 'testfile.txt',
  path: '/some/path',
  size: 1337,
  storage: 'uploads',
};

const error = new Error('error');

//
// Mock out all happy-path service calls.
//

service.create = jest.fn().mockReturnValue(fileStorage);
service.delete = jest.fn().mockReturnValue();

storageService.read = jest.fn().mockReturnValue(fileStorage);

afterEach(() => {
  jest.restoreAllMocks();
});

describe('create', () => {
  // These are created by the middleware.
  const validRequest = {
    currentUser: currentUser,
    file: {},
  };

  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.create.mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.create(req, res, next);

      expect(service.create).toBeCalledWith(validRequest.file, validRequest.currentUser);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  describe('201 response when', () => {
    it('has a successful service call', async () => {
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.create(req, res, next);

      expect(service.create).toBeCalledWith(validRequest.file, validRequest.currentUser);
      expect(res.json).toBeCalledWith({
        createdAt: fileStorage.createdAt,
        createdBy: fileStorage.createdBy,
        id: fileStorage.id,
        originalName: fileStorage.originalName,
        size: fileStorage.size,
      });
      expect(res.status).toBeCalledWith(201);
      expect(next).not.toBeCalled();
    });
  });
});

describe('delete', () => {
  const validRequest = {
    params: {
      fileId: fileStorage.id,
    },
  };

  describe('error response when', () => {
    it('has an unsuccessful service call', async () => {
      service.delete.mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.delete(req, res, next);

      expect(service.delete).toBeCalledWith(validRequest.params.fileId);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });
  });

  // TODO: the API is wrong, this should be a 204, not a 202.
  describe('202 response when', () => {
    it('has a successful service call', async () => {
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.delete(req, res, next);

      expect(service.delete).toBeCalledWith(validRequest.params.fileId);
      expect(res.json).not.toBeCalled();
      expect(res.send).not.toBeCalled();
      expect(res.sendStatus).toBeCalledWith(202);
      expect(next).not.toBeCalled();
    });
  });
});

describe('read', () => {
  const validRequest = {
    currentFileRecord: fileStorage,
  };

  describe('error response when', () => {
    it('has an unsuccessful storage service call', async () => {
      storageService.read.mockRejectedValueOnce(error);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.read(req, res, next);

      expect(storageService.read).toBeCalledWith(fileStorage);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(error);
    });

    it('has an unsuccessful stream read', async () => {
      const streamError = new Error('stream error');
      const mockReadable = require('stream').Readable();
      mockReadable._read = jest.fn();
      mockReadable.pipe = () => {
        mockReadable.emit('error', streamError);
      };
      storageService.read.mockReturnValueOnce(mockReadable);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.read(req, res, next);

      expect(storageService.read).toBeCalledWith(fileStorage);
      expect(res.json).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(next).toBeCalledWith(streamError);
    });
  });

  describe('200 response when', () => {
    it('has a successful storage service call', async () => {
      const mockReadable = require('stream').Readable();
      mockReadable._read = jest.fn();
      storageService.read.mockReturnValueOnce(mockReadable);
      const req = getMockReq(validRequest);
      const { res, next } = getMockRes();

      await controller.read(req, res, next);

      expect(storageService.read).toBeCalledWith(fileStorage);
      expect(next).not.toBeCalled();
    });
  });
});
