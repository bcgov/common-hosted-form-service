const uuid = require('uuid');

const service = require('../../../../src/forms/file/service');
const { FileStorage } = require('../../../../src/forms/common/models');
const storageService = require('../../../../src/forms/file/storage/storageService');

// Mock external dependencies
jest.mock('../../../../src/forms/common/models');
jest.mock('../../../../src/forms/file/storage/storageService');

const currentUser = {
  usernameIdp: 'TESTER',
};

const mockFileStorage = {
  createdAt: '2024-06-25T13:53:01-0700',
  createdBy: currentUser.usernameIdp,
  id: uuid.v4(),
  mimeType: 'application/pdf',
  originalName: 'testfile.pdf',
  path: '/app/uploads/testfile.pdf',
  size: 1337,
  storage: 'uploads',
};

// Mock out all service calls
const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
FileStorage.query = jest.fn().mockReturnValue({
  insert: jest.fn().mockResolvedValue(mockFileStorage),
  findById: jest.fn().mockReturnValue({
    throwIfNotFound: jest.fn().mockResolvedValue(mockFileStorage),
  }),
});

storageService.upload = jest.fn().mockResolvedValue({
  path: '/app/storage/uploads/file123',
  storage: 'uploads',
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('create', () => {
  describe('security validation', () => {
    describe('error response when', () => {
      it('file has dangerous .exe extension', async () => {
        const fileData = {
          originalname: 'malware.exe',
          mimetype: 'application/octet-stream',
          size: 1024,
          path: '/app/uploads/malware.exe',
        };

        await expect(service.create(fileData, currentUser)).rejects.toThrow('File type .exe is not allowed for security reasons');

        expect(FileStorage.startTransaction).not.toHaveBeenCalled();
        expect(storageService.upload).not.toHaveBeenCalled();
      });

      it('file has path traversal characters', async () => {
        const fileData = {
          originalname: '../../../etc/passwd.txt',
          mimetype: 'text/plain',
          size: 1024,
          path: '/app/uploads/passwd.txt',
        };

        await expect(service.create(fileData, currentUser)).rejects.toThrow('Filename contains dangerous characters');

        expect(FileStorage.startTransaction).not.toHaveBeenCalled();
        expect(storageService.upload).not.toHaveBeenCalled();
      });

      it('file has extension other than allowed list', async () => {
        const fileData = {
          originalname: 'document.xyz',
          mimetype: 'application/unknown',
          size: 1024,
          path: '/app/uploads/document.xyz',
        };

        await expect(service.create(fileData, currentUser)).rejects.toThrow('File type .xyz is not in allowed types');

        expect(FileStorage.startTransaction).not.toHaveBeenCalled();
        expect(storageService.upload).not.toHaveBeenCalled();
      });
    });

    describe('success response when', () => {
      it('file has valid PDF extension and passes all security checks', async () => {
        const validFileData = {
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          path: '/app/uploads/document.pdf',
        };

        const result = await service.create(validFileData, currentUser);

        expect(result).toEqual(mockFileStorage);
        expect(FileStorage.startTransaction).toHaveBeenCalled();
        expect(storageService.upload).toHaveBeenCalledWith(
          expect.objectContaining({
            originalName: 'document.pdf',
            mimeType: 'application/pdf',
            size: 1024,
            createdBy: 'TESTER',
          })
        );
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(mockTransaction.rollback).not.toHaveBeenCalled();
      });
    });
  });
});
