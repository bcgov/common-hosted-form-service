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
      it('file has extension other than allowed list', async () => {
        const fileData = {
          originalname: 'document.xyz',
          mimetype: 'application/unknown',
          size: 1024,
          path: '/app/uploads/document.xyz',
        };

        const result = await service.create(fileData, currentUser);

        expect(result).toEqual(mockFileStorage);
        expect(FileStorage.startTransaction).toHaveBeenCalled();
        expect(storageService.upload).toHaveBeenCalledWith(
          expect.objectContaining({
            originalName: 'document.xyz',
            mimeType: 'application/unknown',
            size: 1024,
            createdBy: 'TESTER',
          })
        );
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(mockTransaction.rollback).not.toHaveBeenCalled();
      });
    });
  });

  describe('read', () => {
    it('returns the file object when found', async () => {
      // Arrange
      const fileId = 'test-file-id';
      const mockThrowIfNotFound = jest.fn().mockResolvedValue(mockFileStorage);
      FileStorage.query = jest.fn().mockReturnValue({
        findById: jest.fn().mockReturnValue({
          throwIfNotFound: mockThrowIfNotFound,
        }),
      });

      // Act
      const result = await service.read(fileId);

      // Assert
      expect(FileStorage.query).toHaveBeenCalled();
      expect(result).toEqual(mockFileStorage);
      expect(mockThrowIfNotFound).toHaveBeenCalled();
    });

    it('throws an error if the file is not found', async () => {
      // Arrange
      const fileId = 'missing-file-id';
      const notFoundError = new Error('Not found');
      const mockThrowIfNotFound = jest.fn().mockRejectedValue(notFoundError);
      FileStorage.query = jest.fn().mockReturnValue({
        findById: jest.fn().mockReturnValue({
          throwIfNotFound: mockThrowIfNotFound,
        }),
      });

      // Act & Assert
      await expect(service.read(fileId)).rejects.toThrow('Not found');
      expect(FileStorage.query).toHaveBeenCalled();
      expect(mockThrowIfNotFound).toHaveBeenCalled();
    });
  });

  describe('dangerous characters coverage', () => {
    it('throws if filename contains ".."', async () => {
      const file = { originalname: 'bad..file.txt' };
      await expect(service.create(file, {})).rejects.toThrow('Filename contains dangerous characters');
    });

    it('throws if filename contains "/"', async () => {
      const file = { originalname: 'bad/file.txt' };
      await expect(service.create(file, {})).rejects.toThrow('Filename contains dangerous characters');
    });

    it('throws if filename contains "\\"', async () => {
      const file = { originalname: 'bad\\file.txt' };
      await expect(service.create(file, {})).rejects.toThrow('Filename contains dangerous characters');
    });
  });

  describe('delete coverage', () => {
    it('delete: should return falsy result if storageService.delete returns falsy', async () => {
      // Arrange
      const fileId = 'file-id';
      jest.spyOn(service, 'read').mockResolvedValue({ id: fileId });
      FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
      FileStorage.query = jest.fn().mockReturnValue({
        deleteById: jest.fn().mockReturnValue({ throwIfNotFound: jest.fn().mockResolvedValue() }),
      });
      storageService.delete = jest.fn().mockResolvedValue(null);

      // Act
      const result = await service.delete(fileId);

      // Assert
      expect(result).toBeNull();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
    it('deleteFiles: should delete all files and call storageService.delete for each', async () => {
      const ids = ['id1', 'id2'];
      jest.spyOn(service, 'read').mockResolvedValue({ id: 'id1' });
      FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
      FileStorage.query = jest.fn().mockReturnValue({
        deleteById: jest.fn().mockReturnValue({ throwIfNotFound: jest.fn().mockResolvedValue() }),
      });
      storageService.delete = jest.fn().mockResolvedValue(true);

      await expect(service.deleteFiles(ids)).resolves.toBeUndefined();
      expect(storageService.delete).toHaveBeenCalledTimes(ids.length);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('deleteFiles: should throw and rollback if storageService.delete returns falsy', async () => {
      const ids = ['id1'];
      jest.spyOn(service, 'read').mockResolvedValue({ id: 'id1' });
      FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
      FileStorage.query = jest.fn().mockReturnValue({
        deleteById: jest.fn().mockReturnValue({ throwIfNotFound: jest.fn().mockResolvedValue() }),
      });
      storageService.delete = jest.fn().mockResolvedValue(false);

      await expect(service.deleteFiles(ids)).rejects.toThrow('Failed to delete file with id id1');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('move coverage', () => {
    it('moveSubmissionFile: should update file path and storage', async () => {
      storageService.move = jest.fn().mockResolvedValue('/new/path');
      FileStorage.query = jest.fn().mockReturnValue({
        patchAndFetchById: jest.fn().mockResolvedValue({}),
      });

      await expect(service.moveSubmissionFile('subId', { id: 'fileId' }, 'user')).resolves.toBeUndefined();
      expect(storageService.move).toHaveBeenCalled();
      expect(FileStorage.query().patchAndFetchById).toHaveBeenCalled();
    });

    it('moveSubmissionFile: should throw if storageService.move returns falsy', async () => {
      storageService.move = jest.fn().mockResolvedValue(null);

      await expect(service.moveSubmissionFile('subId', { id: 'fileId' }, 'user')).rejects.toThrow('Error moving files for submission');
    });

    it('moveSubmissionFiles: should move all files and update their paths', async () => {
      FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
      FileStorage.query = jest
        .fn()
        .mockReturnValueOnce({ where: jest.fn().mockResolvedValue([{ id: 'fileId' }]) })
        .mockReturnValue({ patchAndFetchById: jest.fn().mockResolvedValue({}) });
      storageService.move = jest.fn().mockResolvedValue('/new/path');

      await expect(service.moveSubmissionFiles('subId', { usernameIdp: 'user' })).resolves.toBeUndefined();
      expect(storageService.move).toHaveBeenCalled();
      expect(FileStorage.query().patchAndFetchById).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('moveSubmissionFiles: should throw and rollback if storageService.move returns falsy', async () => {
      FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
      FileStorage.query = jest.fn().mockReturnValueOnce({ where: jest.fn().mockResolvedValue([{ id: 'fileId' }]) });
      storageService.move = jest.fn().mockResolvedValue(null);

      await expect(service.moveSubmissionFiles('subId', { usernameIdp: 'user' })).rejects.toThrow('Error moving files for submission');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('clone coverage', () => {
    it('clone: should create a new file record with new ID', async () => {
      FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
      FileStorage.query = jest
        .fn()
        .mockReturnValueOnce({ findById: jest.fn().mockReturnValue({ throwIfNotFound: jest.fn().mockResolvedValue({ id: 'fileId' }) }) })
        .mockReturnValue({ insert: jest.fn().mockResolvedValue({}) });
      storageService.clone = jest.fn().mockResolvedValue({ id: 'newId', path: '/new/path', storage: 'uploads' });
      jest.spyOn(service, 'read').mockResolvedValue({ id: 'newId' });

      const result = await service.clone('fileId', { usernameIdp: 'user' });
      expect(result).toEqual({ id: 'newId' });
      expect(storageService.clone).toHaveBeenCalled();
      expect(FileStorage.query().insert).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('clone: should throw and rollback if any step fails', async () => {
      FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
      FileStorage.query = jest.fn().mockReturnValueOnce({ findById: jest.fn().mockReturnValue({ throwIfNotFound: jest.fn().mockRejectedValue(new Error('fail')) }) });
      storageService.clone = jest.fn();
      jest.spyOn(service, 'read').mockResolvedValue({});

      await expect(service.clone('fileId', { usernameIdp: 'user' })).rejects.toThrow('fail');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('validateFileSecurity', () => {
    it('does not throw for a safe filename', async () => {
      FileStorage.query = jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({}),
      });
      const file = {
        originalname: 'goodfile.txt',
        mimetype: 'text/plain',
        size: 100,
        path: '/app/uploads/goodfile.txt',
      };
      // Should not throw
      const result = await service.create(file, { usernameIdp: 'TESTER' });
      expect(result).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('returns null if storageService.delete returns null', async () => {
      const fileId = 'file-id';
      jest.spyOn(service, 'read').mockResolvedValue({ id: fileId });
      FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
      FileStorage.query = jest.fn().mockReturnValue({
        deleteById: jest.fn().mockReturnValue({ throwIfNotFound: jest.fn().mockResolvedValue() }),
      });
      storageService.delete = jest.fn().mockResolvedValue(null);

      const result = await service.delete(fileId);

      expect(result).toBeNull();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('returns value if storageService.delete returns truthy', async () => {
      const fileId = 'file-id';
      jest.spyOn(service, 'read').mockResolvedValue({ id: fileId });
      FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
      FileStorage.query = jest.fn().mockReturnValue({
        deleteById: jest.fn().mockReturnValue({ throwIfNotFound: jest.fn().mockResolvedValue() }),
      });
      storageService.delete = jest.fn().mockResolvedValue('deleted');

      const result = await service.delete(fileId);

      expect(result).toBe('deleted');
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe('deleteFiles', () => {
    it('throws and rolls back if storageService.delete returns falsy', async () => {
      const ids = ['id1'];
      jest.spyOn(service, 'read').mockResolvedValue({ id: 'id1' });
      FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
      FileStorage.query = jest.fn().mockReturnValue({
        deleteById: jest.fn().mockReturnValue({ throwIfNotFound: jest.fn().mockResolvedValue() }),
      });
      storageService.delete = jest.fn().mockResolvedValue(false);

      await expect(service.deleteFiles(ids)).rejects.toThrow('Failed to delete file with id id1');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('completes if storageService.delete returns truthy for all', async () => {
      const ids = ['id1', 'id2'];
      jest.spyOn(service, 'read').mockResolvedValue({ id: 'id1' });
      FileStorage.startTransaction = jest.fn().mockResolvedValue(mockTransaction);
      FileStorage.query = jest.fn().mockReturnValue({
        deleteById: jest.fn().mockReturnValue({ throwIfNotFound: jest.fn().mockResolvedValue() }),
      });
      storageService.delete = jest.fn().mockResolvedValue(true);

      await expect(service.deleteFiles(ids)).resolves.toBeUndefined();
      expect(storageService.delete).toHaveBeenCalledTimes(ids.length);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });
});
