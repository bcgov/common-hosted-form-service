const { NotFoundError } = require('objection');

const { MockModel, MockTransaction } = require('../../../common/dbHelper');

jest.mock(
  '../../../../src/forms/common/models/tables/fileStorage',
  () => MockModel
);
jest.mock(
  '../../../../src/forms/common/models/tables/fileStorageReservation',
  () => MockModel
);
jest.mock(
  '../../../../src/forms/common/models/tables/submissionsExport',
  () => MockModel
);

// const service = require('../../../../src/forms/form/service');
// const exportService = require('../../../../src/forms/form/exportService');
const fileService = require('../../../../src/forms/file/service');
const storageService = require('../../../../src/forms/file/storage/storageService');
const emailService = require('../../../../src/forms/email/emailService');

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

const CURRENT_USER = {
  id: '0',
  usernameIdp: 'test',
};

describe('createData', () => {
  it('should succeed', async () => {
    const formId = '0';
    const reservationId = '0';
    const data = 'hello world';
    const metadata = {
      originalName: 'filename.txt',
      mimetype: 'text/plain',
      size: Buffer.byteLength(data, 'utf8')
    };
    const referer = 'http://localhost:8081/app/blahblah';

    const file = {
      id: '0',
      storage: '/temp',
      originalName: metadata.originalName,
      mimeType: metadata.mimetype,
      size: metadata.size,
      createdBy: CURRENT_USER.usernameIdp
    };

    const uploadedFile = {
      path: '/file/path',
      storage: file.storage,
    };

    let mockUploadData = jest.spyOn(storageService, 'uploadData');
    let mockSubmissionsExportReady = jest.spyOn(emailService, 'submissionsExportReady');
    let mockRead = jest.spyOn(fileService, 'read');

    mockUploadData.mockImplementation(() => uploadedFile);
    mockSubmissionsExportReady.mockImplementation(() => {});
    mockRead.mockImplementation(() => file);

    const fn = () =>
      fileService.createData(
        formId,
        reservationId,
        metadata,
        data,
        CURRENT_USER,
        referer
      );

    await expect(fn()).resolves.not.toThrow();

    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(mockUploadData).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(2);
    expect(MockModel.insert).toHaveBeenCalledTimes(1);
    expect(MockModel.patchAndFetchById).toHaveBeenCalledTimes(1);
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
    expect(mockSubmissionsExportReady).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenCalledTimes(1);

    mockUploadData.mockRestore();
    mockSubmissionsExportReady.mockRestore();
    mockRead.mockRestore();
  });


  it('should fall through if upload data fails', async () => {
    const formId = '0';
    const reservationId = '0';
    const data = 'hello world';
    const metadata = {
      originalName: 'filename.txt',
      mimetype: 'text/plain',
      size: Buffer.byteLength(data, 'utf8')
    };
    const referer = 'http://localhost:8081/app/blahblah';

    const file = {
      id: '0',
      storage: '/temp',
      originalName: metadata.originalName,
      mimeType: metadata.mimetype,
      size: metadata.size,
      createdBy: CURRENT_USER.usernameIdp
    };

    let mockUploadData = jest.spyOn(storageService, 'uploadData');
    let mockSubmissionsExportReady = jest.spyOn(emailService, 'submissionsExportReady');
    let mockRead = jest.spyOn(fileService, 'read');

    mockUploadData.mockImplementation(() => { throw new NotFoundError(); });
    mockSubmissionsExportReady.mockImplementation(() => {});
    mockRead.mockImplementation(() => file);

    const fn = () =>
      fileService.createData(
        formId,
        reservationId,
        metadata,
        data,
        CURRENT_USER,
        referer
      );

    await expect(fn()).rejects.toThrow();

    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(mockUploadData).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(0);
    expect(MockModel.insert).toHaveBeenCalledTimes(0);
    expect(MockModel.patchAndFetchById).toHaveBeenCalledTimes(0);
    expect(MockTransaction.commit).toHaveBeenCalledTimes(0);
    expect(mockSubmissionsExportReady).toHaveBeenCalledTimes(0);
    expect(mockRead).toHaveBeenCalledTimes(0);
    expect(MockTransaction.rollback).toHaveBeenCalledTimes(1);

    mockUploadData.mockRestore();
    mockSubmissionsExportReady.mockRestore();
    mockRead.mockRestore();
  });

  it('should fall through if an error occurs, cleans up uploaded file', async () => {
    const formId = '0';
    const reservationId = '0';
    const data = 'hello world';
    const metadata = {
      originalName: 'filename.txt',
      mimetype: 'text/plain',
      size: Buffer.byteLength(data, 'utf8')
    };
    const referer = 'http://localhost:8081/app/blahblah';

    const file = {
      id: '0',
      storage: '/temp',
      originalName: metadata.originalName,
      mimeType: metadata.mimetype,
      size: metadata.size,
      createdBy: CURRENT_USER.usernameIdp
    };

    const uploadedFile = {
      path: '/file/path',
      storage: file.storage,
    };

    let mockUploadData = jest.spyOn(storageService, 'uploadData');
    let mockDelete = jest.spyOn(storageService, 'delete');
    let mockSubmissionsExportReady = jest.spyOn(emailService, 'submissionsExportReady');
    let mockRead = jest.spyOn(fileService, 'read');
    let mockInsert = jest.spyOn(MockModel, 'insert');

    mockUploadData.mockImplementation(() => uploadedFile);
    mockInsert.mockImplementation(() => { throw new Error(); });
    mockSubmissionsExportReady.mockImplementation(() => {});
    mockRead.mockImplementation(() => file);
    mockDelete.mockImplementation(() => {});

    const fn = () =>
      fileService.createData(
        formId,
        reservationId,
        metadata,
        data,
        CURRENT_USER,
        referer
      );

    await expect(fn()).rejects.toThrow();

    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(mockUploadData).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.insert).toHaveBeenCalledTimes(1);
    expect(MockModel.patchAndFetchById).toHaveBeenCalledTimes(0);
    expect(MockTransaction.commit).toHaveBeenCalledTimes(0);
    expect(mockSubmissionsExportReady).toHaveBeenCalledTimes(0);
    expect(mockRead).toHaveBeenCalledTimes(0);
    expect(MockTransaction.rollback).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith({ path: uploadedFile.path });

    mockUploadData.mockRestore();
    mockSubmissionsExportReady.mockRestore();
    mockRead.mockRestore();
    mockInsert.mockRestore();
    mockDelete.mockRestore();
  });
});
