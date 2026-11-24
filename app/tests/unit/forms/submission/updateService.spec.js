const updateService = require('../../../../src/forms/submission/updateService');
const { Statuses } = require('../../../../src/forms/common/constants');

jest.mock('../../../../src/forms/common/models', () => ({
  FileStorage: { query: jest.fn() },
  FormSubmission: { query: jest.fn() },
  FormSubmissionStatus: { query: jest.fn(), startTransaction: jest.fn() },
  SubmissionMetadata: { query: jest.fn() },
}));
jest.mock('../../../../src/forms/file/service', () => ({
  claimSubmissionFiles: jest.fn(),
  moveSubmissionFile: jest.fn(),
  deleteStorageObject: jest.fn(),
  checkFilesForForm: jest.fn(),
}));
jest.mock('../../../../src/forms/email/emailService', () => ({
  submissionReceived: jest.fn().mockResolvedValue(),
}));
jest.mock('../../../../src/forms/event/eventService', () => ({
  formSubmissionEventReceived: jest.fn().mockResolvedValue(),
}));
jest.mock('../../../../src/components/eventStreamService', () => ({
  eventStreamService: { onSubmit: jest.fn() },
  SUBMISSION_EVENT_TYPES: { UPDATED: 'UPDATED' },
}));
jest.mock('../../../../src/components/log', () => {
  const log = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };
  return () => log;
});
const mockLog = require('../../../../src/components/log')();
jest.mock('../../../../src/forms/common/scheduleService', () => ({
  validateFormSubmissionSchedule: jest.fn(),
}));

describe('updateService', () => {
  const { FormSubmission, FormSubmissionStatus, SubmissionMetadata } = require('../../../../src/forms/common/models');
  const emailService = require('../../../../src/forms/email/emailService');
  const eventService = require('../../../../src/forms/event/eventService');
  const { eventStreamService } = require('../../../../src/components/eventStreamService');
  const { validateFormSubmissionSchedule } = require('../../../../src/forms/common/scheduleService');

  let submissionService;
  let trx;

  beforeEach(() => {
    submissionService = {
      changeStatusState: jest.fn(),
      read: jest.fn(),
      _findFileIds: jest.fn(),
    };
    trx = {};
    jest.clearAllMocks();
    validateFormSubmissionSchedule.mockClear();
  });

  describe('_isRestoring', () => {
    it('returns true if deleted is boolean', () => {
      expect(updateService._isRestoring({ deleted: true })).toBe(true);
      expect(updateService._isRestoring({ deleted: false })).toBe(true);
    });
    it('returns false if deleted is not boolean', () => {
      expect(updateService._isRestoring({ deleted: 'yes' })).toBe(false);
      expect(updateService._isRestoring({})).toBe(false);
    });
  });

  describe('_shouldBlockDraftUpdate', () => {
    it('returns true if draft and status is SUBMITTED', () => {
      const data = { draft: true };
      const statuses = [{ code: Statuses.SUBMITTED }];
      expect(updateService._shouldBlockDraftUpdate(data, statuses)).toBe(true);
    });
    it('returns false if not draft', () => {
      const data = { draft: false };
      const statuses = [{ code: Statuses.SUBMITTED }];
      expect(updateService._shouldBlockDraftUpdate(data, statuses)).toBe(false);
    });
  });

  describe('_restoreSubmission', () => {
    it('patches the submission with deleted and updatedBy', async () => {
      const patchAndFetchById = jest.fn().mockResolvedValue({});
      FormSubmission.query.mockReturnValue({ patchAndFetchById });
      const id = 123;
      const data = { deleted: true };
      const user = { usernameIdp: 'tester' };
      const trx = {};
      await updateService._restoreSubmission(id, data, user, trx);
      expect(FormSubmission.query).toHaveBeenCalledWith(trx);
      expect(patchAndFetchById).toHaveBeenCalledWith(id, { deleted: true, updatedBy: 'tester' });
    });
  });

  describe('_getStatuses', () => {
    it('returns statuses with correct modifiers', async () => {
      const modify = jest.fn().mockReturnThis();
      FormSubmissionStatus.query.mockReturnValue({ modify });
      const id = 456;
      await updateService._getStatuses(id);
      expect(FormSubmissionStatus.query).toHaveBeenCalled();
      expect(modify).toHaveBeenCalledWith('filterSubmissionId', id);
      expect(modify).toHaveBeenCalledWith('orderDescending');
    });
  });

  describe('_handleStatusChange', () => {
    it('calls changeStatusState and returns true if not draft and no statuses', async () => {
      const submissionService = { changeStatusState: jest.fn().mockResolvedValue() };
      const id = 789;
      const data = { draft: false };
      const statuses = [];
      const user = { usernameIdp: 'tester' };
      const trx = {};
      const result = await updateService._handleStatusChange(submissionService, id, data, statuses, user, trx);
      expect(submissionService.changeStatusState).toHaveBeenCalledWith(id, { code: Statuses.SUBMITTED }, user, trx);
      expect(result).toBe(true);
    });

    it('returns false if draft is true', async () => {
      const submissionService = { changeStatusState: jest.fn() };
      const result = await updateService._handleStatusChange(submissionService, 1, { draft: true }, [], {}, {});
      expect(submissionService.changeStatusState).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('returns false if statuses[0].code is not REVISING', async () => {
      const submissionService = { changeStatusState: jest.fn() };
      const statuses = [{ code: Statuses.SUBMITTED }];
      const result = await updateService._handleStatusChange(submissionService, 1, { draft: false }, statuses, {}, {});
      expect(submissionService.changeStatusState).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('_sendNotifications', () => {
    it('calls eventStreamService.onSubmit and does not send emails/events if submissionReceived is false', async () => {
      emailService.submissionReceived = jest.fn().mockResolvedValue();
      eventService.formSubmissionEventReceived = jest.fn().mockResolvedValue();
      const updated = { submission: { foo: 'bar' } };
      const data = { draft: false };
      const referrer = 'ref';
      const submissionReceived = false;
      const formSubmissionId = 1;
      await updateService._sendNotifications(updated, data, referrer, submissionReceived, formSubmissionId);
      expect(eventStreamService.onSubmit).toHaveBeenCalledWith('UPDATED', updated.submission, false);
      expect(emailService.submissionReceived).not.toHaveBeenCalled();
      expect(eventService.formSubmissionEventReceived).not.toHaveBeenCalled();
    });

    it('calls eventStreamService.onSubmit and sends emails/events if submissionReceived is true', async () => {
      emailService.submissionReceived = jest.fn().mockResolvedValue();
      eventService.formSubmissionEventReceived = jest.fn().mockResolvedValue();
      const updated = { submission: { foo: 'bar' } };
      const data = { draft: false };
      const referrer = 'ref';
      const submissionReceived = true;
      const formSubmissionId = 2;
      const submissionMetaData = { formId: 'f1', formVersionId: 'v1' };
      SubmissionMetadata.query.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(submissionMetaData),
      });
      await updateService._sendNotifications(updated, data, referrer, submissionReceived, formSubmissionId);
      expect(eventStreamService.onSubmit).toHaveBeenCalledWith('UPDATED', updated.submission, false);
      expect(emailService.submissionReceived).toHaveBeenCalledWith('f1', formSubmissionId, data, referrer);
      expect(eventService.formSubmissionEventReceived).toHaveBeenCalledWith('f1', 'v1', formSubmissionId, data);
    });
  });

  describe('_patchSubmission', () => {
    it('patches the submission with draft, submission, and updatedBy', async () => {
      const patchAndFetchById = jest.fn().mockResolvedValue({});
      FormSubmission.query.mockReturnValue({ patchAndFetchById });
      const id = 321;
      const data = { draft: true, submission: { foo: 'bar' } };
      const user = { usernameIdp: 'patcher' };
      const trx = {};
      await updateService._patchSubmission(id, data, user, trx);
      expect(FormSubmission.query).toHaveBeenCalledWith(trx);
      expect(patchAndFetchById).toHaveBeenCalledWith(id, {
        draft: true,
        submission: { foo: 'bar' },
        updatedBy: 'patcher',
      });
    });
  });

  describe('_handleFileUploads', () => {
    const fileService = require('../../../../src/forms/file/service');
    const { FileStorage } = require('../../../../src/forms/common/models');

    const SUB = '4d1f3b8e-5b8a-4d4e-9a39-0e7f1c2f1a01';
    const F1 = '0b6a2b0c-1d4e-4f5a-8b6c-7d8e9f0a1b21';
    const F2 = '0b6a2b0c-1d4e-4f5a-8b6c-7d8e9f0a1b22';
    const F3 = '0b6a2b0c-1d4e-4f5a-8b6c-7d8e9f0a1b23';
    const user = { usernameIdp: 'uploader' };
    const trx = { id: 'submission-trx' };
    let whereIn;

    const rows = (list) => {
      whereIn = jest.fn().mockResolvedValue(list);
      FileStorage.query.mockReturnValue({ whereIn });
    };
    const named = (...fileIds) => ({ _findFileIds: jest.fn().mockReturnValue(fileIds) });
    const pending = (id, createdBy = 'uploader', extra = {}) => ({ id, formSubmissionId: null, createdBy, ...extra });

    beforeEach(() => {
      FileStorage.query.mockReset();
      fileService.claimSubmissionFiles.mockReset();
      fileService.claimSubmissionFiles.mockResolvedValue();
      fileService.checkFilesForForm.mockReset();
      fileService.moveSubmissionFile.mockReset();
      fileService.moveSubmissionFile.mockImplementation((_id, fileStorage) => Promise.resolve(fileStorage));
      mockLog.warn.mockClear();
    });

    it('reads the named files in one query in the submission transaction, then claims and moves the submitter own uploads', async () => {
      rows([pending(F1), pending(F2)]);

      const moved = await updateService._handleFileUploads(named(F1, F2), {}, SUB, user, trx);

      expect(FileStorage.query).toHaveBeenCalledWith(trx);
      expect(whereIn).toHaveBeenCalledWith('id', [F1, F2]);
      // The submission transaction is passed through, so a second transaction is
      // never opened against the row this transaction already locked.
      expect(fileService.claimSubmissionFiles).toHaveBeenCalledWith(SUB, [pending(F1), pending(F2)], 'uploader', trx);
      expect(fileService.moveSubmissionFile).toHaveBeenNthCalledWith(1, SUB, pending(F1), 'uploader', trx);
      expect(fileService.moveSubmissionFile).toHaveBeenNthCalledWith(2, SUB, pending(F2), 'uploader', trx);
      // It returns the moved files so the caller can clean up the originals.
      expect(moved).toEqual([pending(F1), pending(F2)]);
    });

    it('claims every file before moving any, and moves them one at a time', async () => {
      const order = [];
      fileService.claimSubmissionFiles.mockImplementation(async () => order.push('claim'));
      fileService.moveSubmissionFile.mockImplementation(async (_id, fileStorage) => {
        order.push(`start ${fileStorage.id}`);
        await new Promise((resolve) => setImmediate(resolve));
        order.push(`end ${fileStorage.id}`);
        return fileStorage;
      });
      rows([pending(F1), pending(F2)]);

      await updateService._handleFileUploads(named(F1, F2), {}, SUB, user, trx);

      expect(order).toEqual(['claim', `start ${F1}`, `end ${F1}`, `start ${F2}`, `end ${F2}`]);
    });

    it('starts no move after a move fails', async () => {
      rows([pending(F1), pending(F2)]);
      fileService.moveSubmissionFile.mockRejectedValueOnce(new Error('File move failed'));

      await expect(updateService._handleFileUploads(named(F1, F2), {}, SUB, user, trx)).rejects.toThrow('File move failed');
      expect(fileService.moveSubmissionFile).toHaveBeenCalledTimes(1);
    });

    it('moves nothing when the claim fails', async () => {
      rows([pending(F1)]);
      fileService.claimSubmissionFiles.mockRejectedValue(Object.assign(new Error('conflict'), { status: 409 }));

      await expect(updateService._handleFileUploads(named(F1), {}, SUB, user, trx)).rejects.toMatchObject({ status: 409 });
      expect(fileService.moveSubmissionFile).not.toHaveBeenCalled();
    });

    it('keeps files on this submission, and leaves files on another one with a logged count', async () => {
      rows([
        { id: F1, formSubmissionId: SUB, createdBy: 'someone-else' },
        { id: F2, formSubmissionId: 'other-submission', createdBy: 'someone-else' },
      ]);

      const moved = await updateService._handleFileUploads(named(F1, F2), {}, SUB, user, trx);

      expect(moved).toEqual([]);
      expect(fileService.claimSubmissionFiles).toHaveBeenCalledWith(SUB, [], 'uploader', trx);
      expect(fileService.moveSubmissionFile).not.toHaveBeenCalled();
      expect(mockLog.warn).toHaveBeenCalledWith('Submission names files on other submissions', { submissionId: SUB, count: 1 });
    });

    it('reads only UUIDs, each once and lowercased', async () => {
      rows([pending(F1)]);

      await updateService._handleFileUploads(named('not-a-uuid', 42, F1, F1.toUpperCase()), {}, SUB, user, trx);

      expect(whereIn).toHaveBeenCalledWith('id', [F1]);
    });

    it('queries nothing when the data names no file ids', async () => {
      const moved = await updateService._handleFileUploads(named('not-a-uuid'), {}, SUB, user, trx);

      expect(FileStorage.query).not.toHaveBeenCalled();
      expect(moved).toEqual([]);
    });

    it("checks every file against the submission's form before claiming or moving any", async () => {
      const files = [pending(F1, 'uploader', { formId: null }), pending(F2, 'uploader', { formId: 'form-b' })];
      rows(files);
      const submissionService = { ...named(F1, F2), read: jest.fn().mockResolvedValue({ form: { id: 'form-a' } }) };
      const refused = Object.assign(new Error('another form'), { status: 422 });
      fileService.checkFilesForForm.mockImplementationOnce(() => {
        throw refused;
      });

      await expect(updateService._handleFileUploads(submissionService, {}, SUB, user, trx)).rejects.toBe(refused);

      expect(submissionService.read).toHaveBeenCalledWith(SUB);
      expect(fileService.checkFilesForForm).toHaveBeenCalledWith(files, 'form-a');
      expect(fileService.claimSubmissionFiles).not.toHaveBeenCalled();
      expect(fileService.moveSubmissionFile).not.toHaveBeenCalled();
    });

    it('moves a file uploaded for the same form', async () => {
      const file = pending(F1, 'uploader', { formId: 'form-a' });
      rows([file]);
      const submissionService = { ...named(F1), read: jest.fn().mockResolvedValue({ form: { id: 'form-a' } }) };

      const moved = await updateService._handleFileUploads(submissionService, {}, SUB, user, trx);

      expect(fileService.checkFilesForForm).toHaveBeenCalledWith([file], 'form-a');
      expect(moved).toEqual([file]);
    });

    it('does not read the submission when no file records a form', async () => {
      rows([pending(F1)]);
      const submissionService = { ...named(F1), read: jest.fn() };

      await updateService._handleFileUploads(submissionService, {}, SUB, user, trx);

      expect(submissionService.read).not.toHaveBeenCalled();
      expect(fileService.checkFilesForForm).not.toHaveBeenCalled();
      expect(fileService.moveSubmissionFile).toHaveBeenCalledTimes(1);
    });

    it('ignores an id that is not a file', async () => {
      rows([]);

      const moved = await updateService._handleFileUploads(named(F3), {}, SUB, user, trx);

      expect(moved).toEqual([]);
      expect(fileService.moveSubmissionFile).not.toHaveBeenCalled();
    });

    it.each([
      ['another user', { createdBy: 'someone-else' }],
      ['an anonymous uploader, for a signed-in submitter', { createdBy: 'public' }],
      ['the package worker', { createdBy: 'submission-package-worker' }],
      ['a file the package worker moved', { createdBy: 'public', updatedBy: 'submission-package-worker' }],
    ])('rejects a pending upload by %s before claiming or moving anything', async (_name, row) => {
      rows([pending(F1), { id: F2, formSubmissionId: null, ...row }]);

      await expect(updateService._handleFileUploads(named(F1, F2), {}, SUB, user, trx)).rejects.toMatchObject({ status: 400 });
      expect(fileService.claimSubmissionFiles).not.toHaveBeenCalled();
      expect(fileService.moveSubmissionFile).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('restores submission if _isRestoring is true', async () => {
      const data = { deleted: true };
      updateService._isRestoring = jest.fn().mockReturnValue(true);
      updateService._restoreSubmission = jest.fn();
      submissionService.read = jest.fn().mockResolvedValue({ submission: {}, form: {} });

      await updateService.update(submissionService, 1, data, { usernameIdp: 'user' }, null, trx);

      expect(updateService._restoreSubmission).toHaveBeenCalled();
    });

    it('returns false if _shouldBlockDraftUpdate is true', async () => {
      updateService._isRestoring = jest.fn().mockReturnValue(false);
      updateService._getStatuses = jest.fn().mockResolvedValue([{ code: Statuses.SUBMITTED }]);
      updateService._shouldBlockDraftUpdate = jest.fn().mockReturnValue(true);

      const result = await updateService.update(submissionService, 1, { draft: true }, { usernameIdp: 'user' }, null, trx);

      expect(result).toBe(false);
    });

    it('calls status change, patch, file uploads, notifications', async () => {
      updateService._isRestoring = jest.fn().mockReturnValue(false);
      updateService._getStatuses = jest.fn().mockResolvedValue([]);
      updateService._shouldBlockDraftUpdate = jest.fn().mockReturnValue(false);
      updateService._handleStatusChange = jest.fn().mockResolvedValue(true);
      updateService._patchSubmission = jest.fn();
      updateService._handleFileUploads = jest.fn();
      submissionService.read = jest.fn().mockResolvedValue({ submission: {}, form: {}, id: 1 });
      updateService._sendNotifications = jest.fn();

      await updateService.update(submissionService, 1, {}, { usernameIdp: 'user' }, null, trx);

      expect(updateService._handleStatusChange).toHaveBeenCalled();
      expect(updateService._patchSubmission).toHaveBeenCalled();
      expect(updateService._handleFileUploads).toHaveBeenCalled();
      expect(updateService._sendNotifications).toHaveBeenCalled();
    });

    it('validates schedule when converting draft to submitted', async () => {
      updateService._isRestoring = jest.fn().mockReturnValue(false);
      updateService._getStatuses = jest.fn().mockResolvedValue([]);
      updateService._shouldBlockDraftUpdate = jest.fn().mockReturnValue(false);
      updateService._handleStatusChange = jest.fn().mockResolvedValue(true);
      updateService._patchSubmission = jest.fn();
      updateService._handleFileUploads = jest.fn();
      updateService._sendNotifications = jest.fn();
      const formData = { schedule: { expire: false } };
      submissionService.read = jest.fn().mockResolvedValue({ submission: {}, form: formData, id: 1 });

      await updateService.update(submissionService, 1, { draft: false }, { usernameIdp: 'user' }, null, trx);

      expect(submissionService.read).toHaveBeenCalledWith(1);
      expect(validateFormSubmissionSchedule).toHaveBeenCalledWith(formData);
      expect(updateService._handleStatusChange).toHaveBeenCalled();
    });

    it('does not validate schedule when updating draft', async () => {
      updateService._isRestoring = jest.fn().mockReturnValue(false);
      updateService._getStatuses = jest.fn().mockResolvedValue([]);
      updateService._shouldBlockDraftUpdate = jest.fn().mockReturnValue(false);
      updateService._handleStatusChange = jest.fn().mockResolvedValue(false);
      updateService._patchSubmission = jest.fn();
      updateService._handleFileUploads = jest.fn();
      updateService._sendNotifications = jest.fn();
      submissionService.read = jest.fn().mockResolvedValue({ submission: {}, form: {}, id: 1 });

      await updateService.update(submissionService, 1, { draft: true }, { usernameIdp: 'user' }, null, trx);

      expect(validateFormSubmissionSchedule).not.toHaveBeenCalled();
      expect(updateService._patchSubmission).toHaveBeenCalled();
    });

    it('throws error when schedule validation fails', async () => {
      updateService._isRestoring = jest.fn().mockReturnValue(false);
      updateService._getStatuses = jest.fn().mockResolvedValue([]);
      updateService._shouldBlockDraftUpdate = jest.fn().mockReturnValue(false);
      const formData = { schedule: { expire: true, allowLateSubmissions: false } };
      submissionService.read = jest.fn().mockResolvedValue({ submission: {}, form: formData, id: 1 });
      const scheduleError = new Error('Form submission period has expired');
      scheduleError.status = 403;
      validateFormSubmissionSchedule.mockImplementation(() => {
        throw scheduleError;
      });

      await expect(updateService.update(submissionService, 1, { draft: false }, { usernameIdp: 'user' }, null, trx)).rejects.toThrow('Form submission period has expired');

      expect(validateFormSubmissionSchedule).toHaveBeenCalledWith(formData);
      expect(updateService._patchSubmission).not.toHaveBeenCalled();
    });

    it('does not commit or rollback external transaction on successful update', async () => {
      const fakeTrx = { commit: jest.fn(), rollback: jest.fn() };

      // Set up all helpers to succeed
      updateService._isRestoring = jest.fn().mockReturnValue(true);
      updateService._restoreSubmission = jest.fn().mockResolvedValue();
      const expectedResult = { id: 1 };
      const submissionService = { read: jest.fn().mockResolvedValue(expectedResult) };

      const result = await updateService.update(submissionService, 1, { deleted: true }, { usernameIdp: 'user' }, null, fakeTrx);

      expect(fakeTrx.commit).not.toHaveBeenCalled();
      expect(fakeTrx.rollback).not.toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });

    it('does not rollback external transaction on failed update', async () => {
      updateService._isRestoring = jest.fn().mockReturnValue(true);
      updateService._restoreSubmission = jest.fn().mockRejectedValue(new Error('fail'));
      const fakeTrx = { rollback: jest.fn() };

      await expect(updateService.update(submissionService, 1, { deleted: true }, { usernameIdp: 'user' }, null, fakeTrx)).rejects.toThrow('fail');
      // Should NOT call rollback on external transaction
      expect(fakeTrx.rollback).not.toHaveBeenCalled();
    });

    it('internal transaction commits if update succeeds', async () => {
      // Mock the transaction object with commit
      const mockRollback = jest.fn();
      const mockCommit = jest.fn();
      const mockTrx = { rollback: mockRollback, commit: mockCommit };

      // Mock FormSubmissionStatus.startTransaction to return our mockTrx
      const startTransactionSpy = jest.spyOn(require('../../../../src/forms/common/models').FormSubmissionStatus, 'startTransaction').mockResolvedValue(mockTrx);

      // Set up all helpers to succeed
      updateService._isRestoring = jest.fn().mockReturnValue(true);
      updateService._restoreSubmission = jest.fn().mockResolvedValue();
      // Simulate a successful read
      const expectedResult = { id: 1 };
      const submissionService = { read: jest.fn().mockResolvedValue(expectedResult) };

      const result = await updateService.update(submissionService, 1, { deleted: true }, { usernameIdp: 'user' }, null);

      expect(startTransactionSpy).toHaveBeenCalled();
      expect(mockCommit).toHaveBeenCalled();
      expect(result).toBe(expectedResult);

      // Clean up
      startTransactionSpy.mockRestore();
    });

    it('deletes the original storage objects after the internal transaction commits', async () => {
      const fileService = require('../../../../src/forms/file/service');
      const mockTrx = { rollback: jest.fn(), commit: jest.fn() };
      const startTransactionSpy = jest.spyOn(require('../../../../src/forms/common/models').FormSubmissionStatus, 'startTransaction').mockResolvedValue(mockTrx);

      const movedFiles = [{ id: 'f1' }, { id: 'f2' }];
      updateService._isRestoring = jest.fn().mockReturnValue(false);
      updateService._getStatuses = jest.fn().mockResolvedValue([]);
      updateService._shouldBlockDraftUpdate = jest.fn().mockReturnValue(false);
      updateService._handleStatusChange = jest.fn().mockResolvedValue(false);
      updateService._patchSubmission = jest.fn();
      updateService._handleFileUploads = jest.fn().mockResolvedValue(movedFiles);
      updateService._sendNotifications = jest.fn();
      const submissionService = { read: jest.fn().mockResolvedValue({ id: 1 }) };

      // No external transaction -> update owns the commit and the cleanup.
      await updateService.update(submissionService, 1, { draft: true }, { usernameIdp: 'user' }, null);

      expect(mockTrx.commit).toHaveBeenCalled();
      expect(fileService.deleteStorageObject).toHaveBeenCalledTimes(2);
      expect(fileService.deleteStorageObject).toHaveBeenCalledWith({ id: 'f1' });
      expect(fileService.deleteStorageObject).toHaveBeenCalledWith({ id: 'f2' });

      startTransactionSpy.mockRestore();
    });

    it('does not delete original storage objects when using an external transaction', async () => {
      const fileService = require('../../../../src/forms/file/service');

      const movedFiles = [{ id: 'f1' }];
      updateService._isRestoring = jest.fn().mockReturnValue(false);
      updateService._getStatuses = jest.fn().mockResolvedValue([]);
      updateService._shouldBlockDraftUpdate = jest.fn().mockReturnValue(false);
      updateService._handleStatusChange = jest.fn().mockResolvedValue(false);
      updateService._patchSubmission = jest.fn();
      updateService._handleFileUploads = jest.fn().mockResolvedValue(movedFiles);
      updateService._sendNotifications = jest.fn();
      const submissionService = { read: jest.fn().mockResolvedValue({ id: 1 }) };
      const fakeTrx = { commit: jest.fn(), rollback: jest.fn() };

      // External transaction -> the owner commits and is responsible for cleanup.
      await updateService.update(submissionService, 1, { draft: true }, { usernameIdp: 'user' }, null, fakeTrx);

      expect(fakeTrx.commit).not.toHaveBeenCalled();
      expect(fileService.deleteStorageObject).not.toHaveBeenCalled();
    });

    it('internal transaction rolled back on error', async () => {
      // Mock the transaction object with rollback
      const mockRollback = jest.fn();
      const mockCommit = jest.fn();
      const mockTrx = { rollback: mockRollback, commit: mockCommit };

      // Mock FormSubmissionStatus.startTransaction to return our mockTrx
      const startTransactionSpy = jest.spyOn(require('../../../../src/forms/common/models').FormSubmissionStatus, 'startTransaction').mockResolvedValue(mockTrx);

      // Force an error in the update flow
      updateService._isRestoring = jest.fn().mockReturnValue(true);
      updateService._restoreSubmission = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(updateService.update(submissionService, 1, { deleted: true }, { usernameIdp: 'user' }, null)).rejects.toThrow('fail');

      // Ensure internal transaction was started and rollback was called
      expect(startTransactionSpy).toHaveBeenCalled();
      expect(mockRollback).toHaveBeenCalled();

      // Clean up
      startTransactionSpy.mockRestore();
    });
  });
});
