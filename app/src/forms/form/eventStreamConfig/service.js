const Problem = require('api-problem');

const { v4: uuidv4 } = require('uuid');

const { FormEventStreamConfig } = require('../../common/models');

const service = {
  validateEventStreamConfig: (data) => {
    if (!data) {
      throw new Problem(422, `'EventStreamConfig record' cannot be empty.`);
    }
  },

  createEventStreamConfig: async (formId, data, currentUser) => {
    service.validateEventStreamConfig(data);

    const existing = await FormEventStreamConfig.query().modify('filterFormId', formId).first();
    if (existing) {
      // if found throw error? or just update?
    }

    data.id = uuidv4();
    await FormEventStreamConfig.query().insert({
      ...data,
      createdBy: currentUser.usernameIdp,
    });

    return FormEventStreamConfig.query().findById(data.id);
  },

  updateEventStreamConfig: async (formId, data, currentUser) => {
    service.validateExternalAPI(data);

    const existing = await FormEventStreamConfig.query().modify('filterFormId', formId).first().throwIfNotFound();
    // compare to see if we are actually updating any attributes.
    await FormEventStreamConfig.query()
      .findById(existing.id)
      .update({
        ...data,
        updatedBy: currentUser.usernameIdp,
      });

    return FormEventStreamConfig.query().findById(existing.id);
  },

  deleteEventStreamConfig: async (formId) => {
    const existing = await FormEventStreamConfig.query().modify('filterFormId', formId).first().throwIfNotFound();
    await FormEventStreamConfig.query().deleteById(existing.id);
  },

  readEventStreamConfig: (formId) => {
    return FormEventStreamConfig.query().modify('findByFormId', formId).first().throwIfNotFound();
  },
};

module.exports = service;
