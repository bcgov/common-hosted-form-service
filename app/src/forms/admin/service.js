const { Form, FormVersion, User, UserFormAccess,FormComponentsHelpInfo } = require('../common/models');
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
        keycloakId: fa.keycloakId,
        username: fa.username,
        email: fa.email,
        roles: fa.roles
      }));
  },
  /**

  /**
   * @function listFormComponentsHelpInfo
   * Search for all form components help information
   * @returns {Promise} An objection query promise
   */
   listFormComponentsHelpInfo: async () => {
   
    let result = await FormComponentsHelpInfo.query()
    .modify('distinctOnComponentName')
    .modify('orderComponentNameVersionsDescending');
  
    let filterResult= result.map(item=>({id:item.id,status:item.publishstatus,componentName:item.componentname,moreHelpInfoLink:item.morehelpinfolink,imageUrl:item.imageurl,
      version:item.versions,groupName:item.groupname,description:item.description }));
     
    return filterResult.reduce(function (r, a) {
      r[a.groupName] = r[a.groupName] || [];
      r[a.groupName].push(a);
      return r;
    }, Object.create(null));
  },

  /**
   * @function createFormComponentsHelpInfo
   * insert each Form Component Help Info
   * @param {Object} data Form Component Help Info object
   * @returns {Promise} An objection query promise
   */
   createFormComponentsHelpInfo: async(data)=>{
    let trx;
    try{
      const obj = {};
      obj.id = uuidv4();
      obj.componentname = data.componentName;
      obj.morehelpinfolink = data.moreHelpInfoLink;
      obj.imageurl = data.imageUrl;
      obj.versions = data.version;
      obj.groupname = data.groupName;
      obj.description = data.description;
      obj.publishstatus=data.status;
      obj.createdBy = "aidowu.idir";
      
      trx = await FormComponentsHelpInfo.startTransaction();
      
      let t = await FormComponentsHelpInfo.query(trx).insert(obj);
  
      await trx.commit()
      
      return service.readFormComponentsHelpInfo(obj.id);
      
    } catch(err){
     
      if (trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function readFormComponentsHelpInfo
   * fetch Form Component Help Info by formComponentHelpInfoId
   * @param {String} formComponentHelpInfoId Form Component Help Info Id
   * @returns {Promise} An objection query promise
   */

readFormComponentsHelpInfo: async(formComponentHelpInfoId)=>{
  return await FormComponentsHelpInfo.query()
  .where('id', formComponentHelpInfoId);
},

/**
   * @function updateFormComponentsHelpInfo
   * update the publish status of each form component information help information
   * @param {Object} param consist of publishStatus and componentId.
   * @returns {Promise} An objection query promise
   */
updateFormComponentsHelpInfo: async(param)=>{
  let trx;
  try {
    trx = await FormComponentsHelpInfo.startTransaction();
    await FormComponentsHelpInfo.query(trx).patchAndFetchById(param.componentId, {
      publishstatus: JSON.parse(param.publishStatus),
      updatedBy: 'aidowu.idir'
    });
    await trx.commit();
    return await service.readFormComponentsHelpInfo(param.componentId);
  } catch (err) {
    if (trx) await trx.rollback();
    throw err;
  }
}

};



module.exports = service;
