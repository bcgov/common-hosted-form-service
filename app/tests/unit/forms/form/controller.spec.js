const controller = require('../../../../src/forms/form/controller');
const service = require('../../../../src/forms/form/service');

const req = {
  params: {},
  body: {},
  currentUser: {},
  headers: {},
};

describe('form controller', () => {
  it('should get proactive help list', async () => {

    const formComponentsProactiveHelp = [{
      componentname:'Content',
      externallink:'https://helplink.com',
      image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
      version:1,
      groupname:'Basic Layout',
      description:'gughuhiuhuih',
      publishstatus:false
    },

    {
      componentname:'Text Field',
      externallink:'https://helplink.com',
      image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
      version:1,
      groupname:'Basic Layout',
      description:'gughuhiuhuih',
      publishstatus:false
    }];

    service.listFormComponentsProactiveHelp = jest.fn().mockReturnValue(formComponentsProactiveHelp);

    await controller.listFormComponentsProactiveHelp(req, {}, jest.fn());
    expect(service.listFormComponentsProactiveHelp).toHaveBeenCalledTimes(1);
  });
});
