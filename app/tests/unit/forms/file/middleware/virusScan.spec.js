const Problem = require('api-problem');
const clamAvScanner = require('../../../../../src/components/clamAvScanner');

const mockResolveUploadPath = jest.fn();
const mockRemoveUploadedFile = jest.fn().mockResolvedValue(true);

jest.mock('../../../../../src/components/clamAvScanner');
jest.mock('../../../../../src/forms/file/uploadCleanup', () => ({
  resolveUploadPath: (...args) => mockResolveUploadPath(...args),
  removeUploadedFile: (...args) => mockRemoveUploadedFile(...args),
}));
jest.mock('../../../../../src/forms/file/middleware/upload', () => ({
  fileUpload: {
    getFileUploadsDir: jest.fn(() => '/tmp/uploads'),
  },
}));

const virusScan = require('../../../../../src/forms/file/middleware/virusScan');

describe('virusScan middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      file: {
        path: '/tmp/uploads/test-file.txt',
        originalname: 'test-file.txt',
      },
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
    mockRemoveUploadedFile.mockResolvedValue(true);
    mockResolveUploadPath.mockImplementation((filePath, baseDirectory = '/tmp/uploads') => {
      const path = require('path');
      const resolvedBase = path.resolve(baseDirectory);
      const resolvedFilePath = path.resolve(resolvedBase, filePath);
      const relative = path.relative(resolvedBase, resolvedFilePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Invalid file path: ${filePath} is outside the allowed directory.`);
      }
      return resolvedFilePath;
    });
  });

  describe('validateFilePath', () => {
    it('should return the resolved file path if it is within the base directory', () => {
      const filePath = 'test-file.txt';
      const baseDirectory = '/tmp/uploads';

      const result = virusScan.validateFilePath(filePath, baseDirectory);

      expect(result).toBe('/tmp/uploads/test-file.txt');
    });

    it('should throw an error if the file path is outside the base directory', () => {
      const filePath = '../outside-dir/test-file.txt';
      const baseDirectory = '/tmp/uploads';

      expect(() => {
        virusScan.validateFilePath(filePath, baseDirectory);
      }).toThrowError(new Error('Invalid file path: ../outside-dir/test-file.txt is outside the allowed directory.'));
    });

    it('should handle absolute file paths within the base directory', () => {
      const filePath = '/tmp/uploads/test-file.txt';
      const baseDirectory = '/tmp/uploads';

      const result = virusScan.validateFilePath(filePath, baseDirectory);

      expect(result).toBe('/tmp/uploads/test-file.txt');
    });

    it('should throw an error for absolute file paths outside the base directory', () => {
      const filePath = '/etc/passwd';
      const baseDirectory = '/tmp/uploads';

      expect(() => {
        virusScan.validateFilePath(filePath, baseDirectory);
      }).toThrowError(new Error('Invalid file path: /etc/passwd is outside the allowed directory.'));
    });

    it('should use the configured upload directory when no base directory is provided', () => {
      const filePath = 'test-file.txt';

      virusScan.validateFilePath(filePath);

      expect(mockResolveUploadPath).toHaveBeenCalledWith(filePath, '/tmp/uploads');
    });
  });

  describe('removeInfected', () => {
    it('should delete the infected file successfully', async () => {
      await virusScan.removeInfected(req.file.path);

      expect(mockRemoveUploadedFile).toHaveBeenCalledWith(req.file.path, 'infected');
    });
  });

  describe('createVirusProblem', () => {
    it('should create a Problem instance for infected files', () => {
      const fileName = 'test-file.txt';
      const viruses = ['TestVirus'];

      const problem = virusScan.createVirusProblem(fileName, viruses);

      expect(problem).toBeInstanceOf(Problem);
      expect(problem.status).toBe(409);
      expect(problem.detail).toBe(`Uploaded file (${fileName}) contains malware: TestVirus`);
      expect(problem.viruses).toEqual(viruses);
    });
  });

  describe('scanFile', () => {
    it('should call next() if no file is present in the request', async () => {
      req.file = null;

      await virusScan.scanFile(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(clamAvScanner.scanFile).not.toHaveBeenCalled();
    });

    it('should call next() if the file is not infected', async () => {
      clamAvScanner.scanFile.mockResolvedValue({
        isInfected: false,
        viruses: [],
      });

      await virusScan.scanFile(req, res, next);

      expect(clamAvScanner.scanFile).toHaveBeenCalledWith(req.file.path);
      expect(next).toHaveBeenCalled();
      expect(mockRemoveUploadedFile).not.toHaveBeenCalled();
    });

    it('should delete the infected file and return a Problem if the file is infected', async () => {
      clamAvScanner.scanFile.mockResolvedValue({
        isInfected: true,
        viruses: ['TestVirus'],
      });

      await virusScan.scanFile(req, res, next);

      expect(clamAvScanner.scanFile).toHaveBeenCalledWith(req.file.path);
      expect(mockRemoveUploadedFile).toHaveBeenCalledWith(req.file.path, 'infected');
      expect(next).toHaveBeenCalledWith(
        new Problem(409, {
          detail: `Uploaded file (${req.file.originalname}) contains malware: TestVirus`,
          viruses: ['TestVirus'],
        })
      );
    });

    it('should still return a Problem when infected file deletion fails', async () => {
      clamAvScanner.scanFile.mockResolvedValue({
        isInfected: true,
        viruses: ['TestVirus'],
      });
      mockRemoveUploadedFile.mockResolvedValue(false);

      await virusScan.scanFile(req, res, next);

      expect(mockRemoveUploadedFile).toHaveBeenCalledWith(req.file.path, 'infected');
      expect(next).toHaveBeenCalledWith(
        new Problem(409, {
          detail: `Uploaded file (${req.file.originalname}) contains malware: TestVirus`,
          viruses: ['TestVirus'],
        })
      );
    });

    it('should delete temp file and call next() with the error when scanning fails', async () => {
      clamAvScanner.scanFile.mockRejectedValue(new Error('Scanning failed'));

      await virusScan.scanFile(req, res, next);

      expect(clamAvScanner.scanFile).toHaveBeenCalledWith(req.file.path);
      expect(mockRemoveUploadedFile).toHaveBeenCalledWith(req.file.path, 'scan-error');
      expect(next).toHaveBeenCalledWith(new Error('Scanning failed'));
    });
  });
});
