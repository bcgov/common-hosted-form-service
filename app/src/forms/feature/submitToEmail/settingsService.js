const Problem = require('api-problem');
const uuid = require('uuid');
const { FormSubmissionPackageSettings } = require('../../common/models');

const service = {
  // When the feature is enabled on a form, a document template and at least one
  // recipient are required (without them a package job can only ever fail). This
  // is the authoritative server-side guard; the designer UI enforces the same.
  // Email address format is validated by the model jsonSchema on write.
  validate: (data = {}) => {
    if (!data.enabled) return;
    if (!data.templateId) {
      throw new Problem(422, { detail: 'A document template is required when submission package email is enabled.' });
    }
    if (!Array.isArray(data.emails) || data.emails.length === 0) {
      throw new Problem(422, { detail: 'At least one recipient email is required when submission package email is enabled.' });
    }
  },

  initModel: (formId, data = {}) => {
    return {
      id: uuid.v4(),
      formId: formId,
      enabled: !!data.enabled,
      templateId: data.templateId ? data.templateId : null,
      emails: Array.isArray(data.emails) ? data.emails : [],
    };
  },

  read: async (formId) => {
    return FormSubmissionPackageSettings.query().modify('filterFormId', formId).first();
  },

  _insert: async (formId, data, currentUser, transaction) => {
    const rec = service.initModel(formId, data);
    await FormSubmissionPackageSettings.query(transaction).insert({
      ...rec,
      createdBy: currentUser.usernameIdp,
    });
  },

  _update: async (existing, data, currentUser, transaction) => {
    // patch (not update) so Objection does not enforce the full jsonSchema
    // 'required' (e.g. formId) against this partial set of columns.
    await FormSubmissionPackageSettings.query(transaction)
      .findById(existing.id)
      .patch({
        enabled: !!data.enabled,
        templateId: data.templateId ? data.templateId : null,
        emails: Array.isArray(data.emails) ? data.emails : [],
        updatedBy: currentUser.usernameIdp,
      });
  },

  upsert: async (formId, data, currentUser, transaction) => {
    const settings = data ? data : {};
    service.validate(settings);
    const externalTrx = transaction != undefined;
    let trx;
    try {
      trx = externalTrx ? transaction : await FormSubmissionPackageSettings.startTransaction();
      const existing = await service.read(formId);
      if (existing) {
        await service._update(existing, settings, currentUser, transaction);
      } else {
        await service._insert(formId, settings, currentUser, transaction);
      }
      if (!externalTrx) trx.commit();
    } catch (err) {
      if (!externalTrx && trx) await trx.rollback();
      throw err;
    }
    return service.read(formId);
  },
};

module.exports = service;
