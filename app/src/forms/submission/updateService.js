const { FileStorage, FormSubmission, FormSubmissionStatus, SubmissionMetadata } = require('../common/models');
const emailService = require('../email/emailService');
const eventService = require('../event/eventService');
const fileService = require('../file/service');
const { normalizeFileIds, planFileLinks } = require('../file/fileLink');
const log = require('../../components/log')(module.filename);

const { Statuses } = require('../common/constants');
const { eventStreamService, SUBMISSION_EVENT_TYPES } = require('../../components/eventStreamService');
const { validateFormSubmissionSchedule } = require('../common/scheduleService');

const service = {
  _isRestoring: (data) => {
    return data['deleted'] !== undefined && typeof data.deleted == 'boolean';
  },

  _restoreSubmission: async (id, data, user, trx) => {
    await FormSubmission.query(trx).patchAndFetchById(id, { deleted: data.deleted, updatedBy: user.usernameIdp });
  },

  _getStatuses: async (id) => {
    return FormSubmissionStatus.query().modify('filterSubmissionId', id).modify('orderDescending');
  },

  _shouldBlockDraftUpdate: (data, statuses) => {
    return data.draft && statuses && statuses.length > 0 && (statuses[0].code === Statuses.SUBMITTED || statuses[0].code === Statuses.COMPLETED);
  },

  _handleStatusChange: async (submissionService, id, data, statuses, user, trx) => {
    if (!data.draft && (!statuses || !statuses.length || statuses[0].code === Statuses.REVISING)) {
      await submissionService.changeStatusState(id, { code: Statuses.SUBMITTED }, user, trx);
      return true;
    }
    return false;
  },

  _patchSubmission: async (id, data, user, trx) => {
    await FormSubmission.query(trx).patchAndFetchById(id, {
      draft: data.draft,
      submission: data.submission,
      updatedBy: user.usernameIdp,
    });
  },

  /**
   * Attaches the files the saved data names to the submission and moves them
   * to permanent storage. The rules are in file/fileLink.decideFileLink: the
   * submitter's own pending uploads are attached, files already on this or
   * another submission stay where they are, and any other file fails the save
   * with a 400. Ids that are not UUIDs or not files are ignored, as on create.
   * All files are claimed before any is moved (a file another save attached
   * first is a 409), and the moves run one at a time, so a failure stops them
   * before the caller rolls back.
   *
   * @returns {Promise<object[]>} the original (pre-move) file records, so the
   *   caller can remove the original objects once the transaction commits.
   */
  _handleFileUploads: async (submissionService, data, id, user, trx) => {
    const fileIds = normalizeFileIds(submissionService._findFileIds(data));
    if (!fileIds.length) return [];

    const files = await FileStorage.query(trx).whereIn('id', fileIds);
    const { link, left } = planFileLinks({ files, submissionId: id, user });
    if (left) {
      log.warn('Submission names files on other submissions', { submissionId: id, count: left });
    }

    await fileService.claimSubmissionFiles(id, link, user.usernameIdp, trx);

    // Each file's row update runs inside the submission transaction so it does
    // not deadlock against the lock this transaction holds. The original
    // object is removed by the caller once the transaction has committed.
    const movedFiles = [];
    for (const fileStorage of link) {
      try {
        const moved = await fileService.moveSubmissionFile(id, fileStorage, user.usernameIdp, trx);
        movedFiles.push(moved || fileStorage);
      } catch (error) {
        log.error('Error moving file', { error, fileId: fileStorage.id, submissionId: id, userId: user.usernameIdp, originalName: fileStorage.originalName });
        throw error;
      }
    }
    return movedFiles;
  },

  _sendNotifications: async (updated, data, referrer, submissionReceived, formSubmissionId) => {
    await eventStreamService.onSubmit(SUBMISSION_EVENT_TYPES.UPDATED, updated.submission, data.draft);
    if (submissionReceived) {
      const submissionMetaData = await SubmissionMetadata.query().where('submissionId', formSubmissionId).first();
      await emailService.submissionReceived(submissionMetaData.formId, formSubmissionId, data, referrer).catch((error) => {
        log.error('Failed to send submission received confirmation email', { error, formId: submissionMetaData.formId, submissionId: formSubmissionId, referrer });
      });
      await eventService.formSubmissionEventReceived(submissionMetaData.formId, submissionMetaData.formVersionId, formSubmissionId, data).catch((error) => {
        log.error('Failed to publish submission received event', {
          error,
          formId: submissionMetaData.formId,
          formVersionId: submissionMetaData.formVersionId,
          submissionId: formSubmissionId,
          referrer,
        });
      });
    }
  },

  update: async (submissionService, formSubmissionId, data, currentUser, referrer, etrx = undefined) => {
    let trx;
    let result;
    let submissionReceived = false;
    let movedFiles = [];
    try {
      trx = etrx || (await FormSubmissionStatus.startTransaction());
      log.info(`Starting update for submissionId=${formSubmissionId} by user=${currentUser.usernameIdp}`);

      if (service._isRestoring(data)) {
        log.info(`Restoring submissionId=${formSubmissionId}`);
        await service._restoreSubmission(formSubmissionId, data, currentUser, trx);
      } else {
        const statuses = await service._getStatuses(formSubmissionId);
        if (service._shouldBlockDraftUpdate(data, statuses)) {
          log.info(`Draft update blocked for submissionId=${formSubmissionId} due to status=${statuses[0]?.code}`);
          return false;
        }

        // Validate schedule before allowing draft to be converted to submitted
        if (!data.draft) {
          const submissionData = await submissionService.read(formSubmissionId);
          validateFormSubmissionSchedule(submissionData.form);
        }

        submissionReceived = await service._handleStatusChange(submissionService, formSubmissionId, data, statuses, currentUser, trx);
        log.info(`Patched submissionId=${formSubmissionId} with new data`);
        await service._patchSubmission(formSubmissionId, data, currentUser, trx);
        movedFiles = (await service._handleFileUploads(submissionService, data, formSubmissionId, currentUser, trx)) || [];
      }

      if (!etrx) {
        await trx.commit();

        // Files were copied to permanent storage inside the transaction; now that
        // it is committed, remove the original (pre-move) objects. Best-effort: a
        // storage failure just leaves an orphan and must not fail the submission.
        for (const fileStorage of movedFiles) {
          await fileService.deleteStorageObject(fileStorage);
        }
        log.info(`Transaction committed for submissionId=${formSubmissionId}`);
      }
      result = await submissionService.read(formSubmissionId);
    } catch (err) {
      if (!etrx && trx) {
        await trx.rollback();
        log.error(`Transaction rolled back for submissionId=${formSubmissionId} due to error: ${err.message}`);
      }
      throw err;
    }
    if (result) {
      log.info(`Update completed for submissionId=${formSubmissionId}`);
      await service._sendNotifications(result, data, referrer, submissionReceived, formSubmissionId);
    }
    return result;
  },
};
module.exports = service;
