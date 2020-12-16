const { Form, FormRoleUser, User, UserFormAccess } = require('../common/models');
const { queryUtils } = require('../common/utils');

const { transaction } = require('objection');
const { v4: uuidv4 } = require('uuid');

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
  readForm: async (formId, params = {}) => {
    params = queryUtils.defaultActiveOnly(params);
    return Form.query()
      .findById(formId)
      .modify('filterActive', params.active)
      .throwIfNotFound();
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
      const userRoles = users.map(x => { return { userId: x.userId, username: x.username, roles: x.roles }; });
      return {
        formId: formId,
        formName: form.formName,
        users: userRoles
      };
    });

    return results;
  },

  setFormUserRoles: async (params, data, currentUser) => {
    let trx;
    try {
      trx = await transaction.start(FormRoleUser.knex());
      if (!Array.isArray(data)) {
        data = [data];
      }

      // clear out all user/roles for the specified forms...
      for (const f of data) {
        await FormRoleUser.query()
          .skipUndefined()
          .delete()
          .where('formId', f.formId);
      }

      // build the form/ user/ roles...
      const formUserRoles = [];
      data.forEach(f => {
        f.users.forEach(u => {
          u.roles.forEach(r => {
            formUserRoles.push({ id: uuidv4(), createdBy: currentUser.username, formId: f.formId, userId: u.userId, role: r });
          });
        });
      });
      // now add in the specified user/roles...
      await FormRoleUser.query().insert(formUserRoles);
      await trx.commit();
      return service.getFormUserRoles(params);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

};

module.exports = service;
