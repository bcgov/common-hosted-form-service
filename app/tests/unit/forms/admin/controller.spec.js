const controller = require('../../../../src/forms/admin/controller');
const service = require('../../../../src/forms/admin/service');
const { getMockRes } = require('@jest-mock/express');

afterEach(() => {
  jest.clearAllMocks();
});

const req = {
  params: {},
  body: {},
  currentUser: {},
  headers: {},
};

describe('form controller', () => {
  it('should create proactive help for content form.io component', async () => {
    const formComponentsProactiveHelp = {
      componentname: 'Content',
      externallink: 'https://helplink.com',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
      version: 1,
      groupname: 'Basic Layout',
      description: 'gughuhiuhuih',
      publishstatus: false,
    };

    service.createFormComponentsProactiveHelp = jest.fn().mockReturnValue(formComponentsProactiveHelp);

    await controller.createFormComponentsProactiveHelp(req, {}, jest.fn());
    expect(service.createFormComponentsProactiveHelp).toBeCalledTimes(1);
  });

  it('should update proactive help component publish status', async () => {
    req.params['publishStatus'] = true;
    req.params['componentId'] = '5b97417a-252c-46c2-b132-85adac5ab3bc';

    const formComponentsProactiveHelp = {
      componentName: 'Content',
      externalLink: 'https://helplink.com',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
      version: 1,
      groupName: 'Basic Layout',
      description: 'gughuhiuhuih',
      status: false,
    };

    service.updateFormComponentsProactiveHelp = jest.fn().mockReturnValue(formComponentsProactiveHelp);

    await controller.updateFormComponentsProactiveHelp(req, {}, jest.fn());
    expect(service.updateFormComponentsProactiveHelp).toBeCalledTimes(1);
  });

  it('should get list of all proactive help components', async () => {
    service.listFormComponentsProactiveHelp = jest.fn().mockReturnValue({});

    await controller.listFormComponentsProactiveHelp(req, {}, jest.fn());
    expect(service.listFormComponentsProactiveHelp).toBeCalledTimes(1);
  });
});

describe('getExternalAPIs', () => {
  it('should call service', async () => {
    const { res, next } = getMockRes();
    service.getExternalAPIs = jest.fn().mockReturnValue({});

    await controller.getExternalAPIs(req, res, next);
    expect(service.getExternalAPIs).toBeCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when error', async () => {
    const { res, next } = getMockRes();
    service.getExternalAPIs = jest.fn().mockRejectedValueOnce(new Error('Async error message'));

    await controller.getExternalAPIs(req, res, next);
    expect(service.getExternalAPIs).toBeCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toBeCalledTimes(1);
  });
});

describe('updateExternalAPI', () => {
  it('should  call service', async () => {
    const { res, next } = getMockRes();
    service.updateExternalAPI = jest.fn().mockReturnValue({});

    await controller.updateExternalAPI(req, res, next);
    expect(service.updateExternalAPI).toBeCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when error', async () => {
    const { res, next } = getMockRes();
    service.updateExternalAPI = jest.fn().mockRejectedValueOnce(new Error('Async error message'));

    await controller.updateExternalAPI(req, res, next);
    expect(service.updateExternalAPI).toBeCalledTimes(1);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toBeCalledTimes(1);
  });
});

describe('getExternalAPIStatusCodes', () => {
  it('should  call service', async () => {
    const { res, next } = getMockRes();
    service.getExternalAPIStatusCodes = jest.fn().mockReturnValue({});

    await controller.getExternalAPIStatusCodes(req, res, next);
    expect(service.getExternalAPIStatusCodes).toBeCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when error', async () => {
    const { res, next } = getMockRes();
    service.getExternalAPIStatusCodes = jest.fn().mockRejectedValueOnce(new Error('Async error message'));

    await controller.getExternalAPIStatusCodes(req, res, next);
    expect(service.getExternalAPIStatusCodes).toBeCalledTimes(1);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toBeCalledTimes(1);
  });
});

describe('feature flag controller', () => {
  const featureService = require('../../../../src/forms/feature/service');
  const validUuid = '11111111-1111-4111-8111-111111111111';
  const currentUser = { usernameIdp: 'tester@idir' };

  it('listFeatureFlags responds 200 with the admin catalog', async () => {
    const { res, next } = getMockRes();
    featureService.listAdmin = jest.fn().mockResolvedValue([{ code: 'offlineForms' }]);

    await controller.listFeatureFlags({ params: {}, body: {} }, res, next);

    expect(featureService.listAdmin).toBeCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('readFeatureFlag responds 200 with the feature detail', async () => {
    const { res, next } = getMockRes();
    featureService.readFeature = jest.fn().mockResolvedValue({ code: 'offlineForms' });

    await controller.readFeatureFlag({ params: { code: 'offlineForms' } }, res, next);

    expect(featureService.readFeature).toBeCalledWith('offlineForms');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateFeatureFlag returns 422 when allowAll is not a boolean', async () => {
    const { res, next } = getMockRes();
    featureService.setAllowAll = jest.fn();

    await controller.updateFeatureFlag({ params: { code: 'offlineForms' }, body: {}, currentUser }, res, next);

    expect(featureService.setAllowAll).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 422 }));
  });

  it('updateFeatureFlag sets allowAll and responds 200', async () => {
    const { res, next } = getMockRes();
    featureService.setAllowAll = jest.fn().mockResolvedValue({ code: 'offlineForms', allowAll: true });

    await controller.updateFeatureFlag({ params: { code: 'offlineForms' }, body: { allowAll: true }, currentUser }, res, next);

    expect(featureService.setAllowAll).toBeCalledWith('offlineForms', true, currentUser);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('addFeatureFlagForm returns 422 on an invalid formId', async () => {
    const { res, next } = getMockRes();
    featureService.addForm = jest.fn();

    await controller.addFeatureFlagForm({ params: { code: 'offlineForms' }, body: { formId: 'bad' }, currentUser }, res, next);

    expect(featureService.addForm).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 422 }));
  });

  it('addFeatureFlagForm responds 201 on a valid formId', async () => {
    const { res, next } = getMockRes();
    featureService.addForm = jest.fn().mockResolvedValue({ id: 'row' });

    await controller.addFeatureFlagForm({ params: { code: 'offlineForms' }, body: { formId: validUuid }, currentUser }, res, next);

    expect(featureService.addForm).toBeCalledWith('offlineForms', validUuid, currentUser);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('removeFeatureFlagForm responds 204', async () => {
    const { res, next } = getMockRes();
    featureService.removeForm = jest.fn().mockResolvedValue(1);

    await controller.removeFeatureFlagForm({ params: { code: 'offlineForms', formId: validUuid } }, res, next);

    expect(featureService.removeForm).toBeCalledWith('offlineForms', validUuid);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('addFeatureFlagTenant returns 422 on an invalid tenantId', async () => {
    const { res, next } = getMockRes();
    featureService.addTenant = jest.fn();

    await controller.addFeatureFlagTenant({ params: { code: 'offlineForms' }, body: { tenantId: 'bad' }, currentUser }, res, next);

    expect(featureService.addTenant).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 422 }));
  });

  it('removeFeatureFlagTenant returns 422 on an invalid tenantId', async () => {
    const { res, next } = getMockRes();
    featureService.removeTenant = jest.fn();

    await controller.removeFeatureFlagTenant({ params: { code: 'offlineForms', tenantId: 'bad' } }, res, next);

    expect(featureService.removeTenant).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 422 }));
  });
});
