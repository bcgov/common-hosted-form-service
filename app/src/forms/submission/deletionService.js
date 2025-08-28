const log = require('../../components/log')(module.filename);
const { FormSubmission, FormVersion, Form } = require('../common/models');

/**
 * Service for managing hard deletion of form submissions based on retention policies
 */
const deletionService = {
  /**
   * Process submissions for hard deletion based on form retention policies
   * @param {Object} options - Configuration options
   * @param {string} options.mode - Determines what date to use for retention calculation
   * @param {boolean} options.forceProcess - Override time checks and process all eligible submissions
   * @param {string[]} options.submissionIds - Optional list of specific submission IDs to process
   * @returns {Object} Result with processed and deleted counts
   */
  processHardDeletions: async (options = {}) => {
    const { mode = 'deletion', forceProcess = false, submissionIds = null } = options;

    let processed = 0;
    let deleted = 0;

    try {
      // Step 1: Get deleted submissions
      let query = FormSubmission.query().where('deleted', true);

      // If specific submission IDs are provided, only process those
      if (submissionIds && Array.isArray(submissionIds) && submissionIds.length > 0) {
        query = query.whereIn('id', submissionIds);
      }

      const deletedSubmissions = await query.select('id');

      // Step 2: Process each submission to find candidates with retention policies
      const candidates = [];

      for (const submission of deletedSubmissions) {
        try {
          // Get full submission data
          const fullSubmission = await FormSubmission.query().findById(submission.id);
          if (!fullSubmission.formVersionId) continue;

          // Get the form version
          const version = await FormVersion.query().findById(fullSubmission.formVersionId).select('id', 'formId');
          if (!version || !version.formId) continue;

          // Get the form with retention settings
          const form = await Form.query().findById(version.formId).select('id', 'name', 'retentionDays', 'classificationType');
          if (!form || !form.retentionDays) continue;

          candidates.push({
            submission: fullSubmission,
            form: form,
          });
        } catch (error) {
          log.error(`Error analyzing submission ${submission.id}: ${error.message}`);
        }
      }

      // For each candidate, check if the retention period has passed
      const now = new Date();

      for (const candidate of candidates) {
        try {
          const { submission, form } = candidate;

          // Calculate when the retention period expires based on selected mode
          let referenceDate;
          if (mode === 'creation') {
            referenceDate = new Date(submission.createdAt);
          } else {
            // default to 'deletion'
            referenceDate = new Date(submission.updatedAt);
          }

          const retentionMs = form.retentionDays * 24 * 60 * 60 * 1000;
          const deletionDueDate = new Date(referenceDate.getTime() + retentionMs);
          const shouldDelete = forceProcess || now >= deletionDueDate;

          if (shouldDelete) {
            // Retention period has passed (or force process) - permanently delete the submission
            try {
              // Delete the submission and all related records
              const result = await deletionService.deleteSubmissionAndRelatedData(submission.id);

              if (result.success) {
                deleted++;
              } else {
                log.error(`Failed to delete submission ${submission.id}: ${result.error}`);
              }
            } catch (deleteError) {
              log.error(`Error in deletion process for submission ${submission.id}: ${deleteError.message}`);
            }
          } else {
            processed++;
          }
        } catch (error) {
          log.error(`Error processing submission ${candidate.submission.id}: ${error.message}`);
        }
      }

      processed += deleted;

      return { processed, deleted };
    } catch (error) {
      log.error(`Error processing hard deletions: ${error.message}`);
      return { processed: 0, deleted: 0, error: error.message };
    }
  },

  /**
   * Delete a submission and all its related data
   *
   * @param {string} submissionId - The ID of the submission to delete
   * @returns {Object} Result indicating success or failure
   */
  deleteSubmissionAndRelatedData: async (submissionId) => {
    try {
      const knex = FormSubmission.knex();

      return await knex.transaction(async (trx) => {
        // Delete in the correct order based on foreign key dependencies

        // 1. Delete notes
        await trx('note').where('submissionId', submissionId).delete();

        // 2. Delete status records
        await trx('form_submission_status').where('submissionId', submissionId).delete();

        // 3. Delete user associations
        await trx('form_submission_user').where('formSubmissionId', submissionId).delete();

        // 4. Delete file records
        await trx('file_storage').where('formSubmissionId', submissionId).delete();

        // 5. Delete the submission record
        const result = await trx('form_submission').where('id', submissionId).delete();
        return { success: result > 0 };
      });
    } catch (error) {
      log.error(`Error deleting submission ${submissionId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  /**
   * Force hard deletion of specific submissions, bypassing retention period checks
   *
   * @param {string[]} submissionIds - Array of submission IDs to delete
   * @returns {Object} Result with processed and deleted counts
   */
  forceHardDelete: async (submissionIds) => {
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return { processed: 0, deleted: 0, error: 'No submission IDs provided' };
    }

    return deletionService.processHardDeletions({
      submissionIds: submissionIds,
      forceProcess: true,
    });
  },

  /**
   * Diagnostic function to analyze a specific submission's deletion eligibility
   * @param {string} submissionId - ID of the submission to analyze
   * @returns {Object} Analysis of the submission's deletion eligibility
   */
  analyzeSubmissionRetention: async (submissionId) => {
    try {
      if (!submissionId) {
        return { error: 'No submission ID provided' };
      }

      // Get submission data
      const submission = await FormSubmission.query().findById(submissionId);
      if (!submission) {
        return { error: `Submission ${submissionId} not found` };
      }

      // Get form version
      const version = await FormVersion.query().findById(submission.formVersionId);
      if (!version) {
        return { error: `Form version ${submission.formVersionId} not found` };
      }

      // Get form
      const form = await Form.query().findById(version.formId);
      if (!form) {
        return { error: `Form ${version.formId} not found` };
      }

      const now = new Date();
      const createdAt = new Date(submission.createdAt);
      const updatedAt = new Date(submission.updatedAt);
      const retentionDays = form.retentionDays || 0;
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

      // Calculate expiration dates for both modes
      const deletionExpiration = new Date(updatedAt.getTime() + retentionMs);
      const creationExpiration = new Date(createdAt.getTime() + retentionMs);

      // Check if deletion would happen under each mode
      const deletionModeWouldDelete = now >= deletionExpiration;
      const creationModeWouldDelete = now >= creationExpiration;

      // Calculate days remaining
      const msPerDay = 24 * 60 * 60 * 1000;
      const deletionDaysRemaining = Math.ceil((deletionExpiration - now) / msPerDay);
      const creationDaysRemaining = Math.ceil((creationExpiration - now) / msPerDay);

      return {
        submission: {
          id: submission.id,
          deleted: submission.deleted,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
        },
        form: {
          id: form.id,
          name: form.name,
          retentionDays: retentionDays,
        },
        analysis: {
          currentTime: now.toISOString(),
          deletionMode: {
            referenceDate: updatedAt.toISOString(),
            expirationDate: deletionExpiration.toISOString(),
            daysRemaining: deletionDaysRemaining,
            wouldDelete: deletionModeWouldDelete,
          },
          creationMode: {
            referenceDate: createdAt.toISOString(),
            expirationDate: creationExpiration.toISOString(),
            daysRemaining: creationDaysRemaining,
            wouldDelete: creationModeWouldDelete,
          },
        },
      };
    } catch (error) {
      log.error(`Error analyzing submission retention: ${error.message}`);
      return { error: error.message };
    }
  },
};

module.exports = deletionService;
