const fs = require('fs');
const path = require('path');
const Problem = require('api-problem');
const NodeClam = require('clamscan');

const clamAvScanner = require('../../../src/components/clamAvScanner');

jest.mock('clamscan');

let tempFilePath;

beforeEach(() => {
  jest.clearAllMocks();

  // Create a temporary file before each test
  tempFilePath = path.join(__dirname, 'temp-test-file.txt');
  fs.writeFileSync(tempFilePath, 'Temporary file content');
});

afterEach(() => {
  // Remove the temporary file after each test
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
});

describe('ClamAVScanner', () => {
  describe('_initialize', () => {
    it('should initialize ClamAV scanner successfully', async () => {
      const mockInit = jest.fn().mockResolvedValue({});
      NodeClam.prototype.init = mockInit;

      await clamAvScanner._initialize();

      expect(mockInit).toHaveBeenCalled();
      expect(clamAvScanner.isInitialized).toBe(true);
    });

    it('should throw a Problem if the virus database is empty', async () => {
      const mockInit = jest.fn().mockRejectedValue(new Error('virus database is empty'));
      NodeClam.prototype.init = mockInit;

      await expect(clamAvScanner._initialize()).rejects.toThrow(Problem);
    });

    it('should throw a Problem if the ClamAV socket is not found', async () => {
      const mockInit = jest.fn().mockRejectedValue({ code: 'ENOENT' });
      NodeClam.prototype.init = mockInit;

      await expect(clamAvScanner._initialize()).rejects.toThrow(Problem);
    });

    it('should throw a Problem for other initialization errors', async () => {
      const mockError = new Error('Some other error');
      const mockInit = jest.fn().mockRejectedValue(mockError);
      NodeClam.prototype.init = mockInit;

      await expect(clamAvScanner._initialize()).rejects.toThrow(Problem);
    });
  });

  describe('checkConnection', () => {
    it('should initialize successfully within retries', async () => {
      const mockInit = jest.fn().mockResolvedValue({});
      NodeClam.prototype.init = mockInit;

      const result = await clamAvScanner.checkConnection(3, 100);

      expect(result).toBe(true);
      expect(mockInit).toHaveBeenCalled();
    });

    it('should fail after all retries', async () => {
      const mockInit = jest.fn().mockRejectedValue(new Error('Initialization failed'));
      NodeClam.prototype.init = mockInit;

      const result = await clamAvScanner.checkConnection(3, 100);

      expect(result).toBeUndefined();
      expect(mockInit).toHaveBeenCalledTimes(3);
    });

    it('should retry 3 times over 15 seconds with no params', async () => {
      const mockInit = jest.fn().mockRejectedValue(new Error('Initialization failed'));
      NodeClam.prototype.init = mockInit;

      const result = await clamAvScanner.checkConnection();

      expect(result).toBeUndefined();
      expect(mockInit).toHaveBeenCalledTimes(3);
    }, 16000); // Set timeout to 16 seconds
  });

  describe('scanFile', () => {
    it('should scan a file and return the result', async () => {
      clamAvScanner.isInitialized = true;
      const mockScanFile = jest.fn().mockResolvedValue({ isInfected: false, viruses: [] });
      clamAvScanner.clamscan = { scanFile: mockScanFile };

      const result = await clamAvScanner.scanFile(tempFilePath);

      expect(mockScanFile).toHaveBeenCalledWith(tempFilePath);
      expect(result).toEqual({ isInfected: false, viruses: [] });
    });

    it('should throw an error if the scanner is not initialized', async () => {
      clamAvScanner.isInitialized = false;

      await expect(clamAvScanner.scanFile(tempFilePath)).rejects.toThrow('ClamAV scanner not initialized');
    });

    it('should throw an error if the file is not found', async () => {
      clamAvScanner.isInitialized = true;
      const mockScanFile = jest.fn().mockRejectedValue({ code: 'ENOENT' });
      clamAvScanner.clamscan = { scanFile: mockScanFile };

      await expect(clamAvScanner.scanFile(tempFilePath)).rejects.toThrow('File not found or ClamAV socket connection failed');
    });

    it('should log and rethrow other errors during file scanning', async () => {
      clamAvScanner.isInitialized = true;
      const mockError = new Error('Some scan error');
      const mockScanFile = jest.fn().mockRejectedValue(mockError);
      clamAvScanner.clamscan = { scanFile: mockScanFile };

      await expect(clamAvScanner.scanFile(tempFilePath)).rejects.toThrow(mockError);
    });
  });
});
