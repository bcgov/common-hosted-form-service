const { MockModel, MockTransaction } = require('../../../common/dbHelper');

jest.mock('../../../../src/forms/common/models/tables/user', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/userFormPreferences', () => MockModel);

const service = require('../../../../src/forms/user/service');

const formId = '4d33f4cb-0b72-4c3d-9e41-f2651805fee1';
const userId = 'cc8c64b7-a457-456e-ade0-09ff7ee75a2b';
const preferences = { columns: [] };

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

describe('list', () => {
  it('should query user table by id', async () => {
    const params = {
      email: 'email',
      firstName: 'firstName',
      fullName: 'fullName',
      idpUserId: 'idpUserId',
      lastName: 'lastName',
      search: 'search',
      username: 'username',
      idpCode: 'idp',
    };

    await service.list(params);

    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith();
    expect(MockModel.modify).toHaveBeenCalledTimes(9);
    expect(MockModel.modify).toHaveBeenCalledWith('filterIdpUserId', params.idpUserId);
    expect(MockModel.modify).toHaveBeenCalledWith('filterIdpCode', params.idpCode);
    expect(MockModel.modify).toHaveBeenCalledWith('filterUsername', params.username, false);
    expect(MockModel.modify).toHaveBeenCalledWith('filterFullName', params.fullName);
    expect(MockModel.modify).toHaveBeenCalledWith('filterFirstName', params.firstName);
    expect(MockModel.modify).toHaveBeenCalledWith('filterLastName', params.lastName);
    expect(MockModel.modify).toHaveBeenCalledWith('filterEmail', params.email, false);
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

describe('updateUserPreferences', () => {
  const body = {
    forms: [
      {
        formId: formId,
        preferences: preferences,
      },
    ],
  };
  const readUserPreferencesSpy = jest.spyOn(service, 'readUserPreferences');
  const readUserFormPreferencesSpy = jest.spyOn(service, 'readUserFormPreferences');

  beforeEach(() => {
    readUserPreferencesSpy.mockReset();
    readUserFormPreferencesSpy.mockReset();
  });

  it('should throw when invalid options are provided', () => {
    MockModel.mockResolvedValue(undefined);
    const fn = (currentUser, body) => service.updateUserPreferences(currentUser, body);

    expect(fn({ id: userId }, undefined)).rejects.toThrow();
    expect(fn({ id: userId }, {})).rejects.toThrow();
    expect(fn({ id: userId }, { forms: {} })).rejects.toThrow();
    expect(MockModel.startTransaction).toHaveBeenCalledTimes(0);
    expect(MockModel.query).toHaveBeenCalledTimes(0);
  });

  it('should insert preferences', async () => {
    MockModel.mockResolvedValue(undefined);
    readUserPreferencesSpy.mockResolvedValue(undefined);
    readUserFormPreferencesSpy.mockResolvedValue(undefined);

    await service.updateUserPreferences({ id: userId }, body);

    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.insert).toHaveBeenCalledTimes(1);
    expect(MockModel.insert).toHaveBeenCalledWith({
      userId: userId,
      formId: formId,
      preferences: preferences,
      createdBy: undefined,
    });
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
  });

  it('should update preferences', async () => {
    MockModel.mockResolvedValue({});
    readUserPreferencesSpy.mockResolvedValue({});
    readUserFormPreferencesSpy.mockResolvedValue({});

    await service.updateUserPreferences({ id: userId }, body);

    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.patchAndFetchById).toHaveBeenCalledTimes(1);
    expect(MockModel.patchAndFetchById).toHaveBeenCalledWith([userId, formId], {
      preferences: preferences,
      updatedBy: undefined,
    });
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
  });
});

describe('updateUserFormPreferences', () => {
  const readUserFormPreferencesSpy = jest.spyOn(service, 'readUserFormPreferences');

  beforeEach(() => {
    readUserFormPreferencesSpy.mockReset();
  });

  it('should insert preferences', async () => {
    MockModel.mockReset();
    MockTransaction.mockReset();

    MockModel.mockResolvedValue(undefined);
    readUserFormPreferencesSpy.mockResolvedValue(undefined);
    await service.updateUserFormPreferences({ id: userId }, formId, preferences);

    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.insertAndFetch).toHaveBeenCalledTimes(1);
    expect(MockModel.insertAndFetch).toHaveBeenCalledWith({
      userId: userId,
      formId: formId,
      preferences: preferences,
      createdBy: undefined,
    });
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
  });

  it('should update preferences', async () => {
    MockModel.mockResolvedValue({});
    readUserFormPreferencesSpy.mockResolvedValue({});

    await service.updateUserFormPreferences({ id: userId }, formId, preferences);

    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.patchAndFetchById).toHaveBeenCalledTimes(1);
    expect(MockModel.patchAndFetchById).toHaveBeenCalledWith([userId, formId], {
      preferences: preferences,
      updatedBy: undefined,
    });
    expect(MockTransaction.commit).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully', async () => {
    MockModel.mockResolvedValue(undefined);
    readUserFormPreferencesSpy.mockImplementation(() => {
      throw new Error();
    });

    const fn = () => service.updateUserFormPreferences({ id: userId }, formId, preferences);

    await expect(fn()).rejects.toThrow();
    expect(MockModel.startTransaction).toHaveBeenCalledTimes(0);
    expect(MockModel.query).toHaveBeenCalledTimes(0);
  });
});
