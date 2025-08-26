const log = require('../../components/log');
const { FormSubmission } = require('../common/models');

const service = {
  /**
   * Process submissions for hard deletion based on form retention policies
   */
  processHardDeletions: async () => {
    let processed = 0;
    let deleted = 0;

    try {
      log.info('Starting hard deletion processing');

      // Find all deleted submissions where the form has retention days configured
      const candidates = await FormSubmission.query()
        .select(
          'form_submission.id',
          'form_submission.formId',
          'form_submission.confirmationId',
          'form_submission.updatedAt as deletedAt', // When it was marked deleted
          'form.name as formName',
          'form.retentionDays',
          'form.classificationType'
        )
        .join('form', 'form_submission.formId', 'form.id')
        .where('form_submission.deleted', true)
        .whereNotNull('form.retentionDays');

      log.info(`Found ${candidates.length} deleted submissions with retention policies`);

      // For each candidate, check if the retention period has passed
      const now = new Date();

      for (const submission of candidates) {
        try {
          // Calculate when the retention period expires
          const deletedAt = new Date(submission.deletedAt);
          const retentionMs = submission.retentionDays * 24 * 60 * 60 * 1000;
          const deletionDueDate = new Date(deletedAt.getTime() + retentionMs);

          if (now >= deletionDueDate) {
            // Retention period has passed - permanently delete the submission
            log.info(
              `Submission ${submission.id} (${submission.confirmationId}) ready for hard deletion. ` +
                `Deleted on ${deletedAt.toISOString()}, ` +
                `retention period ${submission.retentionDays} days expired.`
            );

            // Hard delete the submission - this will trigger the DELETE audit
            await FormSubmission.query().deleteById(submission.id);

            deleted++;
            log.info(`Hard deleted submission ${submission.id} (${submission.confirmationId})`);
          } else {
            // Retention period not yet passed
            const daysRemaining = Math.ceil((deletionDueDate - now) / (24 * 60 * 60 * 1000));
            log.debug(`Submission ${submission.id} not yet eligible for deletion. ${daysRemaining} days remaining in retention period.`);
            processed++;
          }
        } catch (error) {
          log.error(`Error processing submission ${submission.id}: ${error.message}`);
        }
      }

      processed += deleted;
      log.info(`Hard deletion processing complete. Processed: ${processed}, Permanently deleted: ${deleted}`);

      return { processed, deleted };
    } catch (error) {
      log.error('Error processing hard deletions', error.message);
      throw error;
    }
  },
};

module.exports = service;
