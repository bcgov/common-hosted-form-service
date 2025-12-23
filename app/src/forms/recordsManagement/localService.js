const uuid = require('uuid');
const { RetentionClassification, RetentionPolicy, ScheduledSubmissionDeletion, SubmissionMetadata } = require('../common/models');
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
      enabled: policy.enabled,
    };
  },

  configureRetentionPolicy: async (formId, policyData, user) => {
    const { retentionDays, retentionClassificationId, retentionClassificationDescription, enabled = true } = policyData;
    let trx;

    try {
      trx = await RetentionPolicy.startTransaction();
      const existing = await RetentionPolicy.query(trx).findOne({ formId });

      if (existing) {
        // Policy exists - update it and recalculate scheduled deletion dates
        const updated = await RetentionPolicy.query(trx).patchAndFetchById(existing.id, {
          retentionDays,
          retentionClassificationId,
          retentionClassificationDescription,
          enabled,
          updatedBy: user,
          updatedAt: new Date().toISOString(),
        });

        if (!enabled) {
          // Clean up all scheduled deletions for this form
          await ScheduledSubmissionDeletion.query(trx).where('formId', formId).delete();
        }
        // Only if there's a change in the retention days do we need to recalculate
        else if (existing.retentionDays !== retentionDays) {
          // Recalculate deletion dates for pending scheduled deletions
          const eligibleForDeletionAt =
            retentionDays === null
              ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();

          await ScheduledSubmissionDeletion.query(trx).where('formId', formId).where('status', 'pending').patch({ eligibleForDeletionAt });
        }

        await trx.commit();
        return updated;
      } else {
        // New policy - create it and backfill scheduled deletions
        const policy = await RetentionPolicy.query(trx).insert({
          id: uuid.v4(),
          formId,
          retentionDays,
          retentionClassificationId,
          retentionClassificationDescription,
          enabled,
          createdBy: user,
        });

        // Backfill scheduled deletions for existing submissions
        const submissions = await SubmissionMetadata.query(trx)
          .select('submissionId')
          .where('formId', formId)
          .where('deleted', true)
          .whereNotIn('submissionId', ScheduledSubmissionDeletion.query(trx).select('submissionId').where('formId', formId));

        if (submissions.length > 0) {
          const eligibleForDeletionAt =
            retentionDays === null
              ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();

          const scheduledDeletions = submissions.map((sub) => ({
            id: uuid.v4(),
            submissionId: sub.submissionId,
            formId,
            eligibleForDeletionAt,
            status: 'pending',
            createdBy: 'system',
          }));

          await ScheduledSubmissionDeletion.query(trx).insert(scheduledDeletions);
        }

        await trx.commit();
        return policy;
      }
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  scheduleDeletion: async (submissionId, formId, user) => {
    const policy = await service.getRetentionPolicy(formId);

    let eligibleForDeletionAt;
    if (policy.retentionDays === null) {
      // Indefinite retention
      eligibleForDeletionAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      eligibleForDeletionAt = new Date(Date.now() + policy.retentionDays * 24 * 60 * 60 * 1000).toISOString();
    }

    return await ScheduledSubmissionDeletion.query().insert({
      id: uuid.v4(),
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

  deleteRetentionPolicy: async (formId) => {
    let trx;
    try {
      trx = await RetentionPolicy.startTransaction();

      // Soft delete by disabling the policy
      await RetentionPolicy.query(trx).where('formId', formId).delete();

      // Clean up all scheduled deletions for this form
      const deleted = await ScheduledSubmissionDeletion.query(trx).where('formId', formId).delete();

      await trx.commit();
      return { formId, deletedSchedules: deleted };
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  processDeletions: async (batchSize = 500) => {
    try {
      // Only process deletions where the retention policy is enabled
      const eligible = await ScheduledSubmissionDeletion.query()
        .join('retention_policy', 'scheduled_submission_deletion.formId', '=', 'retention_policy.formId')
        .select('scheduled_submission_deletion.*')
        .where('scheduled_submission_deletion.status', 'pending')
        .where('scheduled_submission_deletion.eligibleForDeletionAt', '<=', new Date())
        .where('retention_policy.enabled', true)
        .limit(batchSize);

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
