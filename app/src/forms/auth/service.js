const { v4: uuidv4 } = require('uuid');

const { Form, FormSubmissionUserPermissions, PublicFormAccess, SubmissionMetadata, User, UserFormAccess } = require('../common/models');
const { queryUtils } = require('../common/utils');

const FORM_SUBMITTER = require('../common/constants').Permissions.FORM_SUBMITTER;

const service = {
  createUser: async (data) => {
    let trx;
    try {
      trx = await User.startTransaction();

      const obj = {
        id: uuidv4(),
        idpUserId: data.idpUserId,
        keycloakId: data.keycloakId,
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        idpCode: data.idp,
      };

      await User.query(trx).insert(obj);
      await trx.commit();
      const result = await service.readUser(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readUser: async (id) => {
    return User.query().findById(id).throwIfNotFound();
  },

  updateUser: async (id, data) => {
    let trx;
    try {
      const obj = await service.readUser(id);
      trx = await User.startTransaction();

      const update = {
        idpUserId: data.idpUserId,
        keycloakId: data.keycloakId,
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        idpCode: data.idp,
      };

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
        idp_userid: idpUserId,
        idp_username: identity,
        identity_provider: idp,
        preferred_username: username,
        given_name: firstName,
        family_name: lastName,
        sub: keycloakId,
        name: fullName,
        email,
      } = token.content;

      return {
        idpUserId: idpUserId,
        keycloakId: keycloakId,
        username: identity ? identity : username,
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        email: email,
        idp: idp ? idp : '',
        public: false,
      };
    } catch (e) {
      // any issues parsing the token, or if token doesn't exist, return a default "public" user
      return {
        idpUserId: undefined,
        keycloakId: undefined,
        username: 'public',
        firstName: undefined,
        lastName: undefined,
        fullName: 'public',
        email: undefined,
        idp: 'public',
        public: true,
      };
    }
  },

  getUserId: async (userInfo) => {
    if (userInfo.public) {
      return { id: 'public', ...userInfo };
    }

    const obj = { ...userInfo };

    // if this user does not exists, add...
    let user = await User.query().first().where('keycloakId', obj.keycloakId);

    if (!user) {
      // add to the system.
      user = await service.createUser(obj);
    } else {
      // what if name or email changed?
      user = await service.updateUser(user.id, obj);
    }

    // return with the db id...
    return { id: user.id, usernameIdp: user.idpCode ? `${user.username}@${user.idpCode}` : user.username, ...userInfo };
  },

  getUserForms: async (userInfo, params = {}) => {
    params = queryUtils.defaultActiveOnly(params);
    let items = [];
    if (userInfo && userInfo.public) {
      // if the user is 'public', then we can only fetch public accessible forms...
      items = await PublicFormAccess.query().modify('filterFormId', params.formId).modify('filterActive', params.active).modify('orderDefault');
      // ignore any passed in accessLevel params, only return public
      return service.filterForms(userInfo, items, ['public']);
    } else {
      // if user has an id, then we fetch whatever forms match the query params
      items = await UserFormAccess.query().modify('filterUserId', userInfo.id).modify('filterFormId', params.formId).modify('filterActive', params.active).modify('orderDefault');
      return service.filterForms(userInfo, items, params.accessLevels);
    }
  },

  filterForms: (userInfo, items, accessLevels = []) => {
    // note that the user form access query returns submitter roles for everyone
    // we need to filter out the true access level here.
    // so we need a role, or a valid idp from login, or form needs to be public.
    let forms = [];

    let filtered = items.filter((x) => {
      // include if user has idp, or form is public, or user has an explicit role.
      if (x.idps.includes(userInfo.idp) || x.idps.includes('public')) {
        // always give submitter permissions to launch by idp and public
        x.permissions = Array.from(new Set([...x.permissions, ...FORM_SUBMITTER]));
        return true;
      }
      // user has permissions solely through their assigned roles...
      return x.roles.length;
    });

    if (accessLevels && accessLevels.length) {
      filtered.forEach((item) => {
        let hasPublic = false;
        let hasIdp = false;
        let hasTeam = false;
        if (accessLevels.includes('public')) {
          // must have public in form idps...
          hasPublic = item.idps.includes('public');
        } else if (accessLevels.includes('idp')) {
          // must have user's idp in idps...
          hasIdp = item.idps.includes(userInfo.idp);
        } else if (accessLevels.includes('team')) {
          // must have a role...
          hasTeam = item.roles.length;
        }
        if (hasPublic || hasIdp || hasTeam) {
          forms.push(service.formAccessToForm(item));
        }
      });
    } else {
      forms = filtered.map((item) => service.formAccessToForm(item));
    }
    return forms;
  },

  formAccessToForm: (item) => {
    return {
      formId: item.formId,
      formName: item.formName,
      formDescription: item.formDescription,
      labels: item.labels,
      idps: item.idps,
      active: item.active,
      formVersionId: item.formVersionId,
      version: item.version,
      published: item.published,
      versionUpdatedAt: item.versionUpdatedAt,
      roles: item.roles,
      permissions: item.permissions,
    };
  },

  login: async (token, params = {}) => {
    const userInfo = service.parseToken(token);
    const user = await service.getUserId(userInfo);
    const forms = await service.getUserForms(user, params); // get forms for user (filtered by params)...
    params.active = false;
    const deletedForms = await service.getUserForms(user, params); // get forms for user (filtered by params)...
    return { ...user, forms: forms, deletedForms: deletedForms };
  },

  // -------------------------------------------------------------------------------------------------------------
  // Submission Data
  // -------------------------------------------------------------------------------------------------------------
  checkSubmissionPermission: async (currentUser, submissionId, permissions) => {
    if (currentUser.public) return false;
    return FormSubmissionUserPermissions.query()
      .modify('filterSubmissionId', submissionId)
      .modify('filterUserId', currentUser.id)
      .modify('filterByPermissions', permissions)
      .first();
  },

  getSubmissionForm: async (submissionId) => {
    // Get this submission data for the form Id
    const meta = await SubmissionMetadata.query().where('submissionId', submissionId).first().throwIfNotFound();

    // Get the form with IDP info
    const form = await Form.query().findById(meta.formId).allowGraph('identityProviders').withGraphFetched('identityProviders(orderDefault)').throwIfNotFound();

    return {
      submission: meta,
      form: form,
    };
  },

  getMultipleSubmission: async (submissionIds) => {
    return await SubmissionMetadata.query().whereIn('submissionId', submissionIds);
  },

  // ---------------------------------------------------------------------------------------------/Submission Data
};

module.exports = service;
