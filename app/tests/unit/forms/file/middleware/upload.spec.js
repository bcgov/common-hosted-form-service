const { getMockReq, getMockRes } = require('@jest-mock/express');
const fs = require('fs-extra');
const multer = require('multer');
const os = require('os');

jest.mock('fs-extra');
jest.mock('multer');
jest.mock('os');

const multerImpl = {
  array: jest.fn(),
  single: jest.fn(),
};
multer.mockImplementation(() => multerImpl);

// This module has global variables so it needs to be re-loaded for each test.
var fileUpload;

beforeEach(() => {
  // Clear out all the environment variables set during testing.
  delete process.env.FILE_UPLOADS_DIR;
  delete process.env.FILE_UPLOADS_MAX_FILE_COUNT;
  delete process.env.FILE_UPLOADS_MAX_FILE_SIZE;

  jest.isolateModules(() => {
    fileUpload = require('../../../../../src/forms/file/middleware/upload').fileUpload;
  });
});

// This is very tightly tied to the implementation - is there a better way?
describe('fileUpload.init', () => {
  describe('fileUploadsDir', () => {
    const mockConfig = '/config_uploads_dir';
    const mockEnvironment = '/mock_file_uploads_dir';
    const mockOs = '/mock_os_tmpdir';

    test('uses os.tmpdir when there is no config or environment variable', async () => {
      fs.realpathSync.mockReturnValueOnce(mockOs);
      os.tmpdir.mockReturnValueOnce(mockOs);
      const callback = jest.fn();

      fileUpload.init();

      expect(multer.diskStorage).toBeCalledTimes(1);
      const internalFunction = multer.diskStorage.mock.calls[0][0].destination;
      internalFunction(undefined, undefined, callback);
      expect(callback).toBeCalledWith(null, mockOs);
    });

    test('uses environment variable when there is no config', async () => {
      fs.realpathSync.mockReturnValueOnce(mockOs);
      os.tmpdir.mockReturnValueOnce(mockOs);
      process.env.FILE_UPLOADS_DIR = mockEnvironment;
      const callback = jest.fn();

      fileUpload.init();

      expect(multer.diskStorage).toBeCalledTimes(1);
      const internalFunction = multer.diskStorage.mock.calls[0][0].destination;
      internalFunction(undefined, undefined, callback);
      expect(callback).toBeCalledWith(null, mockEnvironment);
    });

    test('uses the config', async () => {
      fs.realpathSync.mockReturnValueOnce(mockOs);
      os.tmpdir.mockReturnValueOnce(mockOs);
      process.env.FILE_UPLOADS_DIR = mockEnvironment;
      const callback = jest.fn();

      fileUpload.init({ dir: mockConfig });

      expect(multer.diskStorage).toBeCalledTimes(1);
      const internalFunction = multer.diskStorage.mock.calls[0][0].destination;
      internalFunction(undefined, undefined, callback);
      expect(callback).toBeCalledWith(null, mockConfig);
    });

    test('uses the config but fails on the ensure', async () => {
      fs.realpathSync.mockReturnValueOnce(mockOs);
      os.tmpdir.mockReturnValueOnce(mockOs);
      process.env.FILE_UPLOADS_DIR = mockEnvironment;
      fs.ensureDirSync.mockImplementationOnce(() => {
        throw new Error();
      });

      expect(() =>
        fileUpload.init({
          dir: mockConfig,
        })
      ).toThrow(
        expect.objectContaining({
          message: `Could not create file uploads directory '${mockConfig}'.`,
        })
      );

      expect(multer.diskStorage).toBeCalledTimes(0);
    });
  });

  describe('maxFileSize', () => {
    const mockConfig = '15MB';
    const mockConfigBytes = 15728640;
    const mockEnvironment = '20MB';
    const mockEnvironmentBytes = 20971520;
    const defaultValueBytes = 26214400;

    test('uses default when there is no config or environment variable', async () => {
      fileUpload.init();

      expect(multer).toBeCalledTimes(1);
      expect(multer).toBeCalledWith(
        expect.objectContaining({
          limits: expect.objectContaining({
            fileSize: defaultValueBytes,
          }),
        })
      );
    });

    test('uses environment variable when there is no config', async () => {
      process.env.FILE_UPLOADS_MAX_FILE_SIZE = mockEnvironment;

      fileUpload.init();

      expect(multer).toBeCalledTimes(1);
      expect(multer).toBeCalledWith(
        expect.objectContaining({
          limits: expect.objectContaining({
            fileSize: mockEnvironmentBytes,
          }),
        })
      );
    });

    test('uses the config', async () => {
      process.env.FILE_UPLOADS_MAX_FILE_SIZE = mockEnvironment;

      fileUpload.init({ maxFileSize: mockConfig });

      expect(multer).toBeCalledTimes(1);
      expect(multer).toBeCalledWith(
        expect.objectContaining({
          limits: expect.objectContaining({
            fileSize: mockConfigBytes,
          }),
        })
      );
    });

    test('uses the config but fails on conversion', async () => {
      expect(() =>
        fileUpload.init({
          maxFileSize: 'qwerty',
        })
      ).toThrow(
        expect.objectContaining({
          message: 'Could not determine max file size (bytes) for file uploads.',
        })
      );

      expect(multer).toBeCalledTimes(0);
    });
  });

  describe('maxFileCount', () => {
    const mockConfig = 3;
    const mockEnvironment = 2;
    const defaultValue = 1;

    test('uses default when there is no config or environment variable', async () => {
      fileUpload.init();

      expect(multer).toBeCalledTimes(1);
      expect(multerImpl.array).toBeCalledTimes(0);
      expect(multerImpl.single).toBeCalledTimes(1);
      expect(multer).toBeCalledWith(
        expect.objectContaining({
          limits: expect.objectContaining({
            files: defaultValue,
          }),
        })
      );
    });

    test('uses environment variable when there is no config', async () => {
      process.env.FILE_UPLOADS_MAX_FILE_COUNT = mockEnvironment;

      fileUpload.init();

      expect(multer).toBeCalledTimes(1);
      expect(multerImpl.array).toBeCalledTimes(1);
      expect(multerImpl.single).toBeCalledTimes(0);
      expect(multer).toBeCalledWith(
        expect.objectContaining({
          limits: expect.objectContaining({
            files: mockEnvironment,
          }),
        })
      );
    });

    test('uses the config', async () => {
      process.env.FILE_UPLOADS_MAX_FILE_COUNT = mockEnvironment;

      fileUpload.init({ maxFileCount: mockConfig });

      expect(multer).toBeCalledTimes(1);
      expect(multerImpl.array).toBeCalledTimes(1);
      expect(multerImpl.single).toBeCalledTimes(0);
      expect(multer).toBeCalledWith(
        expect.objectContaining({
          limits: expect.objectContaining({
            files: mockConfig,
          }),
        })
      );
    });

    // TODO: this works, even though parseInt does not throw exceptions.
    test('uses the config but fails on conversion', async () => {
      process.env.FILE_UPLOADS_MAX_FILE_COUNT = mockEnvironment;

      fileUpload.init({ maxFileCount: 'qwerty' });

      expect(multer).toBeCalledTimes(1);
      expect(multerImpl.array).toBeCalledTimes(0);
      expect(multerImpl.single).toBeCalledTimes(1);
      expect(multer).toBeCalledWith(
        expect.objectContaining({
          limits: expect.objectContaining({
            files: 1,
          }),
        })
      );
    });
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
      multerImpl.single.mockImplementationOnce(() => (_req, _res, callback) => {
        const error = new multer.MulterError();
        error.code = code;
        error.message = 'some message';
        callback(error);
      });
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
      multerImpl.single.mockImplementationOnce(() => (_req, _res, callback) => {
        callback(new Error('error message'));
      });
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
      multerImpl.single.mockImplementationOnce(() => (_req, _res, callback) => {
        callback();
      });
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
