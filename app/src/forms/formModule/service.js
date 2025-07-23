const Problem = require('api-problem');
const { v4: uuidv4 } = require('uuid');
const { queryUtils, falsey } = require('../common/utils');

const { FormModule, FormModuleIdentityProvider, FormModuleVersion, IdentityProvider } = require('../common/models');

const service = {
  listFormModules: async (params) => {
    params = queryUtils.defaultActiveOnly(params);
    return FormModule.query()
      .modify('filterPluginName', params.pluginName)
      .modify('filterActive', params.active)
      .allowGraph('[formModuleVersions,identityProviders]')
      .withGraphFetched('formModuleVersions(orderCreatedAtDescending)')
      .withGraphFetched('identityProviders(orderDefault)')
      .modify('orderPluginNameAscending');
  },
  createFormModule: async (data, currentUser) => {
    let trx;
    try {
      trx = await FormModule.startTransaction();
      const obj = {};
      obj.id = uuidv4();
      obj.pluginName = data.pluginName;
      obj.active = true;
      obj.createdBy = currentUser.usernameIdp;

      await FormModule.query(trx).insert(obj);

      if (data.identityProviders && Array.isArray(data.identityProviders) && data.identityProviders.length) {
        const fips = [];
        for (const p of data.identityProviders) {
          const exists = await IdentityProvider.query(trx).where('code', p.code).where('active', true).first();
          if (!exists) {
            throw new Problem(422, `${p.code} is not a valid Identity Provider code`);
          }
          fips.push({ id: uuidv4(), formModuleId: obj.id, code: p.code, createdBy: currentUser.usernameIdp });
        }
        await FormModuleIdentityProvider.query(trx).insert(fips);
      }

      await trx.commit();

      const result = await service.readFormModule(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  updateFormModule: async (formModuleId, data, currentUser) => {
    let trx;
    try {
      const obj = await service.readFormModule(formModuleId);
      trx = await FormModule.startTransaction();
      const upd = {
        pluginName: data.pluginName,
        active: data.active,
        updatedBy: currentUser.usernameIdp,
      };

      await FormModule.query(trx).patchAndFetchById(formModuleId, upd);

      // remove any existing links to identity providers, and the updated ones
      await FormModuleIdentityProvider.query(trx).delete().where('formModuleId', obj.id);
      // insert any new identity providers
      const fIdps = data.identityProviders.map((p) => ({
        id: uuidv4(),
        formModuleId: obj.id,
        code: p.code,
        createdBy: currentUser.usernameIdp,
      }));
      if (fIdps && fIdps.length) await FormModuleIdentityProvider.query(trx).insert(fIdps);

      await trx.commit();
      const result = await service.readFormModule(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  toggleFormModule: async (formModuleId, params = {}, currentUser) => {
    let trx;
    try {
      const active = !falsey(params.active);
      const obj = await service.readFormModule(formModuleId);
      trx = await FormModule.startTransaction();

      const upd = {
        active: active,
        updatedBy: currentUser.usernameIdp,
      };

      await FormModule.query(trx).patchAndFetchById(formModuleId, upd);

      await trx.commit();
      const result = await service.readFormModule(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  readFormModule: (formModuleId) => {
    return FormModule.query()
      .findById(formModuleId)
      .allowGraph('[formModuleVersions,identityProviders]')
      .withGraphFetched('formModuleVersions(selectWithoutUrisAndData,orderCreatedAtDescending)')
      .withGraphFetched('identityProviders(orderDefault)')
      .throwIfNotFound();
  },
  listFormModuleVersions: (formModuleId) => {
    return FormModuleVersion.query().modify('filterFormModuleId', formModuleId).modify('orderCreatedAtDescending');
  },
  createFormModuleVersion: async (formModuleId, data, currentUser) => {
    let trx;
    try {
      // This doesn't get thrown otherwise
      if (data.externalUris === undefined) throw new Error('External URI required.');

      trx = await FormModuleVersion.startTransaction();
      const obj = {};
      obj.id = uuidv4();
      obj.formModuleId = formModuleId;
      obj.externalUris = data.externalUris;
      obj.config = data.config;
      obj.createdBy = currentUser.usernameIdp;

      await FormModuleVersion.query(trx).insert(obj);

      await trx.commit();
      const result = await service.readFormModuleVersion(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  updateFormModuleVersion: async (formModuleVersionId, data, currentUser) => {
    let trx;
    try {
      const obj = await service.readFormModuleVersion(formModuleVersionId);
      trx = await FormModuleVersion.startTransaction();
      if (!data.config) data.config = '';
      const upd = {
        externalUris: data.externalUris,
        config: data.config,
        updatedBy: currentUser.usernameIdp,
      };

      await FormModuleVersion.query(trx).patchAndFetchById(formModuleVersionId, upd);

      await trx.commit();
      const result = await service.readFormModuleVersion(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  readFormModuleVersion: (formModuleVersionId) => {
    return FormModuleVersion.query().findById(formModuleVersionId).throwIfNotFound();
  },
  listFormModuleIdentityProviders: (formModuleId) => {
    return FormModuleIdentityProvider.query().modify('filterFormModuleId', formModuleId);
  },
};

module.exports = service;
