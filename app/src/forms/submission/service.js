const { Form, FormVersion, FormSubmission, FormSubmissionUserPermissions, SubmissionMetadata, UserFormAccess } = require('../common/models');

const Permissions = require('../common/constants').Permissions;

const Problem = require('api-problem');
const {transaction} = require('objection');

const service = {

  _fetchSubmissionData: async(formSubmissionId) => {
    const meta = await SubmissionMetadata.query()
      .where('submissionId', formSubmissionId)
      .first()
      .throwIfNotFound();

    const submission = await FormSubmission.query()
      .findById(meta.submissionId)
      .throwIfNotFound();
    const version = await FormVersion.query()
      .findById(meta.formVersionId)
      .throwIfNotFound();
    const form = await Form.query()
      .findById(meta.formId)
      .allowGraph('identityProviders')
      .withGraphFetched('identityProviders(orderDefault)')
      .throwIfNotFound();

    return {
      form: form,
      version: version,
      submission: submission
    };
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
    const publicAllowed = result.form.identityProviders.find(p => p.code === 'public');
    const idpAllowed = result.form.identityProviders.find(p => p.code === currentUser.idp);
    const formSubmissionsPermission = await checkFormSubmissionsPermission();
    const submissionPermission = await checkSubmissionPermission();

    if (!isDraft && !isDeleted) {
      if (publicAllowed || idpAllowed || formSubmissionsPermission || submissionPermission) return result;
    }
    if (isDraft) {
      if (formSubmissionsPermission || submissionPermission) return result;
    }
    if (isDeleted) {
      if (submissionPermission) return result;
    }
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

      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, {draft: data.draft, submission: data.submission, updatedBy: currentUser.username});
      await trx.commit();
      const result = await service.read(formSubmissionId);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }

  }

};

module.exports = service;
