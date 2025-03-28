const controller = require('../../../../src/forms/rbac/controller');
const service = require('../../../../src/forms/rbac/service');
const emailService = require('../../../../src/forms/email/emailService');
const formService = require('../../../../../app/src/forms/submission/service');

jest.mock('../../../../src/forms/rbac/service');

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getSubmissionUsers', () => {
  const req = {
    query: { formSubmissionId: '1', userId: '2' },
    body: { permissions: [] },
    currentUser: {},
    headers: { referer: 'a' },
  };
  it('should call the service with the query params', async () => {
    service.getSubmissionUsers = jest.fn().mockReturnValue({ form: { id: '123' } });
    await controller.getSubmissionUsers(req, {}, jest.fn());

    expect(service.getSubmissionUsers).toBeCalledTimes(1);
    expect(service.getSubmissionUsers).toBeCalledWith(req.query);
  });
});

describe('setSubmissionUserPermissions', () => {
  const req = {
    query: { formSubmissionId: '1', userId: '2', selectedUserEmail: 'a@a.com' },
    body: { permissions: [1, 2, 3] },
    currentUser: { me: 'I' },
    headers: { referer: 'a' },
  };
  it('should call the service with the appropriate request stuff', async () => {
    formService.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.modifySubmissionUser = jest.fn().mockReturnValue({ form: { id: '123' } });
    emailService.submissionAssigned = jest.fn().mockReturnValue({});
    await controller.setSubmissionUserPermissions(req, {}, jest.fn());

    expect(service.modifySubmissionUser).toBeCalledTimes(1);
    expect(service.modifySubmissionUser).toBeCalledWith(req.query.formSubmissionId, req.query.userId, req.body, req.currentUser);
  });
});

describe('getCurrentUserForms', () => {
  const req = {
    query: { formId: '1' },
    body: { permissions: [] },
    currentUser: {},
    headers: { referer: 'a' },
  };
  it('should call the service with the query params', async () => {
    service.getCurrentUserForms = jest.fn().mockReturnValue([]);
    await controller.getCurrentUserForms(req, {}, jest.fn());

    expect(service.getCurrentUserForms).toBeCalledTimes(1);
    expect(service.getCurrentUserForms).toBeCalledWith(req.currentUser, req.query);
  });
});

describe('getCurrentUserForms', () => {
  const req = {
    query: { formId: '1' },
    body: { permissions: [] },
    currentUser: {},
    headers: { referer: 'a' },
  };
  it('should call the service with the query params', async () => {
    service.getCurrentUserForms = jest.fn().mockReturnValue([]);
    await controller.getCurrentUserForms(req, {}, jest.fn());

    expect(service.getCurrentUserForms).toBeCalledTimes(1);
    expect(service.getCurrentUserForms).toBeCalledWith(req.currentUser, req.query);
  });
});

describe('controller.isUserPartOfFormTeams', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {
        formId: '3d338420-b272-4b4b-8b08-756ed5b1576c',
        email: 'test@gg.com',
        roles: '*',
        active: true,
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  it('responds with 200 and the service result', async () => {
    const mockResult = true;
    service.isUserPartOfFormTeams.mockResolvedValue(mockResult);

    await controller.isUserPartOfFormTeams(req, res, next);

    expect(service.isUserPartOfFormTeams).toHaveBeenCalledWith(req.query);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error on failure', async () => {
    const error = new Error('Oops');
    service.isUserPartOfFormTeams.mockRejectedValue(error);

    await controller.isUserPartOfFormTeams(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
