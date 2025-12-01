const { RetentionClassification, RetentionPolicy, ScheduledSubmissionDeletion } = require('../common/models');
const submissionService = require('../submission/service');
const log = require('../../components/log')(module.filename);

const service = {
  listRetentionClassifications: async () => {
    return await RetentionClassification.query().where('active', true);
  },

  getRetentionPolicy: async (formId) => {
    const policy = await RetentionPolicy.query().findOne({ formId }).withGraphFetched('classification').throwIfNotFound();
    return {
      formId: policy.formId,
      retentionDays: policy.retentionDays,
      retentionClassificationId: policy.retentionClassificationId,
      retentionClassificationDescription: policy.retentionClassificationDescription,
    };
  },

  configureRetentionPolicy: async (formId, policyData, user) => {
    const { retentionDays, retentionClassificationId, retentionClassificationDescription } = policyData;
    const existing = await RetentionPolicy.query().findOne({ formId });

    if (existing) {
      return await RetentionPolicy.query().patchAndFetchById(existing.id, {
        retentionDays,
        retentionClassificationId,
        retentionClassificationDescription,
        updatedBy: user,
        updatedAt: new Date(),
      });
    } else {
      return await RetentionPolicy.query().insert({
        formId,
        retentionDays,
        retentionClassificationId,
        retentionClassificationDescription,
        createdBy: user,
      });
    }
  },

  scheduleDeletion: async (submissionId, formId, user) => {
    const policy = await service.getRetentionPolicy(formId);

    let eligibleForDeletionAt;
    if (policy.retentionDays === null) {
      // Indefinite retention
      eligibleForDeletionAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
    } else {
      eligibleForDeletionAt = new Date(Date.now() + policy.retentionDays * 24 * 60 * 60 * 1000);
    }

    return await ScheduledSubmissionDeletion.query().insert({
      submissionId,
      formId,
      eligibleForDeletionAt,
      status: 'pending',
      createdBy: user,
    });
  },

  cancelDeletion: async (submissionId) => {
    const deleted = await ScheduledSubmissionDeletion.query().where('submissionId', submissionId).delete();
    return { submissionId, cancelled: deleted > 0 };
  },

  processDeletions: async (batchSize = 100) => {
    try {
      const eligible = await ScheduledSubmissionDeletion.query().where('status', 'pending').where('eligibleForDeletionAt', '<=', new Date()).limit(batchSize);

      if (eligible.length === 0) {
        return { processed: 0, results: [] };
      }

      const results = [];
      for (const scheduled of eligible) {
        try {
          await ScheduledSubmissionDeletion.query().patchAndFetchById(scheduled.id, { status: 'processing' });
          await submissionService.deleteSubmissionAndRelatedData(scheduled.submissionId);
          await ScheduledSubmissionDeletion.query().patchAndFetchById(scheduled.id, { status: 'completed' });
          results.push({ submissionId: scheduled.submissionId, status: 'completed' });
        } catch (err) {
          log.error(`Failed to delete submission ${scheduled.submissionId}`, err);
          await ScheduledSubmissionDeletion.query().patchAndFetchById(scheduled.id, {
            status: 'failed',
            failureReason: err.message,
          });
          results.push({ submissionId: scheduled.submissionId, status: 'failed', error: err.message });
        }
      }

      return { processed: results.length, results };
    } catch (err) {
      log.error('Error processing deletions', err);
      throw err;
    }
  },

  hardDeleteSubmissions: async (submissionIds) => {
    const results = [];
    for (const submissionId of submissionIds) {
      try {
        await submissionService.deleteSubmissionAndRelatedData(submissionId);
        await ScheduledSubmissionDeletion.query().where('submissionId', submissionId).update({ status: 'completed' });
        results.push({ submissionId, status: 'completed' });
      } catch (err) {
        log.error(`Failed to delete submission ${submissionId}`, err);
        await ScheduledSubmissionDeletion.query().where('submissionId', submissionId).update({
          status: 'failed',
          failureReason: err.message,
        });
        results.push({ submissionId, status: 'failed', error: err.message });
      }
    }
    return results;
  },
};

module.exports = service;
