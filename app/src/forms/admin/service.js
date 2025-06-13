const { ExternalAPIStatuses } = require('../common/constants');
const { Form, FormVersion, User, UserFormAccess, FormComponentsProactiveHelp, AdminExternalAPI, ExternalAPI, ExternalAPIStatusCode } = require('../common/models');
const { queryUtils } = require('../common/utils');
const uuid = require('uuid');
const service = {
  //
  // Forms
  //

  /**
   * @function listForms
   * List all the forms in CHEFS
   * @param {Object} params The query params. Specify 'active' bool to control active/deleted
   * @returns {Promise} An objection query promise
   */
  listForms: async (params) => {
    params = queryUtils.defaultActiveOnly(params);
    return Form.query()
      .modify('filterActive', params.active)
      .allowGraph('[identityProviders,versions]')
      .withGraphFetched('identityProviders(orderDefault)')
      .withGraphFetched('versions(selectWithoutSchema, orderVersionDescending)')
      .modify('orderNameAscending');
  },

  /**
   * @function readVersion
   * Find a form version entry
   * @param {String} formVersionId The version Id
   * @returns {Promise} An objection query promise
   */
  readVersion: (formVersionId) => {
    return FormVersion.query().findById(formVersionId).throwIfNotFound();
  },

  /**
   * @function readForm
   * Find a form entry
   * @param {String} formId The form Id
   * @returns {Promise} An objection query promise
   */
  readForm: async (formId) => {
    return Form.query()
      .findById(formId)
      .withGraphFetched('identityProviders(orderDefault)')
      .withGraphFetched('versions(selectWithoutSchema, orderVersionDescending)')
      .throwIfNotFound();
  },

  /**
   * @function restoreForm
   * Reactivate a soft-deleted form
   * @param {String} formId The form Id
   * @returns {Object} The form entry after the restore
   */
  restoreForm: async (formId) => {
    let trx;
    try {
      const obj = await service.readForm(formId);
      trx = await Form.startTransaction();
      const upd = {
        active: true,
        updatedBy: 'ADMIN',
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

  /**
   * @function getUsers
   * Search for users
   * @param {Object} params The query parameters
   * @returns {Promise} An objection query promise
   */
  getUsers: async (params) => {
    return User.query()
      .modify('filterUsername', params.username)
      .modify('filterFirstName', params.firstName)
      .modify('filterLastName', params.lastName)
      .modify('filterEmail', params.email)
      .modify('orderLastFirstAscending');
  },

  /**
   * @function getFormUserRoles
   * For the given form, return users that have roles for that form
   * @param {String} formId The form ID
   * @returns {Promise} An objection query promise
   */
  getFormUserRoles: async (formId) => {
    const formAccess = await UserFormAccess.query().modify('filterFormId', formId).modify('orderDefault');
    return (
      formAccess
        // grab all users that have roles on this form
        .filter((fa) => fa.roles.length)
        // do a quick transform into a simple structure.
        .map((fa) => ({
          userId: fa.userId,
          idpUserId: fa.idpUserId,
          username: fa.username,
          email: fa.email,
          roles: fa.roles,
        }))
    );
  },

  //
  // APIs
  //

  /**
   * @function getExternalAPIs
   * Search for External APIs
   * @param {Object} params The query parameters
   * @returns {Promise} An objection query promise
   */
  getExternalAPIs: async (params) => {
    return AdminExternalAPI.query()
      .modify('filterMinistry', params.ministry)
      .modify('filterFormName', params.formName)
      .modify('filterName', params.name)
      .modify('filterDisplay', params.display)
      .modify('orderDefault');
  },
  updateExternalAPI: async (id, data) => {
    await ExternalAPI.query().findById(id).throwIfNotFound();
    // admins only change the status code and allow send user token
    const upd = {
      code: data.code,
      allowSendUserToken: data.allowSendUserToken,
      updatedBy: 'ADMIN',
    };
    // if we are not allowing sending user token, ensure any user token fields are cleared out
    if (!data.allowSendUserToken) {
      upd['sendUserToken'] = false;
      upd['userTokenHeader'] = null;
      upd['userTokenBearer'] = false;
    }
    let trx;
    try {
      trx = await ExternalAPI.startTransaction();
      await ExternalAPI.query(trx).patchAndFetchById(id, upd);
      await service._approveMany(id, data, trx);
      await trx.commit();
      return ExternalAPI.query().findById(id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  getExternalAPIStatusCodes: async () => {
    return ExternalAPIStatusCode.query();
  },
  _approveMany: async (id, data, trx) => {
    // if we are setting to approved, approve all similar endpoints.
    // same ministry, same base url...
    if (data.code === ExternalAPIStatuses.APPROVED) {
      const adminExternalAPI = await AdminExternalAPI.query(trx).findById(id);
      const regex = /^[A-Z]{2,4}$/; // Ministry constants are in the Frontend, they are 2,3,or 4 Capital chars
      if (regex.test(adminExternalAPI.ministry)) {
        // this will protect from sql injection.
        // this should be removed when form API and db are updated to restrict form Ministry values.
        const delimiter = '?';
        const baseUrl = data.endpointUrl.split(delimiter)[0];
        await ExternalAPI.query(trx)
          .patch({ code: ExternalAPIStatuses.APPROVED })
          .whereRaw(`"formId" in (select id from form where ministry = '${adminExternalAPI.ministry}')`)
          .andWhere('endpointUrl', 'ilike', `${baseUrl}%`)
          .andWhere('code', ExternalAPIStatuses.SUBMITTED);
      }
    }
  },

  /**
   * @function createFormComponentsProactiveHelp
   * insert each Form Component Help Info
   * @param {Object} data Form Component Help Info object
   * @returns {Promise} An objection query promise
   */
  createFormComponentsProactiveHelp: async (data) => {
    let trx;
    try {
      trx = await FormComponentsProactiveHelp.startTransaction();

      let id = data && data.componentId;

      let buf, imageType;
      if (data.image !== '') {
        buf = data.image.split(',')[1];
        imageType = data.image.split(';')[0].split(':')[1];
      }

      if (id) {
        await FormComponentsProactiveHelp.query(trx).patchAndFetchById(data.componentId, {
          componentName: data && data.componentName,
          externalLink: data && data.externalLink,
          image: buf,
          imageType: imageType,
          componentImageName: data && data.imageName,
          groupName: data && data.groupName,
          isLinkEnabled: data && data.isLinkEnabled,
          description: data && data.description,
          publishStatus: data && data.status,
          createdBy: 'ADMIN',
        });
      } else {
        const obj = {};
        id = uuid.v4();
        obj.id = id;
        obj.componentName = data && data.componentName;
        obj.externalLink = data && data.externalLink;
        obj.image = buf;
        obj.componentImageName = data && data.imageName;
        (obj.imageType = imageType), (obj.groupName = data && data.groupName);
        obj.isLinkEnabled = data && data.isLinkEnabled;
        obj.description = data && data.description;
        obj.publishStatus = data && data.status;
        obj.createdBy = 'ADMIN';
        await FormComponentsProactiveHelp.query(trx).insert(obj);
      }
      await trx.commit();
      return service.readFormComponentsProactiveHelp(id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function readFormComponentsProactiveHelp
   * fetch all Components proactive/Help Info
   * @returns {Promise} An objection query promise
   */

  readFormComponentsProactiveHelp: async () => {
    const result = await FormComponentsProactiveHelp.query().modify('selectWithoutImages');
    if (result.length > 0) {
      let filterResult = result.map((item) => {
        return {
          id: item.id,
          status: item.publishStatus,
          componentName: item.componentName,
          externalLink: item.externalLink,
          version: item.version,
          groupName: item.groupName,
          description: item.description,
          isLinkEnabled: item.isLinkEnabled,
          imageName: item.componentImageName,
        };
      });

      return filterResult.reduce(function (r, a) {
        r[a.groupName] = r[a.groupName] || [];
        r[a.groupName].push(a);
        return r;
      }, Object.create(null));
    }
    return {};
  },

  /**
   * @function getFCProactiveHelpImageUrl
   * get form component proactive help image
   * @param {Object} param consist of publishStatus and componentId.
   * @returns {Promise} An objection query promise
   */
  getFCProactiveHelpImageUrl: async (componentId) => {
    let result = [];
    result = await FormComponentsProactiveHelp.query().modify('findByComponentId', componentId);
    let item = result.length > 0 ? result[0] : null;
    let imageUrl = item !== null ? 'data:' + item.imageType + ';' + 'base64' + ',' + item.image : '';
    return { url: imageUrl };
  },

  /**
   * @function updateFormComponentsProactiveHelp
   * update the publish status of each form component information help information
   * @param {Object} param consist of publishStatus and componentId.
   * @returns {Promise} An objection query promise
   */
  updateFormComponentsProactiveHelp: async (param) => {
    let trx;
    try {
      trx = await FormComponentsProactiveHelp.startTransaction();
      await FormComponentsProactiveHelp.query(trx).patchAndFetchById(param.componentId, {
        publishStatus: JSON.parse(param.publishStatus),
        updatedBy: 'ADMIN',
      });
      await trx.commit();
      return await service.readFormComponentsProactiveHelp(param.componentId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function listFormComponentsProactiveHelp
   * Search for all form components help information
   * @returns {Promise} An objection query promise
   */
  listFormComponentsProactiveHelp: async () => {
    let result = [];
    result = await FormComponentsProactiveHelp.query().modify('selectWithoutImages');
    if (result.length > 0) {
      let filterResult = result.map((item) => {
        return {
          id: item.id,
          status: item.publishStatus,
          componentName: item.componentName,
          externalLink: item.externalLink,
          version: item.version,
          groupName: item.groupName,
          description: item.description,
          isLinkEnabled: item.isLinkEnabled,
          imageName: item.componentImageName,
        };
      });
      return await filterResult.reduce(function (r, a) {
        r[a.groupName] = r[a.groupName] || [];
        r[a.groupName].push(a);
        return r;
      }, Object.create(null));
    }
    return {};
  },
};

module.exports = service;
