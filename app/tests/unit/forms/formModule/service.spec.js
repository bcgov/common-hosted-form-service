const { MockModel, MockTransaction } = require('../../../common/dbHelper');

jest.mock('../../../../src/forms/common/models/tables/formModule', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/formModuleIdentityProvider', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/formModuleVersion', () => MockModel);

const service = require('../../../../src/forms/formModule/service');

const formModuleId = '97cd8ef7-f7b6-4ff0-94cf-7ac3f85dafff';
const formModuleVersionId = '7a69d0fc-66e5-4982-add0-501615a7cd6e';
const userId = 'cc8c64b7-a457-456e-ade0-09ff7ee75a2b';

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

describe('list', () => {
  it ('should query form_module table for list', async () => {
    const params = {
      pluginName: 'pluginName',
      active: true,
    };
    await service.listFormModules(params);

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith();
    expect(MockModel.modify).toHaveBeenCalledTimes(3);
    expect(MockModel.modify).toHaveBeenCalledWith('filterPluginName', 'pluginName');
    expect(MockModel.modify).toHaveBeenCalledWith('filterActive', true);
    expect(MockModel.modify).toHaveBeenCalledWith('orderPluginNameAscending');
    expect(MockModel.allowGraph).toHaveBeenCalledTimes(1);
    expect(MockModel.allowGraph).toHaveBeenCalledWith('[formModuleVersions,identityProviders]');
    expect(MockModel.withGraphFetched).toHaveBeenCalledTimes(2);
    expect(MockModel.withGraphFetched).toHaveBeenCalledWith('formModuleVersions(orderCreatedAtDescending)');
    expect(MockModel.withGraphFetched).toHaveBeenCalledWith('identityProviders(orderDefault)');
  });
});
describe('list', () => {
  it ('should query form_module table for list with no params', async () => {
    await service.listFormModules({});

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith();
    expect(MockModel.modify).toHaveBeenCalledWith('orderPluginNameAscending');
    expect(MockModel.allowGraph).toHaveBeenCalledTimes(1);
    expect(MockModel.allowGraph).toHaveBeenCalledWith('[formModuleVersions,identityProviders]');
    expect(MockModel.withGraphFetched).toHaveBeenCalledTimes(2);
    expect(MockModel.withGraphFetched).toHaveBeenCalledWith('formModuleVersions(orderCreatedAtDescending)');
    expect(MockModel.withGraphFetched).toHaveBeenCalledWith('identityProviders(orderDefault)');
  });
});

describe('read', () => {
  it ('should query form_module table by id', async () => {
    await service.readFormModule(formModuleId);

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith();
    expect(MockModel.findById).toHaveBeenCalledTimes(1);
    expect(MockModel.findById).toHaveBeenCalledWith(formModuleId);
    expect(MockModel.allowGraph).toHaveBeenCalledTimes(1);
    expect(MockModel.allowGraph).toHaveBeenCalledWith('[formModuleVersions,identityProviders]');
    expect(MockModel.withGraphFetched).toHaveBeenCalledTimes(2);
    expect(MockModel.withGraphFetched).toHaveBeenCalledWith('formModuleVersions(selectWithoutUrisAndData,orderCreatedAtDescending)');
    expect(MockModel.withGraphFetched).toHaveBeenCalledWith('identityProviders(orderDefault)');
  });
});

describe('form module CRUD', () => {
  const formModuleBody = {
    id: formModuleId,
    pluginName: 'pluginName',
  };
  const currentUser = {
    id: userId,
    usernameIdp: 'me',
  };
  const formModuleUpd = {
    pluginName: 'pluginName2',
    active: false,
    identityProviders: [{
      code: 'idir',
      display: 'IDIR',
    }],
  };
  const formModuleToggle = {
    active: false,
  };

  const readFormModuleSpy = jest.spyOn(service, 'readFormModule');
  
  beforeEach(() => {
    readFormModuleSpy.mockReset();
  });

  it('should throw when invalid options are provided', () => {
    MockModel.mockResolvedValue(undefined);
    const fn = (formModuleId, body, currentUser) => service.updateFormModule(formModuleId, body, currentUser);
    expect(fn(formModuleId, undefined, currentUser)).rejects.toThrow();
    expect(fn(formModuleId, {}, currentUser)).rejects.toThrow();
    expect(MockModel.startTransaction).toHaveBeenCalledTimes(0);
    expect(MockModel.query).toHaveBeenCalledTimes(0);
  });

  it('should insert form module', async () => {
    MockModel.mockResolvedValue(undefined);
    readFormModuleSpy.mockResolvedValue(undefined);

    await service.createFormModule(formModuleBody, currentUser);

    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
  });

  it('should update form module', async () => {
    MockModel.mockResolvedValue({});
    readFormModuleSpy.mockResolvedValue({});
  
    await service.updateFormModule(formModuleId, formModuleUpd, currentUser);
  
    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(3);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.patchAndFetchById).toHaveBeenCalledTimes(1);
    expect(MockModel.patchAndFetchById).toHaveBeenCalledWith(formModuleId, {
      pluginName: 'pluginName2',
      active: false,
      updatedBy: currentUser.usernameIdp
    });
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
  });

  it('should update toggle form module', async () => {
    MockModel.mockResolvedValue({});
    readFormModuleSpy.mockResolvedValue({});
  
    await service.toggleFormModule(formModuleId, formModuleToggle, currentUser);
  
    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.patchAndFetchById).toHaveBeenCalledTimes(1);
    expect(MockModel.patchAndFetchById).toHaveBeenCalledWith(formModuleId, {
      active: false,
      updatedBy: currentUser.usernameIdp
    });
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
  });

  describe('form module version CRUD', () => {
    const formModuleVersionBody = {
      externalUris: [ 'MOCK_URI' ],
      config: {}
    };

    const formModuleVersionUpd = {
      externalUris: [ 'MOCK_URI2' ],
      config: {
        matrix: true,
      }
    };

    const readFormModuleVersionSpy = jest.spyOn(service, 'readFormModuleVersion');

    beforeEach(() => {
      readFormModuleVersionSpy.mockReset();
    });

    it('should throw when invalid options are provided', () => {
      MockModel.mockResolvedValue(undefined);
      const fn = (formModuleId, body, currentUser) => service.createFormModuleVersion(formModuleId, body, currentUser);
      expect(fn(formModuleId, null, currentUser)).rejects.toThrow();
      expect(fn(formModuleId, {}, currentUser)).rejects.toThrow();
      expect(MockModel.startTransaction).toHaveBeenCalledTimes(0);
      expect(MockModel.query).toHaveBeenCalledTimes(0);
    });

    it('should insert form module version', async () => {
      MockModel.mockResolvedValue(undefined);
      readFormModuleSpy.mockResolvedValue(undefined);
      readFormModuleVersionSpy.mockResolvedValue(undefined);

      await service.createFormModule(formModuleBody, currentUser);
      await service.createFormModuleVersion(formModuleId, formModuleVersionBody, currentUser);
  
      expect(MockModel.startTransaction).toHaveBeenCalledTimes(2);
      expect(MockModel.query).toHaveBeenCalledTimes(2);
      expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
      expect(MockTransaction.commit).toHaveBeenCalledTimes(2);
    });

    it('should update form module version', async () => {
      MockModel.mockResolvedValue({});
      readFormModuleVersionSpy.mockResolvedValue({});
    
      await service.updateFormModuleVersion(formModuleVersionId, formModuleVersionUpd, currentUser);
    
      expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
      expect(MockModel.query).toHaveBeenCalledTimes(1);
      expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
      expect(MockModel.patchAndFetchById).toHaveBeenCalledTimes(1);
      expect(MockModel.patchAndFetchById).toHaveBeenCalledWith(formModuleVersionId, {
        externalUris: [ 'MOCK_URI2' ],
        config: {
          matrix: true,
        },
        updatedBy: currentUser.usernameIdp
      });
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('form module identity provider CRUD', () => {
    it('should list the form module identity providers', async () => {     
      MockModel.mockResolvedValue(undefined);

      await service.createFormModule(formModuleBody, currentUser);

      expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
      expect(MockModel.query).toHaveBeenCalledTimes(1);
      expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
      expect(MockTransaction.commit).toHaveBeenCalledTimes(1);

      await service.listFormModuleIdentityProviders(formModuleId);

      expect(MockModel.modify).toHaveBeenCalledTimes(1);
      expect(MockModel.modify).toHaveBeenCalledWith('filterFormModuleId', formModuleId);
    });
  });
});
