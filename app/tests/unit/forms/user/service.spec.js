const { MockModel, MockTransaction } = require('../../../common/dbHelper');

jest.mock('../../../../src/forms/common/models/tables/user', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/userFormPreferences', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/label', () => MockModel);

const service = require('../../../../src/forms/user/service');
const idpService = require('../../../../src/components/idpService');

const formId = '4d33f4cb-0b72-4c3d-9e41-f2651805fee1';
const userId = 'cc8c64b7-a457-456e-ade0-09ff7ee75a2b';
const preferences = { columns: [] };

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

idpService.findByCode = jest.fn().mockReturnValue(null);

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

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith();
    expect(MockModel.modify).toBeCalledTimes(9);
    expect(MockModel.modify).toBeCalledWith('filterIdpUserId', params.idpUserId);
    expect(MockModel.modify).toBeCalledWith('filterIdpCode', params.idpCode);
    expect(MockModel.modify).toBeCalledWith('filterUsername', params.username, false, false);
    expect(MockModel.modify).toBeCalledWith('filterFullName', params.fullName);
    expect(MockModel.modify).toBeCalledWith('filterFirstName', params.firstName);
    expect(MockModel.modify).toBeCalledWith('filterLastName', params.lastName);
    expect(MockModel.modify).toBeCalledWith('filterEmail', params.email, false, false);
    expect(MockModel.modify).toBeCalledWith('filterSearch', params.search);
    expect(MockModel.modify).toBeCalledWith('orderLastFirstAscending');
  });
});

describe('read', () => {
  it('should query user table by id', async () => {
    await service.read(userId);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith();
    expect(MockModel.findById).toBeCalledTimes(1);
    expect(MockModel.findById).toBeCalledWith(userId);
    expect(MockModel.throwIfNotFound).toBeCalledTimes(1);
    expect(MockModel.throwIfNotFound).toBeCalledWith();
  });
});

describe('deleteUserPreferences', () => {
  it('should delete user form preference table by user id', async () => {
    await service.deleteUserPreferences({ id: userId });

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith();
    expect(MockModel.delete).toBeCalledTimes(1);
    expect(MockModel.delete).toBeCalledWith();
    expect(MockModel.where).toBeCalledTimes(1);
    expect(MockModel.where).toBeCalledWith('userId', userId);
    expect(MockModel.throwIfNotFound).toBeCalledTimes(1);
    expect(MockModel.throwIfNotFound).toBeCalledWith();
  });
});

describe('readUserPreferences', () => {
  it('should query user form preference table by user id', async () => {
    await service.readUserPreferences({ id: userId });

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith();
    expect(MockModel.where).toBeCalledTimes(1);
    expect(MockModel.where).toBeCalledWith('userId', userId);
  });
});

describe('deleteUserFormPreferences', () => {
  it('should delete user form preference table by user id', async () => {
    await service.deleteUserFormPreferences({ id: userId }, formId);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith();
    expect(MockModel.deleteById).toBeCalledTimes(1);
    expect(MockModel.deleteById).toBeCalledWith([userId, formId]);
    expect(MockModel.throwIfNotFound).toBeCalledTimes(1);
    expect(MockModel.throwIfNotFound).toBeCalledWith();
  });
});

describe('readUserFormPreferences', () => {
  it('should query user form preference table by user id', async () => {
    await service.readUserFormPreferences({ id: userId }, formId);

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith();
    expect(MockModel.findById).toBeCalledTimes(1);
    expect(MockModel.findById).toBeCalledWith([userId, formId]);
    expect(MockModel.first).toBeCalledTimes(1);
    expect(MockModel.first).toBeCalledWith();
  });
});

describe('readUserLabels', () => {
  it('should query user labels by user id', async () => {
    await service.readUserLabels({ id: userId });

    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith();
    expect(MockModel.where).toBeCalledTimes(1);
    expect(MockModel.where).toBeCalledWith('userId', userId);
    expect(MockModel.select).toBeCalledWith('labelText');
  });
});

describe('updateUserLabels', () => {
  const body = ['survey', 'registration', 'feedback'];

  it('should insert new labels', async () => {
    MockModel.mockResolvedValue(undefined);

    await service.updateUserLabels({ id: userId }, body);

    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledTimes(body.length * 2 + 1);
    expect(MockModel.query).toBeCalledWith(expect.anything());
    expect(MockModel.insert).toBeCalledTimes(body.length);
    expect(MockModel.insert).toBeCalledWith({
      id: expect.any(String),
      userId: userId,
      labelText: expect.any(String),
    });
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should throw when invalid options are provided', () => {
    MockModel.mockResolvedValue(undefined);
    const fn = (currentUser, body) => service.updateUserLabels(currentUser, body);

    expect(fn({ id: userId }, undefined)).rejects.toThrow();
    expect(fn({ id: userId }, {})).rejects.toThrow();
    expect(MockModel.startTransaction).toBeCalledTimes(0);
    expect(MockModel.query).toBeCalledTimes(0);
  });

  it('should handle empty label body', async () => {
    await service.updateUserLabels({ id: userId }, []);

    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.insert).not.toBeCalled();
    expect(MockTransaction.commit).toBeCalledTimes(1);
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
    expect(MockModel.startTransaction).toBeCalledTimes(0);
    expect(MockModel.query).toBeCalledTimes(0);
  });

  it('should insert preferences', async () => {
    MockModel.mockResolvedValue(undefined);
    readUserPreferencesSpy.mockResolvedValue(undefined);
    readUserFormPreferencesSpy.mockResolvedValue(undefined);

    await service.updateUserPreferences({ id: userId }, body);

    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith(expect.anything());
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith({
      userId: userId,
      formId: formId,
      preferences: preferences,
      createdBy: undefined,
    });
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should update preferences', async () => {
    MockModel.mockResolvedValue({});
    readUserPreferencesSpy.mockResolvedValue({});
    readUserFormPreferencesSpy.mockResolvedValue({});

    await service.updateUserPreferences({ id: userId }, body);

    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith(expect.anything());
    expect(MockModel.patchAndFetchById).toBeCalledTimes(1);
    expect(MockModel.patchAndFetchById).toBeCalledWith([userId, formId], {
      preferences: preferences,
      updatedBy: undefined,
    });
    expect(MockTransaction.commit).toBeCalledTimes(1);
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

    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith(expect.anything());
    expect(MockModel.insertAndFetch).toBeCalledTimes(1);
    expect(MockModel.insertAndFetch).toBeCalledWith({
      userId: userId,
      formId: formId,
      preferences: preferences,
      createdBy: undefined,
    });
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should update preferences', async () => {
    MockModel.mockResolvedValue({});
    readUserFormPreferencesSpy.mockResolvedValue({});

    await service.updateUserFormPreferences({ id: userId }, formId, preferences);

    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith(expect.anything());
    expect(MockModel.patchAndFetchById).toBeCalledTimes(1);
    expect(MockModel.patchAndFetchById).toBeCalledWith([userId, formId], {
      preferences: preferences,
      updatedBy: undefined,
    });
    expect(MockTransaction.commit).toBeCalledTimes(1);
  });

  it('should handle errors gracefully', async () => {
    MockModel.mockResolvedValue(undefined);
    readUserFormPreferencesSpy.mockImplementation(() => {
      throw new Error();
    });

    const fn = () => service.updateUserFormPreferences({ id: userId }, formId, preferences);

    await expect(fn()).rejects.toThrow();
    expect(MockModel.startTransaction).toBeCalledTimes(0);
    expect(MockModel.query).toBeCalledTimes(0);
  });
});
