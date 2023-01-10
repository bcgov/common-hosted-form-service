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

    const formComponentsHelpInfo = [{
      componentname:'Content',
      morehelpinfolink:'https://helplink.com',
      imageurl:'https://imageurl.com',
      versions:1,
      groupname:'Basic Layout',
      description:'gughuhiuhuih',
      publishstatus:false
    },
    {
      componentname:'Text Field',
      morehelpinfolink:'https://helplink.com',
      imageurl:'https://imageurl.com',
      versions:1,
      groupname:'Basic Layout',
      description:'gughuhiuhuih',
      publishstatus:false
    }];

    service.listFormComponentsHelpInfo = jest.fn().mockReturnValue(formComponentsHelpInfo);

    await controller.listFormComponentsHelpInfo(req, {}, jest.fn());
    expect(service.listFormComponentsHelpInfo).toHaveBeenCalledTimes(1);
  });
});
