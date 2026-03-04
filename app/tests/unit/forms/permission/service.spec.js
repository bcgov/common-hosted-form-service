const uuid = require('uuid');

const { Permissions } = require('../../../../src/forms/common/constants');

jest.mock('../../../../src/forms/common/models', () => ({
  FormSubmissionUser: {
    startTransaction: jest.fn(),
    query: jest.fn(),
  },
  Permission: {
    query: jest.fn(),
  },
}));

const { FormSubmissionUser, Permission } = require('../../../../src/forms/common/models');
const service = require('../../../../src/forms/permission/service');

const submissionId = uuid.v4();
const currentUser = {
  usernameIdp: 'TESTER',
};

const makeTrx = () => ({
  commit: jest.fn(),
  rollback: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('list', () => {
  it('should query permissions with classic roles graph', async () => {
    const result = [{ code: Permissions.FORM_READ }];
    const queryBuilder = {
      allowGraph: jest.fn().mockReturnThis(),
      withGraphFetched: jest.fn().mockReturnThis(),
      modify: jest.fn().mockResolvedValue(result),
    };
    Permission.query.mockReturnValue(queryBuilder);

    const response = await service.list();

    expect(Permission.query).toHaveBeenCalledTimes(1);
    expect(queryBuilder.allowGraph).toHaveBeenCalledWith('[roles]');
    expect(queryBuilder.withGraphFetched).toHaveBeenCalledWith('roles(orderDefault, classicOnly)');
    expect(queryBuilder.modify).toHaveBeenCalledWith('orderDefault');
    expect(response).toEqual(result);
  });
});

describe('read', () => {
  it('should query a permission by code with classic roles graph', async () => {
    const code = Permissions.FORM_READ;
    const result = { code };
    const queryBuilder = {
      findOne: jest.fn().mockReturnThis(),
      allowGraph: jest.fn().mockReturnThis(),
      withGraphFetched: jest.fn().mockReturnThis(),
      throwIfNotFound: jest.fn().mockResolvedValue(result),
    };
    Permission.query.mockReturnValue(queryBuilder);

    const response = await service.read(code);

    expect(Permission.query).toHaveBeenCalledTimes(1);
    expect(queryBuilder.findOne).toHaveBeenCalledWith('code', code);
    expect(queryBuilder.allowGraph).toHaveBeenCalledWith('[roles]');
    expect(queryBuilder.withGraphFetched).toHaveBeenCalledWith('roles(orderDefault, classicOnly)');
    expect(queryBuilder.throwIfNotFound).toHaveBeenCalledTimes(1);
    expect(response).toEqual(result);
  });
});

describe('setUserEditable', () => {
  it('should add SUBMISSION_UPDATE for users with SUBMISSION_READ and commit', async () => {
    const trx = makeTrx();
    FormSubmissionUser.startTransaction.mockResolvedValue(trx);

    const usersQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockResolvedValue([{ userId: 'user-a' }, { userId: 'user-b' }]),
    };

    const insertResult = [{ id: uuid.v4() }];
    const insertQueryBuilder = {
      insert: jest.fn().mockResolvedValue(insertResult),
    };

    FormSubmissionUser.query.mockReturnValueOnce(usersQueryBuilder).mockReturnValueOnce(insertQueryBuilder);

    const response = await service.setUserEditable(submissionId, currentUser);

    expect(FormSubmissionUser.startTransaction).toHaveBeenCalledTimes(1);
    expect(usersQueryBuilder.select).toHaveBeenCalledWith('userId');
    expect(usersQueryBuilder.where).toHaveBeenCalledWith('formSubmissionId', submissionId);
    expect(usersQueryBuilder.whereIn).toHaveBeenCalledWith('permission', [Permissions.SUBMISSION_READ]);
    expect(FormSubmissionUser.query).toHaveBeenNthCalledWith(2, trx);
    expect(insertQueryBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: 'user-a',
        formSubmissionId: submissionId,
        permission: Permissions.SUBMISSION_UPDATE,
        createdBy: currentUser.usernameIdp,
      }),
      expect.objectContaining({
        userId: 'user-b',
        formSubmissionId: submissionId,
        permission: Permissions.SUBMISSION_UPDATE,
        createdBy: currentUser.usernameIdp,
      }),
    ]);
    expect(trx.commit).toHaveBeenCalledTimes(1);
    expect(response).toEqual(insertResult);
  });

  it('should not insert when no read users are found and still commit', async () => {
    const trx = makeTrx();
    FormSubmissionUser.startTransaction.mockResolvedValue(trx);

    const usersQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockResolvedValue([]),
    };

    FormSubmissionUser.query.mockReturnValueOnce(usersQueryBuilder);

    const response = await service.setUserEditable(submissionId, currentUser);

    expect(FormSubmissionUser.query).toHaveBeenCalledTimes(1);
    expect(trx.commit).toHaveBeenCalledTimes(1);
    expect(response).toBeUndefined();
  });

  it('should use provided transaction and not commit internally', async () => {
    const etrx = makeTrx();

    const usersQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockResolvedValue([{ userId: 'user-a' }]),
    };

    const insertQueryBuilder = {
      insert: jest.fn().mockResolvedValue([{ id: uuid.v4() }]),
    };

    FormSubmissionUser.query.mockReturnValueOnce(usersQueryBuilder).mockReturnValueOnce(insertQueryBuilder);

    await service.setUserEditable(submissionId, currentUser, etrx);

    expect(FormSubmissionUser.startTransaction).not.toHaveBeenCalled();
    expect(FormSubmissionUser.query).toHaveBeenNthCalledWith(2, etrx);
    expect(etrx.commit).not.toHaveBeenCalled();
    expect(etrx.rollback).not.toHaveBeenCalled();
  });

  it('should rollback and rethrow when local transaction fails', async () => {
    const trx = makeTrx();
    const error = new Error('db fail');
    FormSubmissionUser.startTransaction.mockResolvedValue(trx);

    const usersQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockRejectedValue(error),
    };

    FormSubmissionUser.query.mockReturnValueOnce(usersQueryBuilder);

    await expect(service.setUserEditable(submissionId, currentUser)).rejects.toThrow(error);
    expect(trx.rollback).toHaveBeenCalledTimes(1);
  });

  it('should not rollback when external transaction fails', async () => {
    const etrx = makeTrx();
    const error = new Error('db fail');

    const usersQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockRejectedValue(error),
    };

    FormSubmissionUser.query.mockReturnValueOnce(usersQueryBuilder);

    await expect(service.setUserEditable(submissionId, currentUser, etrx)).rejects.toThrow(error);
    expect(etrx.rollback).not.toHaveBeenCalled();
  });
});

describe('setUserReadOnly', () => {
  it('should remove SUBMISSION_DELETE and SUBMISSION_UPDATE and commit', async () => {
    const trx = makeTrx();
    FormSubmissionUser.startTransaction.mockResolvedValue(trx);

    const queryBuilder = {
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockResolvedValue(2),
    };

    FormSubmissionUser.query.mockReturnValueOnce(queryBuilder);

    const response = await service.setUserReadOnly(submissionId);

    expect(FormSubmissionUser.startTransaction).toHaveBeenCalledTimes(1);
    expect(FormSubmissionUser.query).toHaveBeenCalledWith(trx);
    expect(queryBuilder.delete).toHaveBeenCalledTimes(1);
    expect(queryBuilder.where).toHaveBeenCalledWith('formSubmissionId', submissionId);
    expect(queryBuilder.whereIn).toHaveBeenCalledWith('permission', [Permissions.SUBMISSION_DELETE, Permissions.SUBMISSION_UPDATE]);
    expect(trx.commit).toHaveBeenCalledTimes(1);
    expect(response).toBe(2);
  });

  it('should use provided transaction and not commit internally', async () => {
    const etrx = makeTrx();

    const queryBuilder = {
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockResolvedValue(1),
    };

    FormSubmissionUser.query.mockReturnValueOnce(queryBuilder);

    await service.setUserReadOnly(submissionId, etrx);

    expect(FormSubmissionUser.startTransaction).not.toHaveBeenCalled();
    expect(FormSubmissionUser.query).toHaveBeenCalledWith(etrx);
    expect(etrx.commit).not.toHaveBeenCalled();
    expect(etrx.rollback).not.toHaveBeenCalled();
  });

  it('should rollback and rethrow when local transaction fails', async () => {
    const trx = makeTrx();
    const error = new Error('db fail');
    FormSubmissionUser.startTransaction.mockResolvedValue(trx);

    const queryBuilder = {
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockRejectedValue(error),
    };

    FormSubmissionUser.query.mockReturnValueOnce(queryBuilder);

    await expect(service.setUserReadOnly(submissionId)).rejects.toThrow(error);
    expect(trx.rollback).toHaveBeenCalledTimes(1);
  });

  it('should not rollback when external transaction fails', async () => {
    const etrx = makeTrx();
    const error = new Error('db fail');

    const queryBuilder = {
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockRejectedValue(error),
    };

    FormSubmissionUser.query.mockReturnValueOnce(queryBuilder);

    await expect(service.setUserReadOnly(submissionId, etrx)).rejects.toThrow(error);
    expect(etrx.rollback).not.toHaveBeenCalled();
  });
});
