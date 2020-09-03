const { PublicFormAccess, User, UserFormAccess } = require('../common/models');

const {transaction} = require('objection');
const {v4: uuidv4} = require('uuid');

const service = {

  createUser: async (data) => {
    let trx;
    try {
      trx = await transaction.start(User.knex());

      const obj = Object.assign({},{
        id: uuidv4(),
        keycloakId: data.keycloakId,
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName});

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

  parseToken: (token) => {
    try {
      // identity_provider_* will be undefined if user login is to local keycloak (userid/password)
      const {
        identity_provider_identity: identity,
        identity_provider: idp,
        preferred_username: username,
        given_name: firstName,
        family_name: lastName,
        sub: keycloakId,
        name: fullName,
        email } = token.content;

      return {
        keycloakId: keycloakId,
        username: identity ? identity : username,
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        email: email,
        idp: idp ? idp : '',
        public: false
      };
    } catch (e) {
      // any issues parsing the token, or if token doesn't exist, return a default "public" user
      return {
        keycloakId: undefined,
        username: 'public',
        firstName: undefined,
        lastName: undefined,
        fullName: 'public',
        email: undefined,
        idp: 'public',
        public: true
      };
    }
  },

  getUserId: async (userInfo) => {
    if (userInfo.public) {
      return Object.assign({}, {...userInfo, id: 'public' });
    }

    const obj = Object.assign({}, userInfo);

    // if this user does not exists, add...
    let user = await User.query()
      .first()
      .where('keycloakId', obj.keycloakId);

    if (!user) {
      // add to the system.
      user = await service.createUser(obj);
    } else {
      // what if name or email changed?
      user = await service.updateUser(user.id, obj);
    }
    // return with the db id...
    return Object.assign({}, {...userInfo, id: user.id });
  },

  getUserForms: async (userInfo, params = {}) => {
    let items = [];
    if (userInfo && userInfo.public) {
      // if the user is 'public', then we can only fetch public accessible forms...
      items = await PublicFormAccess.query()
        .skipUndefined()
        .modify('filterActive', params.active)
        .modify('orderDefault');
      // ignore any passed in accessLevel params, only return public
      return service.filterForms(userInfo, items, ['public']);
    } else {
      // if user has an id, then we fetch whatever forms match the access levels provided...
      items = await UserFormAccess.query()
        .skipUndefined()
        .modify('filterUserId', userInfo.id)
        .modify('filterActive', params.active)
        .modify('orderDefault');
      return service.filterForms(userInfo, items, params.accessLevels);
    }
  },

  filterForms: (userInfo, items, accessLevels = []) => {
    let forms = [];
    if (accessLevels && accessLevels.length) {
      items.forEach(item => {
        let hasPublic = false;
        let hasIdp = false;
        let hasTeam = false;
        let hasElevated = false;
        if (accessLevels.includes('public')) {
          // must have public in form idps and must not have any roles...
          hasPublic = item.idps.includes('public') && !item.roles.length;
        } else if (accessLevels.includes('idp')) {
          // must have user's idp in idps and not have any roles...
          hasIdp = item.idps.includes(userInfo.idp) && !item.roles.length;
        } else if (accessLevels.includes('team')) {
          // must have a role...
          hasTeam = item.roles.length;
        }
        if (hasPublic || hasIdp || hasTeam || hasElevated) {
          forms.push(service.formAccessToForm(item));
        }
      });
    } else {
      forms = items.map(item => service.formAccessToForm(item));
    }
    return forms;
  },

  formAccessToForm: (item) => {
    return {
      formId: item.formId,
      formName: item.formName,
      labels: item.labels,
      idps: item.idps,
      active: item.active,
      formVersionId: item.formVersionId,
      version: item.version,
      roles: item.roles,
      permissions: item.permissions
    };
  },

  login: async (token) => {
    const userInfo = service.parseToken(token);
    const user = await service.getUserId(userInfo);
    const forms = await service.getUserForms(user, {}); // get all forms for user...
    return Object.assign({}, {...user, forms: forms});
  }

};

module.exports = service;
