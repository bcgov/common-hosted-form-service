const { Permissions, Statuses } = require('../common/constants');
const { Form, FormVersion, FormSubmission, FormSubmissionStatus, FormSubmissionUser, Note, SubmissionAudit, SubmissionMetadata } = require('../common/models');

const { transaction } = require('objection');
const { v4: uuidv4 } = require('uuid');

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

  update: async (formSubmissionId, data, currentUser) => {
    let trx;
    try {
      trx = await transaction.start(FormSubmission.knex());

      // Patch the submission record with the updated changes
      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, { draft: data.draft, submission: data.submission, updatedBy: currentUser.username });

      if (!data.draft) {
        // If there is not a submission status here already (IE we're taking a non-submitted, like a draft, and finalizing to submitted state)
        // Write a SUBMITTED status
        const statuses = await FormSubmissionStatus.query()
          .modify('filterSubmissionId', formSubmissionId);
        if (!statuses || !statuses.length) {
          await service._createSubmissionStatus(formSubmissionId, { code: Statuses.SUBMITTED }, currentUser);
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
      trx = await transaction.start(FormSubmission.knex());

      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, { deleted: true, updatedBy: currentUser.username });
      await trx.commit();
      const result = await service.read(formSubmissionId);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }

  },

  // get the audit history metadata
  listEdits: async (submissionId) => {
    return SubmissionAudit.query()
      .select('id', 'updatedByUsername', 'actionTimestamp', 'action')
      .where('submissionId', submissionId)
      .modify('orderDefault');
  },
  // --------------------------------------------------------------------------------------------/Submissions

  // -------------------------------------------------------------------------------------------------------
  // Notes
  // -------------------------------------------------------------------------------------------------------
  _createNote: async (submissionId, data, currentUser) => {
    let trx;
    try {
      trx = await transaction.start(Note.knex());
      const obj = {};
      obj.id = uuidv4();
      obj.submissionId = submissionId;
      obj.submissionStatusId = data.submissionStatusId;
      obj.note = data.note;
      obj.userId = data.userId;
      obj.createdBy = currentUser.username;

      await Note.query(trx).insert(obj);

      await trx.commit();
      const result = await service.getNote(obj.id);
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
      trx = await transaction.start(FormSubmissionStatus.knex());
      const obj = {};
      obj.id = uuidv4();
      obj.submissionId = submissionId;
      obj.code = data.code;
      obj.assignedToUserId = data.assignedToUserId;
      obj.actionDate = data.actionDate;
      obj.createdBy = currentUser.username;

      await FormSubmissionStatus.query(trx).insert(obj);

      await trx.commit();
      const result = await service.getStatus(submissionId);
      return result;
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
