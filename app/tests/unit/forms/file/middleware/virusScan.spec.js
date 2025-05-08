const Problem = require('api-problem');
const clamAvScanner = require('../../../../../src/components/clamAvScanner');
const virusScan = require('../../../../../src/forms/file/middleware/virusScan');
const fs = require('fs').promises;

jest.mock('../../../../../src/components/clamAvScanner');

describe('virusScan middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      file: {
        path: '/tmp/test-file.txt',
        originalname: 'test-file.txt',
      },
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
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

    it('should default to os.tmpdir() if no base directory is provided', () => {
      const filePath = 'test-file.txt';
      const os = require('os');
      const baseDirectory = os.tmpdir();

      const result = virusScan.validateFilePath(filePath);

      expect(result).toBe(`${baseDirectory}/test-file.txt`);
    });
  });

  describe('removeInfected', () => {
    it('should delete the infected file successfully', async () => {
      jest.spyOn(fs, 'unlink').mockResolvedValue();

      await virusScan.removeInfected(req.file.path);

      expect(fs.unlink).toHaveBeenCalledWith(req.file.path);
    });

    it('should handle errors when deleting the infected file', async () => {
      jest.spyOn(fs, 'unlink').mockRejectedValue(new Error('File deletion failed'));

      await virusScan.removeInfected(req.file.path);

      expect(fs.unlink).toHaveBeenCalledWith(req.file.path);
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
    });

    it('should delete the infected file and return a Problem if the file is infected', async () => {
      clamAvScanner.scanFile.mockResolvedValue({
        isInfected: true,
        viruses: ['TestVirus'],
      });
      jest.spyOn(fs, 'unlink').mockResolvedValue();

      await virusScan.scanFile(req, res, next);

      expect(clamAvScanner.scanFile).toHaveBeenCalledWith(req.file.path);
      expect(fs.unlink).toHaveBeenCalledWith(req.file.path);
      expect(next).toHaveBeenCalledWith(
        new Problem(409, {
          detail: `Uploaded file (${req.file.originalname}) contains malware: TestVirus`,
          viruses: ['TestVirus'],
        })
      );
    });

    it('should handle errors when deleting the infected file', async () => {
      clamAvScanner.scanFile.mockResolvedValue({
        isInfected: true,
        viruses: ['TestVirus'],
      });
      jest.spyOn(fs, 'unlink').mockRejectedValue(new Error('File deletion failed'));

      await virusScan.scanFile(req, res, next);

      expect(clamAvScanner.scanFile).toHaveBeenCalledWith(req.file.path);
      expect(fs.unlink).toHaveBeenCalledWith(req.file.path);
      expect(next).toHaveBeenCalledWith(
        new Problem(409, {
          detail: `Uploaded file (${req.file.originalname}) contains malware: TestVirus`,
          viruses: ['TestVirus'],
        })
      );
    });

    it('should handle errors during scanning and call next() with the error', async () => {
      clamAvScanner.scanFile.mockRejectedValue(new Error('Scanning failed'));

      await virusScan.scanFile(req, res, next);

      expect(clamAvScanner.scanFile).toHaveBeenCalledWith(req.file.path);
      expect(next).toHaveBeenCalledWith(new Error('Scanning failed'));
    });
  });
});
