
const service = require('../../../../src/forms/admin/service');

describe('Admin service', () => {
  it('createFormComponentsProactiveHelp()',  async () => {

    const formComponentsHelpInfo = {
      componentName:'Content',
      externalLink:'https://helplink.com',
      image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
      version:1,
      groupName:'Basic Layout',
      description:'gughuhiuhuih',
      status:false
    };

    // mock readVersion function
    service.createFormComponentsProactiveHelp = jest.fn().mockReturnValue( formComponentsHelpInfo  );
    // get fields
    const result = await service.createFormComponentsProactiveHelp();
    // test cases
    expect(result).toEqual(formComponentsHelpInfo);
  });

  it('updateFormComponentsProactiveHelp()',  async () => {

    const formComponentsHelpInfo = {
      componentName:'Content',
      externalLink:'https://helplink.com',
      image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
      version:1,
      groupName:'Basic Layout',
      description:'gughuhiuhuih',
      status:true
    };

    // mock readVersion function
    service.updateFormComponentsProactiveHelp = jest.fn().mockReturnValue( formComponentsHelpInfo  );
    // get fields
    const result = await service.updateFormComponentsProactiveHelp();
    // test cases
    expect(result).toEqual(formComponentsHelpInfo);
  });
});
