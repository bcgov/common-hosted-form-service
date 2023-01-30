const { Form, FormVersion, User, UserFormAccess,FormComponentsProactiveHelp } = require('../common/models');
const { queryUtils } = require('../common/utils');
const { v4: uuidv4 } = require('uuid');
const myCache = require('../common/cache/memoryCache');

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
   * @function createFormComponentsProactiveHelp
   * insert each Form Component Help Info
   * @param {Object} data Form Component Help Info object
   * @returns {Promise} An objection query promise
   */
  createFormComponentsProactiveHelp: async(data)=> {
    let trx;
    try {

      trx = await FormComponentsProactiveHelp.startTransaction();

      let id = data&&data.componentId;

      let buf, imageType;
      if(data.image!==''){
        buf = data.image.split(',')[1];
        imageType = (data.image.split(';')[0]).split(':')[1];
      }

      if(id) {
        await FormComponentsProactiveHelp.query(trx).patchAndFetchById(data.componentId, {
          componentname : data&&data.componentName,
          externallink : data&&data.externalLink,
          image : buf,
          componentimagename : data&&data.imageName,
          groupname : data&&data.groupName,
          islinkenabled : data&&data.isLinkEnabled,
          description : data&&data.description,
          publishstatus : data&&data.status,
          createdBy : 'ADMIN'
        });
      }
      else {
        const obj = {};
        id = uuidv4();
        obj.id = id;
        obj.componentname = data&&data.componentName;
        obj.externallink = data&&data.externalLink;
        obj.image = buf;
        obj.componentimagename = data&&data.imageName;
        obj.imagetype = imageType,
        obj.groupname = data&&data.groupName;
        obj.islinkenabled = data&&data.isLinkEnabled;
        obj.description = data&&data.description;
        obj.publishstatus = data&&data.status;
        obj.createdBy = 'ADMIN';
        await FormComponentsProactiveHelp.query(trx).insert(obj);
      }
      await trx.commit();
      return service.readFormComponentsProactiveHelp(id);
    } catch(err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function readFormComponentsProactiveHelp
   * fetch all Components proactive/Help Info
   * @returns {Promise} An objection query promise
   */

  readFormComponentsProactiveHelp: async(id)=> {
    const result = await FormComponentsProactiveHelp.query()
      .modify('distinctOnComponentNameAndGroupName');
    if(result) {

      let filterResult= result.map(item=> {
        let uri = item.image!==null?'data:' + item.imagetype + ';' + 'base64' + ',' + item.image:'';
        return ({id:item.id,status:item.publishstatus,componentName:item.componentname,externalLink:item.externallink,image:uri,
          version:item.version,groupName:item.groupname,description:item.description, isLinkEnabled:item.islinkenabled,
          imageName:item.componentimagename });
      });

      let sortedResult = filterResult.reduce(function (r, a) {
        r[a.groupName] = r[a.groupName] || [];
        r[a.groupName].push(a);
        return r;
      }, Object.create(null));

      myCache.set('proactiveHelpComponentsNames', await service.readProactiveHelpComponentsNames(filterResult));
      myCache.set('proactiveHelpList', sortedResult);

      return filterResult.find(item=>item.id===id);
    }
    return {};
  },

  /**
   * @function readProactiveHelpComponentsNames
   * update the publish status of each form component information help information
   * @param {Object} param consist of publishStatus and componentId.
   * @returns {Promise} An objection query promise
  */
  readProactiveHelpComponentsNames: async(result)=> {
    let filterResult =[];

    if(result!==undefined) {
      filterResult= result.map(item=> {
        return ({id:item.id, componentName:item.componentName, groupName:item.groupName, status:item.status });
      });

      return filterResult.reduce(function (r, a) {
        r[a.groupName] = r[a.groupName] || [];
        r[a.groupName].push(a);
        return r;
      }, Object.create(null));
    }
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
  },

  /**
   * @function listFormComponentsProactiveHelp
   * Search for all form components help information
   * @returns {Promise} An objection query promise
   */
  listFormComponentsProactiveHelp: async () => {
    let result=[];
    let filterResult=undefined;
    let cache = myCache.get('proactiveHelpList');

    if(cache) {
      return cache;
    }
    else {
      result = await FormComponentsProactiveHelp.query()
        .modify('distinctOnComponentNameAndGroupName');
      if(result) {
        filterResult= result.map(item=> {
          let uri = item.image!==null?'data:' + item.imagetype + ';' + 'base64' + ',' + item.image:'';
          return ({id:item.id,status:item.publishstatus,componentName:item.componentname,externalLink:item.externallink,image:uri,
            version:item.version,groupName:item.groupname,description:item.description, isLinkEnabled:item.islinkenabled,
            imageName:item.componentimagename });
        });

        let sortedResult = filterResult.reduce(function (r, a) {
          r[a.groupName] = r[a.groupName] || [];
          r[a.groupName].push(a);
          return r;
        }, Object.create(null));

        await myCache.set('proactiveHelpComponentsNames', await service.readProactiveHelpComponentsNames(filterResult));
        await myCache.set('proactiveHelpList', sortedResult);

        return sortedResult;
      }
    }
    return [];
  },

};

module.exports = service;
