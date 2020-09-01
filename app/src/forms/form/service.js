const { Form, FormIdentityProvider, FormVersion, FormSubmission } = require('../common/models');

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

  createForm: async (data) => {
    let trx;
    try {
      trx = await transaction.start(Form.knex());

      const obj = {};
      obj.id = uuidv4();
      obj.name = data.name;
      obj.description = data.description;
      obj.active = data.active;
      obj.labels = data.labels;

      await Form.query(trx).insert(obj);
      await FormIdentityProvider.query(trx).insert(data.identityProviders.map(p => { return {id: uuidv4(), formId: obj.id, code: p.code}; }));
      await trx.commit();
      const result = await service.readForm(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  updateForm: async (formId, data) => {
    let trx;
    try {
      const obj = await service.readForm(formId);
      trx = await transaction.start(Form.knex());

      await Form.query(trx).patchAndFetchById(formId, {name: data.name, description: data.description, active: data.active, labels: data.labels});

      // remove any existing links to identity providers, and the updated ones
      await FormIdentityProvider.query(trx).delete().where('formId', obj.id);
      await FormIdentityProvider.query(trx).insert(data.identityProviders.map(p => { return {id: uuidv4(), formId: obj.id, code: p.code}; }));

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
      .throwIfNotFound();
  },

  listVersions: async (formId) => {
    return FormVersion.query()
      .where('formId', formId)
      .modify('orderVersionDescending');
  },

  createVersion: async (formId, data) => {
    let trx;
    try {
      const form = await service.readForm(formId);
      trx = await transaction.start(FormVersion.knex());

      const obj = Object.assign({}, data);
      obj.id =  uuidv4();
      obj.formId = form.id;
      obj.version = form.versions.length ? form.versions[0].version + 1 : 1;

      await FormVersion.query(trx).insert(obj);
      await trx.commit();
      const result = await service.readVersion(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  updateVersion: async (formVersionId, data) => {
    let trx;
    try {
      const obj = await service.readVersion(formVersionId);
      trx = await transaction.start(FormVersion.knex());

      // check if in draft mode?

      await FormVersion.query(trx).patchAndFetchById(formVersionId, {draft: data.draft, schema: data.schema});
      await trx.commit();
      const result = await service.readVersion(obj.id);
      return result;
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

  createSubmission: async (formVersionId, data) => {
    let trx;
    try {
      const formVersion = await service.readVersion(formVersionId);
      trx = await transaction.start(FormSubmission.knex());

      const obj = Object.assign({}, data);
      obj.id = uuidv4();
      obj.formVersionId = formVersion.id;
      obj.confirmationId = obj.id.substring(0, 8).toUpperCase();

      await FormSubmission.query(trx).insert(obj);
      await trx.commit();
      const result = await service.readSubmission(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  updateSubmission: async (formSubmissionId, data) => {
    let trx;
    try {
      const obj = await service.readSubmission(formSubmissionId);
      trx = await transaction.start(FormSubmission.knex());

      // check if in draft mode?

      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, {draft: data.draft, submission: data.submission});
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
