const { getMockReq, getMockRes } = require('@jest-mock/express');
const fs = require('fs-extra');
const multer = require('multer');
const os = require('os');
const { fileSetup, createBadRequestProblem } = require('../../../../../src/forms/file/middleware/upload');
const Problem = require('api-problem');

jest.mock('fs-extra');
jest.mock('multer');
jest.mock('os');

const multerImpl = {
  array: jest.fn(),
  single: jest.fn(),
};
multer.mockImplementation(() => multerImpl);

// This module has global variables so it needs to be re-loaded for each test.
let fileUpload;

beforeEach(() => {
  delete process.env.FILE_UPLOADS_DIR;
  delete process.env.FILE_UPLOADS_MAX_FILE_COUNT;
  delete process.env.FILE_UPLOADS_MAX_FILE_SIZE;

  jest.clearAllMocks();
  jest.isolateModules(() => {
    fileUpload = require('../../../../../src/forms/file/middleware/upload').fileUpload;
  });
});

describe('createBadRequestProblem', () => {
  test('should create a Problem instance with status 400 and the provided detail', () => {
    const detail = 'This is a bad request';
    const problem = createBadRequestProblem(detail);

    expect(problem).toBeInstanceOf(Problem);
    expect(problem.status).toBe(400);
    expect(problem.detail).toBe(detail);
  });
});

describe('fileSetup', () => {
  const mockOsTmpDir = '/mock_os_tmpdir';
  const mockConfigDir = '/mock_config_dir';

  beforeEach(() => {
    os.tmpdir.mockReturnValue(mockOsTmpDir);
    fs.realpathSync.mockReturnValue(mockOsTmpDir);
  });

  test('should use os.tmpdir when no config or environment variable is provided', () => {
    const result = fileSetup();

    expect(result.fileUploadsDir).toBe(mockOsTmpDir);
    expect(result.maxFileSize).toBe(26214400); // Default 25MB in bytes
    expect(result.maxFileCount).toBe(1);
    expect(fs.ensureDirSync).toHaveBeenCalledWith(mockOsTmpDir);
  });

  test('should use environment variable for fileUploadsDir when no config is provided', () => {
    process.env.FILE_UPLOADS_DIR = mockConfigDir;

    const result = fileSetup();

    expect(result.fileUploadsDir).toBe(mockConfigDir);
    expect(fs.ensureDirSync).toHaveBeenCalledWith(mockConfigDir);
  });

  test('should use config for fileUploadsDir', () => {
    const result = fileSetup({ dir: mockConfigDir });

    expect(result.fileUploadsDir).toBe(mockConfigDir);
    expect(fs.ensureDirSync).toHaveBeenCalledWith(mockConfigDir);
  });

  test('should throw an error if ensureDirSync fails', () => {
    fs.ensureDirSync.mockImplementationOnce(() => {
      throw new Error('Directory creation failed');
    });

    expect(() => fileSetup({ dir: mockConfigDir })).toThrow(new Error(`Could not create file uploads directory '${mockConfigDir}'.`));
  });

  test('should use default maxFileSize when no config or environment variable is provided', () => {
    const result = fileSetup();

    expect(result.maxFileSize).toBe(26214400); // Default 25MB in bytes
  });

  test('should use environment variable for maxFileSize when no config is provided', () => {
    process.env.FILE_UPLOADS_MAX_FILE_SIZE = '15MB';

    const result = fileSetup();

    expect(result.maxFileSize).toBe(15728640); // 15MB in bytes
  });

  test('should use config for maxFileSize', () => {
    const result = fileSetup({ maxFileSize: '10MB' });

    expect(result.maxFileSize).toBe(10485760); // 10MB in bytes
  });

  test('should throw an error if maxFileSize cannot be parsed', () => {
    expect(() => fileSetup({ maxFileSize: 'invalid' })).toThrow(new Error('Could not determine max file size (bytes) for file uploads.'));
  });

  test('should use default maxFileCount when no config or environment variable is provided', () => {
    const result = fileSetup();

    expect(result.maxFileCount).toBe(1);
  });

  test('should use environment variable for maxFileCount when no config is provided', () => {
    process.env.FILE_UPLOADS_MAX_FILE_COUNT = '5';

    const result = fileSetup();

    expect(result.maxFileCount).toBe(5);
  });

  test('should use config for maxFileCount', () => {
    const result = fileSetup({ maxFileCount: 3 });

    expect(result.maxFileCount).toBe(3);
  });

  test('should default maxFileCount to 1 if config is invalid', () => {
    const result = fileSetup({ maxFileCount: 'invalid' });

    expect(result.maxFileCount).toBe(1);
  });
});

describe('fileUpload.getFileUploadsDir', () => {
  const mockOs = '/mock_os_tmpdir';

  test('uses os.tmpdir when there is no config or environment variable', async () => {
    fs.realpathSync.mockReturnValueOnce(mockOs);
    os.tmpdir.mockReturnValueOnce(mockOs);
    fileUpload.init();

    const result = fileUpload.getFileUploadsDir();

    expect(result).toBe(mockOs);
  });
});

describe('fileUpload.upload', () => {
  // These are for the sake of completeness but there isn't much value here.
  describe('400 response when', () => {
    const expectedStatus = { status: 400 };

    const cases = [
      ['LIMIT_FIELD_COUNT', 'Upload rejected: too many fields'],
      ['LIMIT_FIELD_KEY', 'Upload rejected: upload field name for the files is too long'],
      ['LIMIT_FIELD_VALUE', 'Upload rejected: upload field is too long'],
      ['LIMIT_FILE_COUNT', 'Upload is limited to 1 files'],
      ['LIMIT_FILE_SIZE', 'Upload file size is limited to 26214400 bytes'],
      ['LIMIT_PART_COUNT', 'Upload rejected: upload form has too many parts'],
      ['LIMIT_UNEXPECTED_FILE', 'Upload encountered an unexpected file'],
      ['SOMETHING_ELSE', 'Upload failed with the following error: some message'],
    ];

    test.each(cases)('error is %p', async (code, detail) => {
      const mockMulterError = (_req, _res, callback) => {
        const error = new multer.MulterError();
        error.code = code;
        error.message = 'some message';
        callback(error);
      };
      multerImpl.single.mockImplementationOnce(() => mockMulterError);
      fileUpload.init();
      const req = getMockReq();
      const { res, next } = getMockRes();

      await fileUpload.upload(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: detail,
        })
      );
    });

    test('non-multer error', async () => {
      const mockError = (_req, _res, callback) => {
        callback(new Error('error message'));
      };
      multerImpl.single.mockImplementationOnce(() => mockError);
      fileUpload.init();
      const req = getMockReq();
      const { res, next } = getMockRes();

      await fileUpload.upload(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'error message',
        })
      );
    });

    test('no error', async () => {
      const mockNoError = (_req, _res, callback) => {
        callback();
      };
      multerImpl.single.mockImplementationOnce(() => mockNoError);
      fileUpload.init();
      const req = getMockReq();
      const { res, next } = getMockRes();

      await fileUpload.upload(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('500 response when', () => {
    const expectedStatus = { status: 500 };

    test('init not called', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();

      await fileUpload.upload(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.objectContaining(expectedStatus));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'File Upload middleware has not been configured.',
        })
      );
    });
  });
});
