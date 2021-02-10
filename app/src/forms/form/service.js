const { FileStorage, Form, FormIdentityProvider, FormRoleUser, FormVersion, FormVersionDraft, FormStatusCode, FormSubmission, FormSubmissionStatus, FormSubmissionUser, IdentityProvider, SubmissionMetadata } = require('../common/models');
const { falsey, queryUtils } = require('../common/utils');

const Permissions = require('../common/constants').Permissions;
const Roles = require('../common/constants').Roles;
const Rolenames = [Roles.OWNER, Roles.TEAM_MANAGER, Roles.FORM_DESIGNER, Roles.SUBMISSION_REVIEWER, Roles.FORM_SUBMITTER];
const Statuses = require('../common/constants').Statuses;

const Problem = require('api-problem');
const { transaction } = require('objection');
const { v4: uuidv4 } = require('uuid');

const service = {

  listForms: async (params) => {
    params = queryUtils.defaultActiveOnly(params);
    return Form.query()
      .skipUndefined()
      .modify('filterActive', params.active)
      .allowGraph('[identityProviders,versions]')
      .withGraphFetched('identityProviders(orderDefault)')
      .withGraphFetched('versions(selectWithoutSchema, orderVersionDescending)')
      .modify('orderNameAscending');
  },

  createForm: async (data, currentUser) => {
    let trx;
    try {
      trx = await transaction.start(Form.knex());
      const obj = {};
      obj.id = uuidv4();
      obj.name = data.name;
      obj.description = data.description;
      obj.active = true;
      obj.labels = data.labels;
      obj.showSubmissionConfirmation = data.showSubmissionConfirmation;
      obj.submissionReceivedEmails = data.submissionReceivedEmails;
      obj.enableStatusUpdates = data.enableStatusUpdates;
      obj.createdBy = currentUser.username;

      await Form.query(trx).insert(obj);
      if (data.identityProviders && Array.isArray(data.identityProviders) && data.identityProviders.length) {
        const fips = [];
        for (const p of data.identityProviders) {
          const exists = await IdentityProvider.query(trx).where('code', p.code).where('active', true).first();
          if (!exists) {
            throw new Problem(422, `${p.code} is not a valid Identity Provider code`);
          }
          fips.push({ id: uuidv4(), formId: obj.id, code: p.code, createdBy: currentUser.username });
        }
        await FormIdentityProvider.query(trx).insert(fips);
      }
      // make this user have ALL the roles...
      const userRoles = Rolenames.map(r => {
        return { id: uuidv4(), createdBy: currentUser.username, userId: currentUser.id, formId: obj.id, role: r };
      });
      await FormRoleUser.query(trx).insert(userRoles);

      // create a unpublished draft
      const draft = {
        id: uuidv4(),
        formId: obj.id,
        createdBy: currentUser.username,
        schema: data.schema
      };
      await FormVersionDraft.query(trx).insert(draft);

      // Map the status codes to the form
      // TODO: this is hardcoded to the default submitted->assigned->complete for now
      // We could make this more dynamic and settable by the user if that feature is required
      const defaultStatuses = [
        { id: uuidv4(), formId: obj.id, code: Statuses.SUBMITTED, createdBy: currentUser.username },
        { id: uuidv4(), formId: obj.id, code: Statuses.ASSIGNED, createdBy: currentUser.username },
        { id: uuidv4(), formId: obj.id, code: Statuses.COMPLETED, createdBy: currentUser.username }
      ];
      await FormStatusCode.query(trx).insert(defaultStatuses);

      await trx.commit();
      const result = await service.readForm(obj.id);
      result.draft = draft;
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  updateForm: async (formId, data, currentUser) => {
    let trx;
    try {
      const obj = await service.readForm(formId);
      trx = await transaction.start(Form.knex());
      // do not update the active flag, that should be done via DELETE
      const upd = {
        name: data.name,
        description: data.description,
        labels: data.labels ? data.labels : [],
        showSubmissionConfirmation: data.showSubmissionConfirmation,
        submissionReceivedEmails: data.submissionReceivedEmails ? data.submissionReceivedEmails : [],
        enableStatusUpdates: data.enableStatusUpdates,
        updatedBy: currentUser.username
      };

      await Form.query(trx).patchAndFetchById(formId, upd);

      // remove any existing links to identity providers, and the updated ones
      await FormIdentityProvider.query(trx).delete().where('formId', obj.id);
      await FormIdentityProvider.query(trx).insert(data.identityProviders.map(p => { return { id: uuidv4(), formId: obj.id, code: p.code, createdBy: currentUser.username }; }));

      await trx.commit();
      const result = await service.readForm(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  deleteForm: async (formId, params, currentUser) => {
    let trx;
    try {
      const obj = await service.readForm(formId);
      trx = await transaction.start(Form.knex());
      // for now, only handle a soft delete, we could pass in a param to do a hard delete later
      await Form.query(trx).patchAndFetchById(formId, { active: false, updatedBy: currentUser.username });

      await trx.commit();
      return await service.readForm(obj.id, { active: false });
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readForm: async (formId, params = {}) => {
    params = queryUtils.defaultActiveOnly(params);
    return Form.query()
      .findById(formId)
      .modify('filterActive', params.active)
      .allowGraph('[identityProviders,versions]')
      .withGraphFetched('identityProviders(orderDefault)')
      .withGraphFetched('versions(selectWithoutSchema, orderVersionDescending)')
      .throwIfNotFound();
  },

  readPublishedForm: async (formId, params = {}) => {
    params = queryUtils.defaultActiveOnly(params);
    const form = await Form.query()
      .findById(formId)
      .modify('filterActive', params.active)
      .allowGraph('[identityProviders,versions]')
      .withGraphFetched('identityProviders(orderDefault)')
      .withGraphFetched('versions(onlyPublished)')
      .throwIfNotFound();

    // there are some configs that we don't want returned here...
    delete form.submissionReceivedEmails;
    return form;
  },

  listFormSubmissions: async (formId, params) => {
    await service.readForm(formId, queryUtils.defaultActiveOnly(params));
    return SubmissionMetadata.query()
      .where('formId', formId)
      .modify('filterSubmissionId', params.submissionId)
      .modify('filterConfirmationId', params.confirmationId)
      .modify('filterDraft', params.draft)
      .modify('filterDeleted', params.deleted)
      .modify('filterCreatedBy', params.createdBy)
      .modify('filterFormVersionId', params.formVersionId)
      .modify('filterVersion', params.version)
      .modify('orderDefault');
  },

  listVersions: async (formId, params) => {
    await service.readForm(formId, queryUtils.defaultActiveOnly(params));
    return FormVersion.query()
      .where('formId', formId)
      .modify('filterPublished', params.published)
      .modify('orderVersionDescending')
      .modify('selectWithoutSchema');
  },

  publishVersion: async (formId, formVersionId, params = {}, currentUser) => {
    let trx;
    try {
      // allow an unpublish if they pass in unpublish parameter with an affirmative
      const publish = params.unpublish ? falsey(params.unpublish) : true;
      const form = await service.readForm(formId);
      trx = await transaction.start(FormVersion.knex());

      await FormVersion.query(trx)
        .patch({
          published: false,
          updatedBy: currentUser.username
        })
        .where('formId', form.id)
        .where('published', publish);

      await FormVersion.query(trx)
        .findById(formVersionId)
        .patch({
          published: publish,
          updatedBy: currentUser.username
        });

      await trx.commit();

      // return the published form/version...
      return await service.readPublishedForm(formId);

    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readVersion: async (formVersionId) => {
    return FormVersion.query()
      .findById(formVersionId)
      .throwIfNotFound();
  },

  listSubmissions: async (formVersionId) => {
    return FormSubmission.query()
      .where('formVersionId', formVersionId)
      .modify('orderDescending');
  },

  createSubmission: async (formVersionId, data, currentUser) => {
    let trx;
    try {
      const formVersion = await service.readVersion(formVersionId);
      trx = await transaction.start(FormSubmission.knex());

      const obj = Object.assign({}, data);
      obj.id = uuidv4();
      obj.formVersionId = formVersion.id;
      obj.confirmationId = obj.id.substring(0, 8).toUpperCase();
      obj.createdBy = currentUser.username;

      await FormSubmission.query(trx).insert(obj);

      if (!currentUser.public) {
        // add specific permissions to this submission...
        // this is the submission creator, we will know by having the submission_create permission...
        const items = [
          { id: uuidv4(), userId: currentUser.id, formSubmissionId: obj.id, permission: Permissions.SUBMISSION_CREATE, createdBy: currentUser.username },
          { id: uuidv4(), userId: currentUser.id, formSubmissionId: obj.id, permission: Permissions.SUBMISSION_DELETE, createdBy: currentUser.username },
          { id: uuidv4(), userId: currentUser.id, formSubmissionId: obj.id, permission: Permissions.SUBMISSION_READ, createdBy: currentUser.username },
          { id: uuidv4(), userId: currentUser.id, formSubmissionId: obj.id, permission: Permissions.SUBMISSION_UPDATE, createdBy: currentUser.username },
        ];
        await FormSubmissionUser.query(trx).insert(items);
      }

      // Add a SUBMITTED status
      const stObj = {};
      stObj.id = uuidv4();
      stObj.submissionId = obj.id;
      stObj.code = Statuses.SUBMITTED;
      stObj.createdBy = currentUser.username;

      await FormSubmissionStatus.query(trx).insert(stObj);

      // does this submission contain any file uploads?
      // if so, we need to update the file storage records.
      // use the schema to determine if there are uploads, fetch the ids from the submission data...
      const fileIds = formVersion.schema.components
        .filter(x => x.type === 'simplefile')
        .flatMap(x => data.submission.data[x.key])
        .map(x => x.data.id);

      for (const fileId of fileIds) {
        await FileStorage.query(trx).patchAndFetchById(fileId, { formSubmissionId: obj.id, updatedBy: currentUser.username });
      }

      await trx.commit();
      const result = await service.readSubmission(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  updateSubmission: async (formSubmissionId, data, currentUser) => {
    let trx;
    try {
      const obj = await service.readSubmission(formSubmissionId);
      trx = await transaction.start(FormSubmission.knex());

      // TODO: check if we can update this submission
      // TODO: we may have to update permissions for users (draft = false, then no delete?)
      // TODO: deal with attachments?

      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, { draft: data.draft, submission: data.submission, updatedBy: currentUser.username });
      await trx.commit();
      const result = await service.readSubmission(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readSubmission: async (id) => {
    return FormSubmission.query()
      .findById(id)
      .throwIfNotFound();
  },

  listDrafts: async (formId, params) => {
    await service.readForm(formId, queryUtils.defaultActiveOnly(params));
    return FormVersionDraft.query()
      .where('formId', formId)
      .modify('filterFormVersionId', params.formVersionId)
      .modify('orderDescending');
  },

  createDraft: async (formId, data, currentUser) => {
    let trx;
    try {
      const form = await service.readForm(formId);
      trx = await transaction.start(FormVersionDraft.knex());

      // data.schema, maybe data.formVersionId
      const obj = Object.assign({}, data);
      obj.id = uuidv4();
      obj.formId = form.id;
      obj.createdBy = currentUser.username;

      await FormVersionDraft.query(trx).insert(obj);
      await trx.commit();
      const result = await service.readDraft(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  updateDraft: async (formVersionDraftId, data, currentUser) => {
    let trx;
    try {
      const obj = await service.readDraft(formVersionDraftId);
      trx = await transaction.start(FormVersionDraft.knex());
      await FormVersionDraft.query(trx).patchAndFetchById(formVersionDraftId, {
        schema: data.schema,
        formVersionId: data.formVersionId,
        updatedBy: currentUser.username
      });
      await trx.commit();
      return await service.readDraft(obj.id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readDraft: async (formVersionDraftId) => {
    return FormVersionDraft.query()
      .findById(formVersionDraftId)
      .throwIfNotFound();
  },

  deleteDraft: async (formVersionDraftId) => {
    return FormVersionDraft.query()
      .deleteById(formVersionDraftId)
      .throwIfNotFound();
  },

  publishDraft: async (formId, formVersionDraftId, currentUser) => {
    let trx;
    try {
      const form = await service.readForm(formId);
      const draft = await service.readDraft(formVersionDraftId);
      trx = await transaction.start(FormVersionDraft.knex());

      const version = {
        id: uuidv4(),
        formId: form.id,
        version: form.versions.length ? form.versions[0].version + 1 : 1,
        createdBy: currentUser.username,
        schema: draft.schema,
        published: true
      };

      // this is where we create change the version data.
      // mark all published as not published.
      await FormVersion.query(trx)
        .patch({ published: false })
        .where('formId', form.id);

      // add a record using this schema, mark as published and increment the version number
      await FormVersion.query(trx).insert(version);

      // delete the draft...
      await FormVersionDraft.query().deleteById(formVersionDraftId);
      await trx.commit();

      // return the published version...
      return await service.readVersion(version.id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  getStatusCodes: async (formId) => {
    return FormStatusCode.query()
      .withGraphFetched('statusCode')
      .where('formId', formId);
  },

};

module.exports = service;
