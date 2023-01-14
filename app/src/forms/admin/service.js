const { Form, FormVersion, User, UserFormAccess,FormComponentsProactiveHelp } = require('../common/models');
const { queryUtils } = require('../common/utils');
const { v4: uuidv4 } = require('uuid');

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
    return FormVersion.query()
      .findById(formVersionId)
      .throwIfNotFound();
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
    const formAccess = await UserFormAccess.query()
      .modify('filterFormId', formId)
      .modify('orderDefault');
    return formAccess
      // grab all users that have roles on this form
      .filter(fa => fa.roles.length)
      // do a quick transform into a simple structure.
      .map(fa => ({
        userId: fa.userId,
        idpUserId: fa.idpUserId,
        username: fa.username,
        email: fa.email,
        roles: fa.roles
      }));
  },
  /**


  /**
   * @function createFormComponentsProactiveHelp
   * insert each Form Component Help Info
   * @param {Object} data Form Component Help Info object
   * @returns {Promise} An objection query promise
   */
  createFormComponentsProactiveHelp: async(data)=> {
    let trx;
    try {
      const obj = {};
      let id = uuidv4();
      trx = await FormComponentsProactiveHelp.startTransaction();
      let buf, imageType;
      if(data.image!==''){
        buf = data.image.split(',')[1];
        imageType = (data.image.split(';')[0]).split(':')[1];
      }
      obj.id = id;
      obj.componentname = data.componentName;
      obj.externallink = data.externalLink;
      obj.image = buf;
      obj.componentimagename = data.imageName;
      obj.imagetype = imageType,
      obj.version = data.version;
      obj.groupname = data.groupName;
      obj.islinkenabled = data.isLinkEnabled;
      obj.description = data.description;
      obj.publishstatus=data.status;
      obj.createdBy = 'ADMIN';
      await FormComponentsProactiveHelp.query(trx).insert(obj);
      await trx.commit();
      return service.readFormComponentsProactiveHelp(id);

    } catch(err) {

      if (trx) await trx.rollback();
      throw err;
    }

  },

  /**
   * @function getFormComponentsProactiveHelpVersion
   * insert each Form Component Help Info
   * @param {Object} data form component name and version
   * @returns {Promise} An objection query promise
   */
  getFormComponentsProactiveHelpVersion: async(data)=> {

    let componentName = data&&data.componentName;
    let version = data.version;

    let result = await FormComponentsProactiveHelp.query()
      .modify('findByComponentNameAndVersion',componentName, parseInt(version));
    let uri = result[0].image!==null?'data:' + result[0].imagetype + ';' + 'base64' + ',' +result[0].image:'';
    return {id:result[0].id,status:result[0].publishstatus,componentName:result[0].componentname,externalLink:result[0].externallink,image:uri,
      version:result[0].version,groupName:result[0].groupname,description:result[0].description, isLinkEnabled:result[0].islinkenabled,
      imageName:result[0].componentimagename };
  },

  /**
   * @function readFormComponentsProactiveHelp
   * fetch Form Component Help Info by formComponentHelpInfoId
   * @param {String} formComponentsProactiveHelpId Form Component Help Info Id
   * @returns {Promise} An objection query promise
   */

  readFormComponentsProactiveHelp: async(formComponentsProactiveHelpId)=> {
    return await FormComponentsProactiveHelp.query()
      .where('id', formComponentsProactiveHelpId);
  },

  /**
   * @function updateFormComponentsProactiveHelp
   * update the publish status of each form component information help information
   * @param {Object} param consist of publishStatus and componentId.
   * @returns {Promise} An objection query promise
   */
  updateFormComponentsProactiveHelp: async(param)=> {
    let trx;
    try {
      trx = await FormComponentsProactiveHelp.startTransaction();
      await FormComponentsProactiveHelp.query(trx).patchAndFetchById(param.componentId, {
        publishstatus: JSON.parse(param.publishStatus),
        updatedBy: 'ADMIN'
      });
      await trx.commit();
      return await service.readFormComponentsProactiveHelp(param.componentId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  }

};

module.exports = service;
