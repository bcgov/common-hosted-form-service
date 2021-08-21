const MockModel = require('../../../common/mockModel');
jest.mock('../../../../src/forms/common/models/tables/user', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/userFormPreferences', () => MockModel);

const service = require('../../../../src/forms/user/service');

const formId = '4d33f4cb-0b72-4c3d-9e41-f2651805fee1';
const userId = 'cc8c64b7-a457-456e-ade0-09ff7ee75a2b';

beforeEach(() => {
  MockModel.mockReset();
});

describe('list', () => {
  it('should query user table by id', async () => {
    const params = {
      email: 'email',
      firstName: 'firstName',
      fullName: 'fullName',
      keycloakId: 'keycloakId',
      lastName: 'lastName',
      search: 'search',
      username: 'username'
    };

    await service.list(params);

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith();
    expect(MockModel.skipUndefined).toHaveBeenCalledTimes(1);
    expect(MockModel.skipUndefined).toHaveBeenCalledWith();
    expect(MockModel.modify).toHaveBeenCalledTimes(8);
    expect(MockModel.modify).toHaveBeenCalledWith('filterKeycloakId', params.keycloakId);
    expect(MockModel.modify).toHaveBeenCalledWith('filterUsername', params.username);
    expect(MockModel.modify).toHaveBeenCalledWith('filterFullName', params.fullName);
    expect(MockModel.modify).toHaveBeenCalledWith('filterFirstName', params.firstName);
    expect(MockModel.modify).toHaveBeenCalledWith('filterLastName', params.lastName);
    expect(MockModel.modify).toHaveBeenCalledWith('filterEmail', params.email);
    expect(MockModel.modify).toHaveBeenCalledWith('filterSearch', params.search);
    expect(MockModel.modify).toHaveBeenCalledWith('orderLastFirstAscending');
  });
});

describe('read', () => {
  it('should query user table by id', async () => {
    await service.read(userId);

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith();
    expect(MockModel.findById).toHaveBeenCalledTimes(1);
    expect(MockModel.findById).toHaveBeenCalledWith(userId);
    expect(MockModel.throwIfNotFound).toHaveBeenCalledTimes(1);
    expect(MockModel.throwIfNotFound).toHaveBeenCalledWith();
  });
});

describe('deleteUserPreferences', () => {
  it('should delete user form preference table by user id', async () => {
    await service.deleteUserPreferences({ id: userId });

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith();
    expect(MockModel.delete).toHaveBeenCalledTimes(1);
    expect(MockModel.delete).toHaveBeenCalledWith();
    expect(MockModel.where).toHaveBeenCalledTimes(1);
    expect(MockModel.where).toHaveBeenCalledWith('userId', userId);
    expect(MockModel.throwIfNotFound).toHaveBeenCalledTimes(1);
    expect(MockModel.throwIfNotFound).toHaveBeenCalledWith();
  });
});

describe('readUserPreferences', () => {
  it('should query user form preference table by user id', async () => {
    await service.readUserPreferences({ id: userId });

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith();
    expect(MockModel.where).toHaveBeenCalledTimes(1);
    expect(MockModel.where).toHaveBeenCalledWith('userId', userId);
  });
});

describe('deleteUserFormPreferences', () => {
  it('should delete user form preference table by user id', async () => {
    await service.deleteUserFormPreferences({ id: userId }, formId);

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith();
    expect(MockModel.deleteById).toHaveBeenCalledTimes(1);
    expect(MockModel.deleteById).toHaveBeenCalledWith([userId, formId]);
    expect(MockModel.throwIfNotFound).toHaveBeenCalledTimes(1);
    expect(MockModel.throwIfNotFound).toHaveBeenCalledWith();
  });
});

describe('readUserFormPreferences', () => {
  it('should query user form preference table by user id', async () => {
    await service.readUserFormPreferences({ id: userId }, formId);

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith();
    expect(MockModel.findById).toHaveBeenCalledTimes(1);
    expect(MockModel.findById).toHaveBeenCalledWith([userId, formId]);
    expect(MockModel.first).toHaveBeenCalledTimes(1);
    expect(MockModel.first).toHaveBeenCalledWith();
  });
});
