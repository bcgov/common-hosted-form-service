const controller = require('../../../../src/forms/formModule/controller');
const service = require('../../../../src/forms/formModule/service');

const formModuleId = '97cd8ef7-f7b6-4ff0-94cf-7ac3f85dafff';
const formModuleVersionId = '7a69d0fc-66e5-4982-add0-501615a7cd6e';
const userId = 'cc8c64b7-a457-456e-ade0-09ff7ee75a2b';

afterEach(() => {
  jest.clearAllMocks();
});

describe('list', () => {
  it('should query form_module table for list', async () => {
    const req = {
      query: {
        pluginName: 'pluginName',
        active: true,
      },
      currentUser: {
        id: userId,
        usernameIdp: 'me',
      },
    };

    jest.spyOn(controller, 'listFormModules');
    service.listFormModules = jest.fn().mockReturnValue([{ pluginName: 'pluginName', active: true }]);

    let next = jest.fn();

    await controller.listFormModules(req, {}, next);

    expect(service.listFormModules).toHaveBeenCalledTimes(1);
    expect(service.listFormModules).toHaveBeenCalledWith({ pluginName: 'pluginName', active: true });
    expect(controller.listFormModules).toHaveBeenCalledTimes(1);
  });

  it('should query form_module table for list with no query parameters', async () => {
    const req = {
      currentUser: {
        id: userId,
        usernameIdp: 'me',
      },
    };

    jest.spyOn(controller, 'listFormModules');
    service.listFormModules = jest.fn().mockReturnValue([{ pluginName: 'pluginName', active: true }]);

    let next = jest.fn();

    await controller.listFormModules(req, {}, next);

    expect(service.listFormModules).toHaveBeenCalledTimes(1);
    expect(controller.listFormModules).toHaveBeenCalledTimes(1);
  });
});

describe('form module CRUD', () => {
  const formModuleBody = {
    id: formModuleId,
    pluginName: 'pluginName',
    active: true,
  };
  const currentUser = {
    id: userId,
    usernameIdp: 'me',
  };
  const formModuleUpd = {
    pluginName: 'pluginName2',
    active: false,
    identityProviders: [
      {
        code: 'idir',
        display: 'IDIR',
      },
    ],
  };
  const formModuleToggle = {
    active: true,
  };

  it('should throw when invalid options are provided', async () => {
    const req = {
      currentUser: currentUser,
    };

    jest.spyOn(controller, 'readFormModule');

    let next = jest.fn();

    await controller.readFormModule(req, {}, next);
    await expect(controller.readFormModule).rejects.toThrow();

    await controller.readFormModule(undefined, {}, next);
    await expect(controller.readFormModule).rejects.toThrow();
  });

  it('should read form_module by id', async () => {
    const req = {
      params: {
        formModuleId: formModuleId,
      },
      currentUser: {
        id: userId,
        usernameIdp: 'me',
      },
    };

    jest.spyOn(controller, 'readFormModule');
    service.readFormModule = jest.fn().mockReturnValue({ id: formModuleId, pluginName: 'pluginName', active: true });

    let next = jest.fn();

    await controller.readFormModule(req, {}, next);
    expect(controller.readFormModule).toHaveBeenCalledTimes(1);
  });

  it('should insert form module', async () => {
    const req = {
      body: formModuleBody,
      currentUser: currentUser,
    };

    jest.spyOn(controller, 'createFormModule');
    service.createFormModule = jest.fn().mockReturnValue({ id: formModuleId, pluginName: 'pluginName', active: true });

    let next = jest.fn();

    await controller.createFormModule(req, {}, next);
    expect(controller.createFormModule).toHaveBeenCalledTimes(1);
  });

  it('should update form module', async () => {
    const req = {
      params: {
        formModuleId: formModuleId,
      },
      body: formModuleUpd,
      currentUser: currentUser,
    };

    jest.spyOn(controller, 'updateFormModule');
    service.updateFormModule = jest.fn().mockReturnValue({ id: formModuleId, pluginName: 'pluginName2', active: false, identityProviders: [{ code: 'idir', display: 'IDIR' }] });

    let next = jest.fn();

    await controller.updateFormModule(req, {}, next);

    expect(controller.updateFormModule).toHaveBeenCalledTimes(1);
  });

  it('should toggle form module', async () => {
    const req = {
      params: {
        formModuleId: formModuleId,
      },
      body: formModuleToggle,
      currentUser: currentUser,
    };

    jest.spyOn(controller, 'toggleFormModule');
    service.toggleFormModule = jest.fn().mockReturnValue({ id: formModuleId, active: false });

    let next = jest.fn();

    await controller.toggleFormModule(req, {}, next);

    expect(controller.toggleFormModule).toHaveBeenCalledTimes(1);
  });

  describe('form module version CRUD', () => {
    const formModuleVersionBody = {
      externalUris: ['MOCK_URI'],
      config: {},
    };

    const formModuleVersionUpd = {
      externalUris: ['MOCK_URI2'],
      config: {
        matrix: true,
      },
    };

    it('should throw when invalid options are provided', async () => {
      const req = {
        currentUser: currentUser,
      };

      jest.spyOn(controller, 'createFormModuleVersion');

      let next = jest.fn();

      await controller.createFormModuleVersion(req, {}, next);
      await expect(controller.createFormModuleVersion).rejects.toThrow();

      await controller.createFormModuleVersion(undefined, {}, next);
      await expect(controller.createFormModuleVersion).rejects.toThrow();
    });

    it('should insert form module version', async () => {
      const req = {
        params: {
          formModuleId: formModuleId,
        },
        body: formModuleVersionBody,
        currentUser: currentUser,
      };

      jest.spyOn(controller, 'createFormModuleVersion');
      service.createFormModuleVersion = jest.fn().mockReturnValue({ id: formModuleVersionId, formModuleId: formModuleId, externalUris: ['MOCK_URI'], config: {} });

      let next = jest.fn();

      await controller.createFormModuleVersion(req, {}, next);

      expect(controller.createFormModuleVersion).toHaveBeenCalledTimes(1);
    });

    it('should update form module version', async () => {
      const req = {
        params: {
          formModuleVersionId: formModuleVersionId,
        },
        body: formModuleVersionUpd,
        currentUser: currentUser,
      };

      jest.spyOn(controller, 'updateFormModuleVersion');
      service.updateFormModuleVersion = jest.fn().mockReturnValue({ id: formModuleVersionId, formModuleId: formModuleId, externalUris: ['MOCK_URI2'], config: { matrix: true } });

      let next = jest.fn();

      await controller.updateFormModuleVersion(req, {}, next);

      expect(controller.updateFormModuleVersion).toHaveBeenCalledTimes(1);
    });
  });

  describe('form module identity provider CRUD', () => {
    it('should list the form module identity providers', async () => {
      const req = {
        params: {
          formModuleId: formModuleId,
        },
        currentUser: {
          id: userId,
          usernameIdp: 'me',
        },
      };

      jest.spyOn(controller, 'listFormModuleIdentityProviders');
      service.listFormModuleIdentityProviders = jest.fn().mockReturnValue([{ formModuleId: formModuleId, code: 'idir' }]);

      let next = jest.fn();

      await controller.listFormModuleIdentityProviders(req, {}, next);

      expect(service.listFormModuleIdentityProviders).toHaveBeenCalledTimes(1);
      expect(service.listFormModuleIdentityProviders).toHaveBeenCalledWith(req.params.formModuleId);
      expect(controller.listFormModuleIdentityProviders).toHaveBeenCalledTimes(1);
    });
  });
});
