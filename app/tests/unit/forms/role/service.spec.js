const { MockModel } = require('../../../common/dbHelper');

jest.mock('../../../../src/forms/common/models/tables/role', () => MockModel);

const service = require('../../../../src/forms/role/service');

beforeEach(() => {
  MockModel.allowGraph = jest.fn().mockReturnThis();
  MockModel.findOne = jest.fn().mockReturnThis();
});

afterEach(() => {
  MockModel.mockReset();
  jest.restoreAllMocks();
});

describe('list', () => {
  it('should query classic roles with permissions graph and default ordering', async () => {
    await service.list();

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledWith('classicOnly');
    expect(MockModel.allowGraph).toBeCalledWith('[permissions]');
    expect(MockModel.withGraphFetched).toBeCalledWith('permissions(orderDefault)');
    expect(MockModel.modify).toBeCalledWith('orderDefault');
  });
});

describe('read', () => {
  it('should query classic role by code with permissions graph', async () => {
    const code = 'form_designer';

    await service.read(code);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledWith('classicOnly');
    expect(MockModel.findOne).toBeCalledWith('code', code);
    expect(MockModel.allowGraph).toBeCalledWith('[permissions]');
    expect(MockModel.withGraphFetched).toBeCalledWith('permissions(orderDefault)');
    expect(MockModel.throwIfNotFound).toBeCalledTimes(1);
  });
});
