const { FormRoleUser, IdentityProvider, User, UserFormAccess } = require('../common/models');

const {transaction} = require('objection');
const {v4: uuidv4} = require('uuid');

const authService = require('../auth/service');

const service = {

  list: async () => {
    return FormRoleUser.query()
      .allowGraph('[form, role, user]')
      .withGraphFetched('[form, role, user]')
      .modify('orderCreatedAtDescending');
  },

  create: async (data) => {
    let trx;
    try {
      trx = await transaction.start(FormRoleUser.knex());

      const obj = Object.assign({}, data);
      obj.id = uuidv4();

      await FormRoleUser.query(trx).insert(obj);
      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  update: async (id, data) => {
    let trx;
    try {
      const obj = await service.read(id);
      trx = await transaction.start(FormRoleUser.knex());

      const update = {
        formId: data.formId,
        role: data.role,
        userId: data.userId};

      await FormRoleUser.query(trx).patchAndFetchById(obj.id, update);
      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  read: async (id) => {
    return FormRoleUser.query()
      .findById(id)
      .allowGraph('[form, role, user]')
      .withGraphFetched('[form, role, user]')
      .throwIfNotFound();
  },

  delete: async (id) => {
    return FormRoleUser.query()
      .deleteById(id)
      .throwIfNotFound();
  },

  createUser: async (data) => {
    let trx;
    try {
      trx = await transaction.start(User.knex());

      const obj = Object.assign({}, data);
      obj.id = uuidv4();

      await User.query(trx).insert(obj);
      await trx.commit();
      const result = await service.read(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readUser: async (id) => {
    return User.query()
      .findById(id)
      .throwIfNotFound();
  },

  updateUser: async (id, data) => {
    let trx;
    try {
      const obj = await service.readUser(id);
      trx = await transaction.start(User.knex());

      const update = {
        keycloakId: data.keycloakId,
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName};

      await User.query(trx).patchAndFetchById(obj.id, update);
      await trx.commit();
      const result = await service.readUser(id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  getCurrentUser: async (currentUser, params) => {
    const user = Object.assign({}, currentUser);
    const accessLevels = [];
    if (user.public) {
      accessLevels.push('public');
    } else {
      if (params.public) accessLevels.push('public');
      if (params.idp) accessLevels.push('idp');
      if (params.team) accessLevels.push('team');
    }
    const filteredForms = authService.filterForms(user, user.forms, accessLevels);
    user.forms = filteredForms;
    return user;
  },

  getFormUsers: async (params) => {
    const items = await UserFormAccess.query()
      .skipUndefined()
      .modify('filterUserId', params.userId)
      .modify('filterKeycloakId', params.keycloakId)
      .modify('filterUsername', params.username)
      .modify('filterFullName', params.fullName)
      .modify('filterFirstName', params.firstName)
      .modify('filterLastName', params.lastName)
      .modify('filterEmail', params.email)
      .modify('filterFormId', params.formId)
      .modify('filterFormName', params.formName)
      .modify('filterActive', params.active)
      .modify('filterByAccess', params.idps, params.roles, params.permissions)
      .modify('orderDefault');
    return items;//Transformer.toFormAccess(items);
  },

  getUserForms: async (params) => {
    const items = await UserFormAccess.query()
      .skipUndefined()
      .modify('filterUserId', params.userId)
      .modify('filterKeycloakId', params.keycloakId)
      .modify('filterUsername', params.username)
      .modify('filterFullName', params.fullName)
      .modify('filterFirstName', params.firstName)
      .modify('filterLastName', params.lastName)
      .modify('filterEmail', params.email)
      .modify('filterFormId', params.formId)
      .modify('filterFormName', params.formName)
      .modify('filterActive', params.active)
      .modify('filterByAccess', params.idps, params.roles, params.permissions)
      .modify('orderDefault');

    return items;//Transformer.toUserAccess(items);
  },

  setFormUsers: async (formId, userId, data) => {
    // check this in middleware? 422 in valid params
    if (!formId || 0 === formId.length) {
      throw new Error();
    }

    let trx;
    try {
      trx = await transaction.start(FormRoleUser.knex());
      // remove existing mappings...
      await FormRoleUser.query()
        .skipUndefined()
        .delete()
        .where('formId', formId)
        .where('userId', userId);

      // create the batch and insert...
      if (!Array.isArray(data)) {
        data = [data];
      }
      // remove any data that isn't for this form...
      data = data.filter(d => d.formId === formId);
      if (userId && userId.length) {
        data = data.filter(d => d.userId === userId);
      }
      // add an id and save them
      const items = data.map(d => { return {id: uuidv4(), ...d}; });
      await FormRoleUser.query().insert(items);

      return service.getFormUsers({userId: userId, formId: formId});
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  setUserForms: async (userId, formId, data) => {
    // check this in middleware? 422 in valid params
    if (!userId || 0 === userId.length) {
      throw new Error();
    }

    let trx;
    try {
      trx = await transaction.start(FormRoleUser.knex());
      // remove existing mappings...
      await FormRoleUser.query()
        .skipUndefined()
        .delete()
        .where('userId', userId)
        .where('formId', formId);

      // create the batch and insert...
      if (!Array.isArray(data)) {
        data = [data];
      }
      // remove any data that isn't for this userId...
      data = data.filter(d => d.userId === userId);
      if (formId && formId.length) {
        data = data.filter(d => d.formId === formId);
      }
      // add an id and save them
      const items = data.map(d => { return {id: uuidv4(), ...d}; });
      await FormRoleUser.query().insert(items);

      // return the new mappings
      const result = await service.getUserForms({userId: userId, formId: formId});
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  getIdentityProviders: async (params) => {
    return IdentityProvider.query()
      .skipUndefined()
      .modify('filterActive', params.active)
      .modify('orderDefault');
  }

};

module.exports = service;
