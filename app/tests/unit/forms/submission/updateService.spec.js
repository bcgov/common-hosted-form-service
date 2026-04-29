const updateService = require('../../../../src/forms/submission/updateService');
const { Statuses } = require('../../../../src/forms/common/constants');

jest.mock('../../../../src/forms/common/models', () => ({
  FileStorage: { query: jest.fn() },
  FormSubmission: { query: jest.fn() },
  FormSubmissionStatus: { query: jest.fn(), startTransaction: jest.fn() },
  SubmissionMetadata: { query: jest.fn() },
}));
jest.mock('../../../../src/forms/file/service', () => ({
  read: jest.fn(),
  moveSubmissionFile: jest.fn(),
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
jest.mock('../../../../src/components/log', () => () => ({
  error: jest.fn(),
  info: jest.fn(),
}));
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

    it('patches and moves files that are not already linked', async () => {
      const fileIds = ['f1', 'f2'];
      const data = {};
      const id = 555;
      const user = { usernameIdp: 'uploader' };
      const trx = {};

      // Mock submissionService._findFileIds to return fileIds
      const submissionService = {
        _findFileIds: jest.fn().mockReturnValue(fileIds),
      };

      // Mock fileService.read to return fileStorage objects
      fileService.read.mockImplementation((fileId) => Promise.resolve({ id: fileId, formSubmissionId: null }));

      // Mock FileStorage.query().patchAndFetchById
      const patchAndFetchById = jest.fn().mockResolvedValue({});
      FileStorage.query.mockReturnValue({ patchAndFetchById });

      // Mock fileService.moveSubmissionFile
      fileService.moveSubmissionFile.mockResolvedValue();

      await updateService._handleFileUploads(submissionService, data, id, user, trx);

      expect(submissionService._findFileIds).toHaveBeenCalledWith(data);
      expect(fileService.read).toHaveBeenCalledTimes(fileIds.length);
      expect(patchAndFetchById).toHaveBeenCalledTimes(fileIds.length);
      expect(fileService.moveSubmissionFile).toHaveBeenCalledTimes(fileIds.length);
      expect(fileService.moveSubmissionFile).toHaveBeenCalledWith(id, { id: 'f1', formSubmissionId: null }, 'uploader');
      expect(fileService.moveSubmissionFile).toHaveBeenCalledWith(id, { id: 'f2', formSubmissionId: null }, 'uploader');
    });

    it('does not patch or move files already linked to a submission', async () => {
      const fileIds = ['f3'];
      const data = {};
      const id = 556;
      const user = { usernameIdp: 'uploader' };
      const trx = {};

      const submissionService = {
        _findFileIds: jest.fn().mockReturnValue(fileIds),
      };

      fileService.read.mockResolvedValue({ id: 'f3', formSubmissionId: 556 });
      const patchAndFetchById = jest.fn();
      FileStorage.query.mockReturnValue({ patchAndFetchById });
      fileService.moveSubmissionFile.mockResolvedValue();

      await updateService._handleFileUploads(submissionService, data, id, user, trx);

      expect(patchAndFetchById).not.toHaveBeenCalled();
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
