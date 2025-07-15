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
