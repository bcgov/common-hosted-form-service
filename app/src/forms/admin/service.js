const { Form, FormApiKey, User, UserFormAccess } = require('../common/models');
const { queryUtils } = require('../common/utils');

const service = {

  //
  // Forms
  //

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

  readForm: async (formId) => {
    return Form.query()
      .findById(formId)
      .throwIfNotFound();
  },

  // Get the current key for a form
  readApiKey: (formId) => {
    return FormApiKey.query()
      .modify('filterFormId', formId)
      .first();
  },

  restoreForm: async (formId) => {
    let trx;
    try {
      const obj = await service.readForm(formId);
      trx = await Form.startTransaction();
      const upd = {
        active: true,
        updatedBy: 'ADMIN'
      };

      await Form.query(trx).patchAndFetchById(formId, upd);

      await trx.commit();
      const result = await service.readForm(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  //
  // Users
  //

  getUsers: async (params) => {
    return User.query()
      .skipUndefined()
      .modify('filterUsername', params.username)
      .modify('filterFirstName', params.firstName)
      .modify('filterLastName', params.lastName)
      .modify('filterEmail', params.email)
      .modify('orderLastFirstAscending');
  },

  getFormUserRoles: async (params) => {
    const accessItems = await UserFormAccess.query()
      .skipUndefined()
      .modify('filterFormId', params.formId)
      .modify('filterFormName', params.formName)
      .modify('orderDefault');
    // do a quick transform into a simple structure...
    const formIds = [...new Set(accessItems.map(x => x.formId))];
    const results = formIds.map(formId => {
      // grab all users that have roles on this form...
      const users = [...new Set(accessItems.filter(x => x.formId === formId && x.roles.length))];
      const form = accessItems.find(x => x.formId === formId);
      const userRoles = users.map(x => ({ userId: x.userId, username: x.username, roles: x.roles }));
      return {
        formId: formId,
        formName: form.formName,
        users: userRoles
      };
    });

    return results;
  }
};

module.exports = service;
