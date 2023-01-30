const controller = require('../../../../src/forms/form/controller');
const service = require('../../../../src/forms/form/service');

const req = {
  params: {},
  body: {},
  currentUser: {},
  headers: {},
};


describe('form controller', () => {
  it('should get proactive help object', async () => {

    service.readFormComponentsProactiveHelp = jest.fn().mockReturnValue({});

    await controller.readFormComponentsProactiveHelp(req, {}, jest.fn());
    expect(service.readFormComponentsProactiveHelp).toHaveBeenCalledTimes(1);
  });

  it('should get form component names for proactive help', async () => {

    service.listFormComponentsnamesProactiveHelp= jest.fn().mockReturnValue({});

    await controller.listFormComponentsnamesProactiveHelp(req, {}, jest.fn());
    expect(service.listFormComponentsnamesProactiveHelp).toHaveBeenCalledTimes(1);
  });


});
