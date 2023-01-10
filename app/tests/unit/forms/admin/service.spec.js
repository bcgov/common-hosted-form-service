const service = require('../../../../src/forms/admin/service');
const { MockModel, MockTransaction } = require('../../../common/dbHelper')

jest.mock('../../../../src/forms/common/models/tables/formComponentsHelpInfo', () => MockModel);

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

describe('Admin service', () => {
  it('should handle a blank everything', () => {
    const formComponentsHelpInfo ={
      componentName:'Text Field',
      moreHelpInfoLink:'https://helplink.com',
      imageurl:'https://imageurl.com',
      versions:1,
      groupName:'Basic Layout',
      description:'gughuhiuhuih',
      status:false
    };

    service.createFormComponentsHelpInfo(formComponentsHelpInfo);

    expect(MockModel.startTransaction).toHaveBeenCalledTimes(0);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.modify).toHaveBeenCalledTimes(1);
    expect(MockModel.modify).toHaveBeenCalledWith('findByComponentName', formComponentsHelpInfo.componentName);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.insert).toHaveBeenCalledTimes(1);
    expect(MockModel.insert).toHaveBeenCalledWith(formComponentsHelpInfo);
    //expect(service._fetchSubmissionData).toHaveBeenCalledTimes(1);
    //expect(service._fetchSubmissionData).toHaveBeenCalledWith('abc');


    //const fileIds = service._findFileIds(schema, data);
    //expect(fileIds).toEqual([]);
  });
});
