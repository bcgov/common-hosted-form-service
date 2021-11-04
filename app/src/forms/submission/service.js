const { v4: uuidv4 } = require('uuid');

const { Permissions, Statuses } = require('../common/constants');
const {
  Form,
  FormVersion,
  FormSubmission,
  FormSubmissionStatus,
  FormSubmissionUser,
  Note,
  SubmissionAudit,
  SubmissionMetadata
} = require('../common/models');
const emailService = require('../email/emailService');
const formService = require('../form/service');

const service = {

  // -------------------------------------------------------------------------------------------------------
  // Submissions
  // -------------------------------------------------------------------------------------------------------
  _fetchSubmissionData: async (formSubmissionId) => {
    const meta = await SubmissionMetadata.query()
      .where('submissionId', formSubmissionId)
      .first()
      .throwIfNotFound();

    return await Promise.all([
      FormSubmission.query()
        .findById(meta.submissionId)
        .throwIfNotFound(),
      FormVersion.query()
        .findById(meta.formVersionId)
        .throwIfNotFound(),
      Form.query()
        .findById(meta.formId)
        .allowGraph('identityProviders')
        .withGraphFetched('identityProviders(orderDefault)')
        .throwIfNotFound()
    ]).then(data => {
      return {
        submission: data[0],
        version: data[1],
        form: data[2]
      };
    });
  },

  read: (formSubmissionId) => service._fetchSubmissionData(formSubmissionId),

  update: async (formSubmissionId, data, currentUser, referrer) => {
    let trx;
    try {
      trx = await FormSubmission.startTransaction();

      // Patch the submission record with the updated changes
      const submissionMetaData = await SubmissionMetadata.query().where('submissionId', formSubmissionId).first();
      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, { draft: data.draft, submission: data.submission, updatedBy: currentUser.usernameIdp });

      if (!data.draft) {
        // If there is not a submission status here already (IE we're taking a non-submitted, like a draft, and finalizing to submitted state)
        // Write a SUBMITTED status
        const statuses = await FormSubmissionStatus.query()
          .modify('filterSubmissionId', formSubmissionId);
        if (!statuses || !statuses.length) {
          await service._createSubmissionStatus(formSubmissionId, { code: Statuses.SUBMITTED }, currentUser);
          // If finalizing a draft to submitted, send the submission email (quiet fail if anything goes wrong)
          emailService.submissionReceived(submissionMetaData.formId, formSubmissionId, data, referrer).catch(() => { });
        }

        // If the state is finalized to submitted, then remove permissions that would allow an edit or delete for submitters
        // Danger be here, do not mess up the where clauses
        // (always always always ensure submission id is enforced and you know what KNEX is doing about chaining the where clauses as to if it's making an AND or an OR)
        await FormSubmissionUser.query(trx).delete()
          .where('formSubmissionId', formSubmissionId)
          .whereIn('permission', [Permissions.SUBMISSION_DELETE, Permissions.SUBMISSION_UPDATE]);
      }
      await trx.commit();
      const result = await service.read(formSubmissionId);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }

  },

  delete: async (formSubmissionId, currentUser) => {
    let trx;
    try {
      trx = await FormSubmission.startTransaction();
      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, {
        deleted: true,
        updatedBy: currentUser.usernameIdp
      });
      await trx.commit();
      return await service.read(formSubmissionId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }

  },

  readOptions: async (formSubmissionId) => {
    const meta = await SubmissionMetadata.query()
      .where('submissionId', formSubmissionId)
      .first()
      .throwIfNotFound();

    const form = await formService.readFormOptions(meta.formId);

    return {
      submission: {
        id: meta.submissionId,
        formVersionId: meta.formId
      },
      version: {
        id: meta.formVersionId,
        formId: meta.formId
      },
      form: form
    };
  },

  // get the audit history metadata (nothing that edited a draft for now)
  listEdits: async (submissionId) => {
    return SubmissionAudit.query()
      .select('id', 'updatedByUsername', 'actionTimestamp', 'action')
      .modify('filterSubmissionId', submissionId)
      .modify('filterDraft', false)
      .modify('orderDefault');
  },
  // --------------------------------------------------------------------------------------------/Submissions

  // -------------------------------------------------------------------------------------------------------
  // Notes
  // -------------------------------------------------------------------------------------------------------
  _createNote: async (submissionId, data, currentUser) => {
    let trx;
    try {
      trx = await Note.startTransaction();
      const result = await Note.query(trx).insertAndFetch({
        id: uuidv4(),
        submissionId: submissionId,
        submissionStatusId: data.submissionStatusId,
        note: data.note,
        userId: data.userId,
        createdBy: currentUser.usernameIdp,
      });
      await trx.commit();

      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  // Add a note for a specific submission
  addNote: async (formSubmissionId, data, currentUser) => {
    return await service._createNote(formSubmissionId, data, currentUser);
  },

  // Get notes for a specific submission
  getNotes: async (formSubmissionId) => {
    return await Note.query()
      .modify('filterSubmissionId', formSubmissionId)
      .modify('orderDefault');
  },

  // Get a specific note
  getNote: async (noteId) => {
    return await Note.query()
      .modify('filterId', noteId);
  },
  // -------------------------------------------------------------------------------------------------/Notes


  // -------------------------------------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------------------------------------
  _createSubmissionStatus: async (submissionId, data, currentUser) => {
    let trx;
    try {
      trx = await FormSubmissionStatus.startTransaction();
      await FormSubmissionStatus.query(trx).insert({
        id: uuidv4(),
        submissionId: submissionId,
        code: data.code,
        assignedToUserId: data.assignedToUserId,
        actionDate: data.actionDate,
        createdBy: currentUser.usernameIdp
      });
      await trx.commit();

      return await service.getStatus(submissionId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  // Get status history for a specific submission
  getStatus: async (formSubmissionId) => {
    return await FormSubmissionStatus.query()
      .modify('filterSubmissionId', formSubmissionId)
      .withGraphFetched('user')
      .modify('orderDescending');
  },

  // Add a status history for a specific submission
  createStatus: async (formSubmissionId, data, currentUser) => {
    return await service._createSubmissionStatus(formSubmissionId, data, currentUser);
  },
  // -------------------------------------------------------------------------------------------------/Notes
};

module.exports = service;
