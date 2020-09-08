const { Form, FormIdentityProvider, FormRoleUser, FormVersion, FormSubmission, SubmissionMetadata } = require('../common/models');

const Roles = require('../common/constants').Roles;
const Rolenames = [Roles.OWNER, Roles.TEAM_MANAGER, Roles.FORM_DESIGNER, Roles.SUBMISSION_REVIEWER, Roles.FORM_SUBMITTER];

const {transaction} = require('objection');
const {v4: uuidv4} = require('uuid');

const service = {

  listForms: async () => {
    return Form.query()
      .allowGraph('[identityProviders,versions]')
      .withGraphFetched('identityProviders(orderDefault)')
      .withGraphFetched('versions(orderVersionDescending)')
      .modify('orderNameAscending');
  },

  createForm: async (data, currentUser) => {
    let trx;
    try {
      trx = await transaction.start(Form.knex());
      // TODO: verify name is unique
      const obj = {};
      obj.id = uuidv4();
      obj.name = data.name;
      obj.description = data.description;
      obj.active = data.active;
      obj.labels = data.labels;
      obj.createdBy = currentUser.username;

      await Form.query(trx).insert(obj);
      if (data.identityProviders && Array.isArray(data.identityProviders) && data.identityProviders.length) {
        await FormIdentityProvider.query(trx).insert(data.identityProviders.map(p => { return {id: uuidv4(), formId: obj.id, code: p.code, createdBy: currentUser.username}; }));
      }
      // make this user have ALL the roles...
      const userRoles = Rolenames.map(r => {
        return {id: uuidv4(), createdBy: currentUser.username, userId: currentUser.id, formId: obj.id, role: r};
      });
      await FormRoleUser.query(trx).insert(userRoles);

      // create a default version 1
      const version = {
        id: uuidv4(),
        formId: obj.id,
        version: 1,
        createdBy: currentUser.username,
        schema: data.schema
      };
      await FormVersion.query(trx).insert(version);

      await trx.commit();
      const result = await service.readForm(obj.id);
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
      // TODO: verify name is unique
      await Form.query(trx).patchAndFetchById(formId, {name: data.name, description: data.description, active: data.active, labels: data.labels, updatedBy: currentUser.username});

      // remove any existing links to identity providers, and the updated ones
      await FormIdentityProvider.query(trx).delete().where('formId', obj.id);
      await FormIdentityProvider.query(trx).insert(data.identityProviders.map(p => { return {id: uuidv4(), formId: obj.id, code: p.code, createdBy: currentUser.username}; }));

      await trx.commit();
      const result = await service.readForm(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readForm: async (formId) => {
    return Form.query()
      .findById(formId)
      .allowGraph('[identityProviders,versions]')
      .withGraphFetched('identityProviders(orderDefault)')
      .withGraphFetched('versions(orderVersionDescending)')
      .throwIfNotFound();
  },

  listFormSubmissions: async (formId, params) => {
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

  listVersions: async (formId) => {
    return FormVersion.query()
      .where('formId', formId)
      .modify('orderVersionDescending');
  },

  createVersion: async (formId, data, currentUser) => {
    let trx;
    try {
      const form = await service.readForm(formId);
      trx = await transaction.start(FormVersion.knex());

      const obj = Object.assign({}, data);
      obj.id =  uuidv4();
      obj.formId = form.id;
      obj.version = form.versions.length ? form.versions[0].version + 1 : 1;
      obj.createdBy = currentUser.username;

      await FormVersion.query(trx).insert(obj);
      await trx.commit();
      const result = await service.readVersion(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  updateVersion: async (formVersionId, data, currentUser) => {
    let trx;
    try {
      const obj = await service.readVersion(formVersionId);
      trx = await transaction.start(FormVersion.knex());

      //TODO: check if we can update the version (no submissions)

      await FormVersion.query(trx).patchAndFetchById(formVersionId, {schema: data.schema, updatedBy: currentUser.username});
      await trx.commit();
      return await service.readVersion(obj.id);
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

      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, {draft: data.draft, submission: data.submission, updatedBy: currentUser.username});
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
  }

};

module.exports = service;
