const controller = require('../../../../src/forms/rbac/controller');
const service = require('../../../../src/forms/rbac/service');

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

    expect(service.getSubmissionUsers).toHaveBeenCalledTimes(1);
    expect(service.getSubmissionUsers).toHaveBeenCalledWith(req.query);
  });
});

describe('setSubmissionUserPermissions', () => {
  const req = {
    query: { formSubmissionId: '1', userId: '2' },
    body: { permissions: [1, 2, 3] },
    currentUser: { me: 'I'},
    headers: { referer: 'a' },
  };
  it('should call the service with the appropriate request stuff', async () => {
    service.modifySubmissionUser = jest.fn().mockReturnValue({ form: { id: '123' } });
    await controller.setSubmissionUserPermissions(req, {}, jest.fn());

    expect(service.modifySubmissionUser).toHaveBeenCalledTimes(1);
    expect(service.modifySubmissionUser).toHaveBeenCalledWith(req.query.formSubmissionId, req.query.userId, req.body, req.currentUser);
  });
});
