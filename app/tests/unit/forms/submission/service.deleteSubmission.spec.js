jest.mock('../../../../src/forms/common/models', () => ({
  Form: { query: jest.fn() },
  FormGroup: { query: jest.fn() },
  FormVersion: { query: jest.fn() },
  FormSubmission: { query: jest.fn() },
  FormSubmissionStatus: { query: jest.fn() },
  FormSubmissionUser: { query: jest.fn() },
  FileStorage: { query: jest.fn(), startTransaction: jest.fn() },
  Note: { query: jest.fn() },
  SubmissionAudit: { query: jest.fn() },
  SubmissionMetadata: { query: jest.fn() },
}));
jest.mock('../../../../src/forms/file/service', () => ({
  deleteStorageObject: jest.fn(),
  deleteFiles: jest.fn(),
}));

const service = require('../../../../src/forms/submission/service');
const { FileStorage, Note, FormSubmission, FormSubmissionStatus, FormSubmissionUser } = require('../../../../src/forms/common/models');
const fileService = require('../../../../src/forms/file/service');

const submissionId = 'submission-1';
const fileRows = [{ id: 'file-1' }, { id: 'file-2' }];

// Helper returning a query stub whose .where(...).delete() resolves.
const deletableQuery = (deleteResult) => ({
  where: jest.fn().mockReturnValue({ delete: jest.fn().mockResolvedValue(deleteResult) }),
});

describe('deleteSubmissionAndRelatedData', () => {
  let trx;

  beforeEach(() => {
    jest.clearAllMocks();
    trx = { commit: jest.fn().mockResolvedValue(), rollback: jest.fn().mockResolvedValue() };
    FileStorage.startTransaction.mockResolvedValue(trx);

    // First FileStorage.query() reads the file rows, second deletes them.
    FileStorage.query.mockReturnValueOnce({ where: jest.fn().mockResolvedValue(fileRows) }).mockReturnValueOnce(deletableQuery(fileRows.length));
    Note.query.mockReturnValue(deletableQuery());
    FormSubmissionStatus.query.mockReturnValue(deletableQuery());
    FormSubmissionUser.query.mockReturnValue(deletableQuery());
    FormSubmission.query.mockReturnValue(deletableQuery(1));
  });

  it('commits the deletion and purges stored objects after commit', async () => {
    const result = await service.deleteSubmissionAndRelatedData(submissionId);

    expect(result).toEqual({ success: true });
    expect(trx.commit).toHaveBeenCalled();
    expect(trx.rollback).not.toHaveBeenCalled();

    // Each captured file's stored object is removed, and the old fire-and-forget
    // path (deleteFiles, with its own conflicting transaction) is not used.
    expect(fileService.deleteStorageObject).toHaveBeenCalledTimes(fileRows.length);
    expect(fileService.deleteStorageObject).toHaveBeenCalledWith({ id: 'file-1' });
    expect(fileService.deleteStorageObject).toHaveBeenCalledWith({ id: 'file-2' });
    expect(fileService.deleteFiles).not.toHaveBeenCalled();
  });

  it('removes stored objects only after the transaction has committed', async () => {
    await service.deleteSubmissionAndRelatedData(submissionId);

    const commitOrder = trx.commit.mock.invocationCallOrder[0];
    const firstDeleteOrder = fileService.deleteStorageObject.mock.invocationCallOrder[0];
    expect(commitOrder).toBeLessThan(firstDeleteOrder);
  });

  it('rolls back and does not touch storage when a delete fails', async () => {
    Note.query.mockReturnValue({ where: jest.fn().mockReturnValue({ delete: jest.fn().mockRejectedValue(new Error('db error')) }) });

    await expect(service.deleteSubmissionAndRelatedData(submissionId)).rejects.toThrow('db error');

    expect(trx.rollback).toHaveBeenCalled();
    expect(trx.commit).not.toHaveBeenCalled();
    expect(fileService.deleteStorageObject).not.toHaveBeenCalled();
  });
});
