const { FileStorage, FormSubmission, FormSubmissionStatus, SubmissionMetadata } = require('../common/models');
const emailService = require('../email/emailService');
const eventService = require('../event/eventService');
const fileService = require('../file/service');
const log = require('../../components/log')(module.filename);

const { Statuses } = require('../common/constants');
const { eventStreamService, SUBMISSION_EVENT_TYPES } = require('../../components/eventStreamService');

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

  _handleFileUploads: async (submissionService, data, id, user, trx) => {
    const fileIds = submissionService._findFileIds(data);
    for (const fileId of fileIds) {
      const fileStorage = await fileService.read(fileId);
      if (!fileStorage.formSubmissionId) {
        await FileStorage.query(trx).patchAndFetchById(fileId, { formSubmissionId: id, updatedBy: user.usernameIdp });

        // move file and update storage/path atomically to ensure we don't swallow errors
        try {
          await fileService.moveSubmissionFile(id, fileStorage, user.usernameIdp);
        } catch (error) {
          log.error('Error moving file', { fileId, error: error?.message || error });
          throw error;
        }
      }
    }
  },

  _sendNotifications: async (updated, data, referrer, submissionReceived, formSubmissionId) => {
    await eventStreamService.onSubmit(SUBMISSION_EVENT_TYPES.UPDATED, updated.submission, data.draft);
    if (submissionReceived) {
      const submissionMetaData = await SubmissionMetadata.query().where('submissionId', formSubmissionId).first();
      await emailService.submissionReceived(submissionMetaData.formId, formSubmissionId, data, referrer).catch(() => {});
      await eventService.formSubmissionEventReceived(submissionMetaData.formId, submissionMetaData.formVersionId, formSubmissionId, data).catch(() => {});
    }
  },

  update: async (submissionService, formSubmissionId, data, currentUser, referrer, etrx = undefined) => {
    let trx;
    let result;
    let submissionReceived = false;
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
        submissionReceived = await service._handleStatusChange(submissionService, formSubmissionId, data, statuses, currentUser, trx);
        log.info(`Patched submissionId=${formSubmissionId} with new data`);
        await service._patchSubmission(formSubmissionId, data, currentUser, trx);
        await service._handleFileUploads(submissionService, data, formSubmissionId, currentUser, trx);
      }

      if (!etrx) {
        await trx.commit();
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
