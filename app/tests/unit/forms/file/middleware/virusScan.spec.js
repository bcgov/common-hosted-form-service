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
    const { scanSlots } = virusScan;
    let refund;
    const releaseAll = () => {
      while (scanSlots.waiting > 0 || scanSlots.active > 0) scanSlots.release();
    };

    beforeEach(() => {
      res = { set: jest.fn() };
      refund = jest.fn();
      req.uploadRateLimitRefund = refund;
      expect(scanSlots.active).toBe(0);
      expect(scanSlots.waiting).toBe(0);
    });

    afterEach(() => {
      releaseAll();
      jest.useRealTimers();
    });

    it('should call next() if no file is present in the request', async () => {
      req.file = null;

      await virusScan.scanFile(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(clamAvScanner.scanFile).not.toHaveBeenCalled();
    });

    it('should call next() if the file is not infected, and release the slot', async () => {
      clamAvScanner.scanFile.mockResolvedValue({
        isInfected: false,
        viruses: [],
      });

      await virusScan.scanFile(req, res, next);

      expect(clamAvScanner.scanFile).toHaveBeenCalledWith(req.file.path);
      expect(next).toHaveBeenCalledWith();
      expect(mockRemoveUploadedFile).not.toHaveBeenCalled();
      expect(refund).not.toHaveBeenCalled();
      expect(scanSlots.active).toBe(0);
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
      expect(refund).not.toHaveBeenCalled();
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

    it('should delete the temp file and return 503 when scanning fails, refunding the upload', async () => {
      clamAvScanner.scanFile.mockRejectedValue(new Error('Scanning failed'));

      await virusScan.scanFile(req, res, next);

      expect(clamAvScanner.scanFile).toHaveBeenCalledWith(req.file.path);
      expect(mockRemoveUploadedFile).toHaveBeenCalledWith(req.file.path, 'scan-error');
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 503, detail: 'Unable to scan the file at this time. Please try again later.' }));
      expect(refund).toHaveBeenCalledTimes(1);
      expect(scanSlots.active).toBe(0);
    });

    it.each([[{ isInfected: null, viruses: [] }], [{ viruses: [] }], [undefined]])('should return 503 for an inconclusive result (%p)', async (result) => {
      clamAvScanner.scanFile.mockResolvedValue(result);

      await virusScan.scanFile(req, res, next);

      expect(mockRemoveUploadedFile).toHaveBeenCalledWith(req.file.path, 'scan-error');
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 503 }));
      expect(refund).toHaveBeenCalledTimes(1);
      expect(scanSlots.active).toBe(0);
    });

    it('should return 503 when the scan passes its deadline, and release the slot', async () => {
      jest.useFakeTimers();
      clamAvScanner.scanFile.mockImplementation(() => new Promise(() => {}));

      const scanning = virusScan.scanFile(req, res, next);
      await jest.advanceTimersByTimeAsync(virusScan.scanTimeoutMs);
      await scanning;

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 503 }));
      expect(scanSlots.active).toBe(0);
    });

    it('should reject a blocked file name before taking a scan slot', async () => {
      req.file.originalname = 'run.exe';

      await virusScan.scanFile(req, res, next);

      expect(clamAvScanner.scanFile).not.toHaveBeenCalled();
      expect(mockRemoveUploadedFile).toHaveBeenCalledWith(req.file.path, 'invalid-name');
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 415 }));
      expect(refund).not.toHaveBeenCalled();
      expect(scanSlots.active).toBe(0);
    });

    it('should stop without scanning when the client is already gone', async () => {
      req.socket = { destroyed: true };

      await virusScan.scanFile(req, res, next);

      expect(clamAvScanner.scanFile).not.toHaveBeenCalled();
      expect(mockRemoveUploadedFile).toHaveBeenCalledWith(req.file.path, 'client-gone');
      expect(next).not.toHaveBeenCalled();
      expect(scanSlots.active).toBe(0);
    });

    it('should stop without storing when the client leaves during the scan', async () => {
      req.socket = { destroyed: false };
      clamAvScanner.scanFile.mockImplementation(async () => {
        req.socket.destroyed = true;
        return { isInfected: false, viruses: [] };
      });

      await virusScan.scanFile(req, res, next);

      expect(mockRemoveUploadedFile).toHaveBeenCalledWith(req.file.path, 'client-gone');
      expect(next).not.toHaveBeenCalled();
      expect(scanSlots.active).toBe(0);
    });

    describe('when every scan slot is busy', () => {
      beforeEach(async () => {
        jest.useFakeTimers();
        for (let i = 0; i < scanSlots.max; i += 1) {
          await scanSlots.acquire();
        }
      });

      it('returns 503 with Retry-After and removes the upload when no slot frees up in time', async () => {
        const scanning = virusScan.scanFile(req, res, next);
        await jest.advanceTimersByTimeAsync(scanSlots.waitMs);
        await scanning;

        expect(clamAvScanner.scanFile).not.toHaveBeenCalled();
        expect(mockRemoveUploadedFile).toHaveBeenCalledWith(req.file.path, 'scan-busy');
        expect(res.set).toHaveBeenCalledWith('Retry-After', String(Math.ceil(scanSlots.waitMs / 1000)));
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 503, detail: 'File scanning is busy. Please try again shortly.' }));
        expect(refund).toHaveBeenCalledTimes(1);
        expect(scanSlots.waiting).toBe(0);
      });

      it('returns 503 at once when the wait queue is full', async () => {
        for (let i = 0; i < scanSlots.maxWaiting; i += 1) scanSlots.acquire();

        await virusScan.scanFile(req, res, next);

        expect(clamAvScanner.scanFile).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 503 }));
        expect(scanSlots.waiting).toBe(scanSlots.maxWaiting);
      });

      it('scans once a slot frees up within the wait', async () => {
        clamAvScanner.scanFile.mockResolvedValue({ isInfected: false, viruses: [] });

        const scanning = virusScan.scanFile(req, res, next);
        await jest.advanceTimersByTimeAsync(Math.floor(scanSlots.waitMs / 2));
        scanSlots.release();
        await scanning;

        expect(clamAvScanner.scanFile).toHaveBeenCalledWith(req.file.path);
        expect(next).toHaveBeenCalledWith();
      });
    });
  });

  describe('createScanSlots', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('grants up to max slots at once', async () => {
      const slots = virusScan.createScanSlots(2, 1000, 2);

      await expect(slots.acquire()).resolves.toBe(true);
      await expect(slots.acquire()).resolves.toBe(true);
      expect(slots.active).toBe(2);
    });

    it('hands a released slot to the oldest waiter', async () => {
      const slots = virusScan.createScanSlots(1, 1000, 2);
      await slots.acquire();
      const order = [];
      const first = slots.acquire().then((ok) => order.push(['first', ok]));
      const second = slots.acquire().then((ok) => order.push(['second', ok]));

      slots.release();
      await first;

      expect(order).toEqual([['first', true]]);
      expect(slots.active).toBe(1);
      expect(slots.waiting).toBe(1);

      slots.release();
      await second;
      expect(order).toEqual([
        ['first', true],
        ['second', true],
      ]);
    });

    it('gives up after the wait and forgets the waiter', async () => {
      const slots = virusScan.createScanSlots(1, 1000, 2);
      await slots.acquire();
      const waiting = slots.acquire();

      await jest.advanceTimersByTimeAsync(1000);

      await expect(waiting).resolves.toBe(false);
      expect(slots.waiting).toBe(0);
      slots.release();
      expect(slots.active).toBe(0);
    });

    it('refuses at once when maxWaiting requests are already waiting', async () => {
      const slots = virusScan.createScanSlots(1, 1000, 1);
      await slots.acquire();
      slots.acquire();

      await expect(slots.acquire()).resolves.toBe(false);
      expect(slots.waiting).toBe(1);
    });

    it('never counts below zero', () => {
      const slots = virusScan.createScanSlots(1, 1000, 1);

      slots.release();

      expect(slots.active).toBe(0);
    });
  });
});
