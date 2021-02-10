const { Form, FormVersion, FormSubmission, FormSubmissionStatus, FormSubmissionUserPermissions, Note, SubmissionMetadata, UserFormAccess } = require('../common/models');

const Permissions = require('../common/constants').Permissions;

const Problem = require('api-problem');
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

  read: async (formSubmissionId, currentUser, permissions = [Permissions.SUBMISSION_READ]) => {
    const result = await service._fetchSubmissionData(formSubmissionId);

    const checkFormSubmissionsPermission = async () => {
      if (currentUser.public) return false;
      return UserFormAccess.query()
        .modify('filterFormId', result.form.id)
        .modify('filterUserId', currentUser.id)
        .modify('filterByAccess', null, null, permissions)
        .first();
    };

    const checkSubmissionPermission = async () => {
      if (currentUser.public) return false;
      return FormSubmissionUserPermissions.query()
        .modify('filterSubmissionId', formSubmissionId)
        .modify('filterUserId', currentUser.id)
        .modify('filterByPermissions', permissions)
        .first();
    };

    const isDeleted = result.submission.deleted;
    const isDraft = result.submission.draft;
    const publicAllowed = result.form.identityProviders.find(p => p.code === 'public') !== undefined;
    const idpAllowed = result.form.identityProviders.find(p => p.code === currentUser.idp) !== undefined;

    // check against the public and user's identity provider permissions...
    if (!isDraft && !isDeleted) {
      if (publicAllowed || idpAllowed) return result;
    }

    // check against the form level permissions assigned to the user...
    const formSubmissionsPermission = await checkFormSubmissionsPermission();
    if (!isDeleted && formSubmissionsPermission) return result;

    // check against the submission level permissions assigned to the user...
    const submissionPermission = await checkSubmissionPermission();
    if (submissionPermission) return result;

    // no access to this submission...

    throw new Problem(401, 'You do not have access to this submission.');
  },

  update: async (formSubmissionId, data, currentUser) => {
    let trx;
    try {
      await service.read(formSubmissionId, currentUser, [Permissions.SUBMISSION_UPDATE]);

      trx = await transaction.start(FormSubmission.knex());

      // TODO: check if we can update this submission
      // TODO: we may have to update permissions for users (draft = false, then no delete?)

      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, { draft: data.draft, submission: data.submission, updatedBy: currentUser.username });
      await trx.commit();
      const result = await service.read(formSubmissionId);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }

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
      obj.assignedTo = data.assignedTo;
      obj.assignedToEmail = data.assignedToEmail;
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
      .modify('orderDescending');
  },

  // Add a status history for a specific submission
  createStatus: async (formSubmissionId, data, currentUser) => {
    return await service._createSubmissionStatus(formSubmissionId, data, currentUser);
  },
  // -------------------------------------------------------------------------------------------------/Notes
};

module.exports = service;
