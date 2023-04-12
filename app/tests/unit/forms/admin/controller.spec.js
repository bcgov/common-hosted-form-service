const controller = require('../../../../src/forms/admin/controller');
const service = require('../../../../src/forms/admin/service');

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
    expect(service.createFormComponentsProactiveHelp).toHaveBeenCalledTimes(1);
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
    expect(service.updateFormComponentsProactiveHelp).toHaveBeenCalledTimes(1);
  });

  it('should get list of all proactive help components', async () => {
    service.listFormComponentsProactiveHelp = jest.fn().mockReturnValue({});

    await controller.listFormComponentsProactiveHelp(req, {}, jest.fn());
    expect(service.listFormComponentsProactiveHelp).toHaveBeenCalledTimes(1);
  });
});
