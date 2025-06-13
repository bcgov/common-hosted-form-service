const { MockModel, MockTransaction } = require('../../../common/dbHelper');
const service = require('../../../../src/forms/admin/service');

jest.mock('../../../../src/forms/common/models/tables/externalAPI', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/externalAPIStatusCode', () => MockModel);
jest.mock('../../../../src/forms/common/models/views/adminExternalAPI', () => MockModel);

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Admin service', () => {
  it('createFormComponentsProactiveHelp()', async () => {
    const formComponentsHelpInfo = {
      componentName: 'Content',
      externalLink: 'https://helplink.com',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
      version: 1,
      groupName: 'Basic Layout',
      description: 'gughuhiuhuih',
      status: false,
    };

    // mock readVersion function
    service.createFormComponentsProactiveHelp = jest.fn().mockReturnValue(formComponentsHelpInfo);
    // get fields
    const result = await service.createFormComponentsProactiveHelp();
    // test cases
    expect(result).toEqual(formComponentsHelpInfo);
  });

  it('updateFormComponentsProactiveHelp()', async () => {
    const formComponentsHelpInfo = {
      componentName: 'Content',
      externalLink: 'https://helplink.com',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
      version: 1,
      groupName: 'Basic Layout',
      description: 'gughuhiuhuih',
      status: true,
    };

    // mock readVersion function
    service.updateFormComponentsProactiveHelp = jest.fn().mockReturnValue(formComponentsHelpInfo);
    // get fields
    const result = await service.updateFormComponentsProactiveHelp();
    // test cases
    expect(result).toEqual(formComponentsHelpInfo);
  });

  it('listFormComponentsProactiveHelp()', async () => {
    const formComponentsHelpInfo = [
      {
        componentname: 'Content',
        externallink: 'https://helplink.com',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
        version: 1,
        groupname: 'Basic Layout',
        description: 'gughuhiuhuih',
        publishstatus: false,
      },
      {
        componentname: 'Text Field',
        externallink: 'https://helplink.com',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
        version: 1,
        groupname: 'Basic Layout',
        description: 'gughuhiuhuih',
        publishstatus: false,
      },
    ];

    formComponentsHelpInfo.reduce(function (r, a) {
      r[a.groupName] = r[a.groupName] || [];
      r[a.groupName].push(a);
      return r;
    }, Object.create(null));

    // mock readVersion function
    service.listFormComponentsProactiveHelp = jest.fn().mockReturnValue(formComponentsHelpInfo);
    // get fields
    const fields = await service.listFormComponentsProactiveHelp();
    // test cases
    expect(Object.keys(fields).length).toEqual(2);
  });

  it('readFormComponentsProactiveHelp()', async () => {
    const returnValue = {
      componentname: 'Text Field',
      externallink: 'https://helplink.com',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
      version: 1,
      groupname: 'Basic Layout',
      description: 'gughuhiuhuih',
      publishstatus: false,
      id: 1,
    };

    const formComponentsHelpInfo = [
      {
        componentname: 'Content',
        externallink: 'https://helplink.com',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
        version: 1,
        groupname: 'Basic Layout',
        description: 'gughuhiuhuih',
        publishstatus: false,
      },
      {
        componentname: 'Text Field',
        externallink: 'https://helplink.com',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
        version: 1,
        groupname: 'Basic Layout',
        description: 'gughuhiuhuih',
        publishstatus: false,
        id: 1,
      },
    ];

    // mock readVersion function
    service.readFormComponentsProactiveHelp = jest.fn().mockReturnValue(returnValue);
    // get fields
    const fields = await service.readFormComponentsProactiveHelp();
    // test cases
    expect(fields).toEqual(formComponentsHelpInfo[1]);
  });

  it('getExternalAPIs should fetch data', async () => {
    await service.getExternalAPIs({});
    expect(MockModel.query).toBeCalledTimes(1);
  });

  it('updateExternalAPI should patch and fetch', async () => {
    service._approveMany = jest.fn().mockResolvedValueOnce();
    await service.updateExternalAPI('id', { code: 'APPROVED', allowSendUserToken: true });
    expect(MockModel.query).toBeCalledTimes(3);
    expect(MockModel.patchAndFetchById).toBeCalledTimes(1);
    expect(MockModel.patchAndFetchById).toBeCalledWith('id', {
      updatedBy: 'ADMIN',
      code: 'APPROVED',
      allowSendUserToken: true,
    });
    expect(service._approveMany).toBeCalledWith('id', { code: 'APPROVED', allowSendUserToken: true }, expect.anything());
  });

  it('updateExternalAPI should patch and fetch and update user token fields', async () => {
    service._approveMany = jest.fn().mockResolvedValueOnce();
    await service.updateExternalAPI('id', { code: 'APPROVED', allowSendUserToken: false });
    expect(MockModel.query).toBeCalledTimes(3);
    expect(MockModel.patchAndFetchById).toBeCalledTimes(1);
    // should also update user token fields...
    expect(MockModel.patchAndFetchById).toBeCalledWith('id', {
      updatedBy: 'ADMIN',
      code: 'APPROVED',
      allowSendUserToken: false,
      sendUserToken: false,
      userTokenHeader: null,
      userTokenBearer: false,
    });
    expect(service._approveMany).toBeCalledWith('id', { code: 'APPROVED', allowSendUserToken: false }, expect.anything());
  });

  it('getExternalAPIStatusCodes should fetch data', async () => {
    await service.getExternalAPIStatusCodes();
    expect(MockModel.query).toBeCalledTimes(1);
  });
});
