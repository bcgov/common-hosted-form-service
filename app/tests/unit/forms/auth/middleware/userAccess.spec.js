const currentUser = require('../../../../../src/forms/auth/middleware/userAccess').currentUser;
const hasFormPermissions = require('../../../../../src/forms/auth/middleware/userAccess').hasFormPermissions;
const hasSubmissionPermissions = require('../../../../../src/forms/auth/middleware/userAccess').hasSubmissionPermissions;
const keycloak = require('../../../../../src/components/keycloak');
const Problem = require('api-problem');
const service = require('../../../../../src/forms/auth/service');

const kauth = {
  grant: {
    access_token: 'fsdfhsd08f0283hr'
  }
};

// Mock the token validation in the KC lib
keycloak.grantManager.validateAccessToken = jest.fn().mockReturnValue('yeah ok');

// Mock the service login
const mockUser = { user: 'me' };
service.login = jest.fn().mockReturnValue(mockUser);

afterEach(() => {
  jest.clearAllMocks();
});


describe('currentUser', () => {
  it('gets the current user with valid request', async () => {
    const testReq = {
      params: {
        formId: 2
      },
      headers: {
        authorization: 'abca435hjvds0uds'
      },
      kauth: kauth
    };

    const nxt = jest.fn();

    await currentUser(testReq, undefined, nxt);
    expect(keycloak.grantManager.validateAccessToken).toHaveBeenCalledTimes(1);
    expect(keycloak.grantManager.validateAccessToken).toHaveBeenCalledWith('hjvds0uds');
    expect(service.login).toHaveBeenCalledTimes(1);
    expect(service.login).toHaveBeenCalledWith(kauth.grant.access_token, { formId: 2 });
    expect(testReq.currentUser).toEqual(mockUser);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });


  it('prioritizes the url param if both url and query are provided', async () => {
    const testReq = {
      params: {
        formId: 2
      },
      query: {
        formId: 99
      },
      headers: {
        authorization: 'abca435hjvds0uds'
      },
      kauth: kauth
    };

    await currentUser(testReq, undefined, jest.fn());
    expect(service.login).toHaveBeenCalledWith(kauth.grant.access_token, { formId: 2 });
  });

  it('user the query param if both if that is whats provided', async () => {
    const testReq = {
      query: {
        formId: 99
      },
      headers: {
        authorization: 'abca435hjvds0uds'
      },
      kauth: kauth
    };

    await currentUser(testReq, undefined, jest.fn());
    expect(service.login).toHaveBeenCalledWith(kauth.grant.access_token, { formId: 99 });
  });


  it('403s if the token is invalid', async () => {
    const testReq = {
      headers: {
        authorization: 'abca435hjvds0uds'
      }
    };

    const nxt = jest.fn();
    keycloak.grantManager.validateAccessToken = jest.fn().mockReturnValue(undefined);

    await currentUser(testReq, undefined, nxt);
    expect(keycloak.grantManager.validateAccessToken).toHaveBeenCalledTimes(1);
    expect(keycloak.grantManager.validateAccessToken).toHaveBeenCalledWith('hjvds0uds');
    expect(service.login).toHaveBeenCalledTimes(0);
    expect(testReq.currentUser).toEqual(undefined);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(403, { detail: 'Authorization token is invalid.' }));

  });
});

describe('getToken', () => {
  it('returns a null token if no kauth in the request', async () => {
    const testReq = {
      params: {
        formId: 2
      }
    };

    await currentUser(testReq, undefined, jest.fn());
    expect(service.login).toHaveBeenCalledTimes(1);
    expect(service.login).toHaveBeenCalledWith(null, { formId: 2 });

  });
});


describe('hasFormPermissions', () => {
  it('returns a middleware function', async () => {
    const mw = hasFormPermissions(['abc']);
    expect(mw).toBeInstanceOf(Function);
  });

  it('401s if the request has no current user', async () => {
    const mw = hasFormPermissions(['abc']);
    const nxt = jest.fn();
    const req = { a: '1' };

    mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Current user not found on request.' }));

  });

  it('401s if the request has no formId', async () => {
    const mw = hasFormPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: 1
      },
      params: {
        submissionId: 123
      },
      query: {
        otherQueryThing: 'abc'
      }
    };

    mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Form Id not found on request.' }));

  });

  it('401s if the user does not have access to the form', async () => {
    const mw = hasFormPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [{
          formId: '456'
        }, {
          formId: '789'
        }]
      },
      params: {
        formId: '123'
      }
    };

    mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Current user has no access to form.' }));
  });

  it('401s if the user does not have access to the form nor is it in their deleted', async () => {
    const mw = hasFormPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [{
          formId: '456'
        }, {
          formId: '789'
        }],
        deletedForms: [{
          formId: '888'
        }, {
          formId: '999'
        }]
      },
      params: {
        formId: '123'
      }
    };

    mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Current user has no access to form.' }));
  });

  it('does not 401 if the user has deleted form access', async () => {
    const mw = hasFormPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [{
          formId: '456'
        }, {
          formId: '789'
        }],
        deletedForms: [{
          formId: '888'
        }, {
          formId: '123',
          permissions: ['abc']
        }]
      },
      params: {
        formId: '123'
      }
    };

    mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('401s if the expected permissions are not included', async () => {
    const mw = hasFormPermissions(['FORM_READ', 'SUBMISSION_DELETE', 'DESIGN_CREATE']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [{
          formId: '456'
        }, {
          formId: '123',
          permissions: ['FORM_READ', 'SUBMISSION_READ', 'DESIGN_CREATE']
        }]
      },
      params: {
        formId: '123'
      }
    };

    mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Current user does not have required permission(s) on form.' }));
  });

  it('401s if the expected permissions are not included (string, not array check)', async () => {
    const mw = hasFormPermissions('FORM_READ');
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [{
          formId: '456'
        }, {
          formId: '123',
          permissions: ['FORM_DELETE']
        }]
      },
      params: {
        formId: '123'
      }
    };

    mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Current user does not have required permission(s) on form.' }));
  });

  it('moves on if the expected permissions are included', async () => {
    const mw = hasFormPermissions(['FORM_READ', 'SUBMISSION_DELETE', 'DESIGN_CREATE']);
    const nxt = jest.fn();
    const req = {
      currentUser: {
        forms: [{
          formId: '456'
        }, {
          formId: '123',
          permissions: ['FORM_READ', 'SUBMISSION_DELETE', 'DESIGN_CREATE']
        }]
      },
      params: {
        formId: '123'
      }
    };

    mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

});

describe('hasSubmissionPermissions', () => {
  it('returns a middleware function', () => {
    const mw = hasSubmissionPermissions(['abc']);
    expect(mw).toBeInstanceOf(Function);
  });

  it('401s if the request has no formId', async () => {
    const mw = hasSubmissionPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      params: {
        formId: 123
      },
      query: {
        otherQueryThing: 'abc'
      }
    };

    await mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'Submission Id not found on request.' }));
  });

  it('401s if the submission was deleted', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({ submission: { deleted: true } });

    const mw = hasSubmissionPermissions(['abc']);
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    expect(service.getSubmissionForm).toHaveBeenCalledTimes(1);
    expect(service.getSubmissionForm).toHaveBeenCalledWith(123);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('moves on if the form is public and you are only requesting read permission', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'random' }, { code: 'public' }] }
    });

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('moves on if the form is public and you are only requesting read permission (only 1 idp)', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'public' }] }
    });

    const mw = hasSubmissionPermissions(['submission_read']);
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('does not allow public access if more than read permission is needed', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'public' }] }
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions(['submission_read', 'submission_delete']);
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(undefined, 123, ['submission_read', 'submission_delete']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('does not allow public access if the form does not have the public idp', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'idir' }, { code: 'bceid' }] }
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(undefined, 123, ['submission_read']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('moves on if the permission check query succeeds', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'idir' }, { code: 'bceid' }] }
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(true);

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const req = {
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });


  it('falls through to the query if the current user has no forms', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { identityProviders: [{ code: 'idir' }, { code: 'bceid' }] }
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const cu = {
      forms: []
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(cu, 123, ['submission_read']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('falls through to the query if the current user does not have any FORM access on the current form', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: { id: '999', identityProviders: [{ code: 'idir' }, { code: 'bceid' }] }
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const cu = {
      forms: [{
        formId: '456'
      }, {
        formId: '789'
      }]
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(cu, 123, ['submission_read']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('falls through to the query if the current user does not have the expected permission for FORM access on the current form', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: {
        id: '999',
        identityProviders: [{ code: 'idir' }, { code: 'bceid' }]
      }
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions(['submission_delete', 'submission_create']);
    const nxt = jest.fn();
    const cu = {
      forms: [{
        formId: '456'
      }, {
        formId: '999',
        permissions: ['submission_read', 'submission_update'],
      }]
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(cu, 123, ['submission_delete', 'submission_create']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('falls through to the query if the current user does not have the expected permission for FORM access on the current form (single check)', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: {
        id: '999',
        identityProviders: [{ code: 'idir' }, { code: 'bceid' }]
      }
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions('submission_delete');
    const nxt = jest.fn();
    const cu = {
      forms: [{
        formId: '456'
      }, {
        formId: '999',
        permissions: ['submission_read'],
      }]
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(1);
    expect(service.checkSubmissionPermission).toHaveBeenCalledWith(cu, 123, ['submission_delete']);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith(new Problem(401, { detail: 'You do not have access to this submission.' }));
  });

  it('moves on if the user has the appropriate requested permissions', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: {
        id: '999',
        identityProviders: [{ code: 'idir' }, { code: 'bceid' }]
      }
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions(['submission_read', 'submission_update']);
    const nxt = jest.fn();
    const cu = {
      forms: [{
        formId: '456'
      }, {
        formId: '999',
        permissions: ['submission_read', 'submission_update'],
      }]
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });

  it('moves on if the user has the appropriate requested permissions (single included in array)', async () => {
    service.getSubmissionForm = jest.fn().mockReturnValue({
      submission: { deleted: false },
      form: {
        id: '999',
        identityProviders: [{ code: 'idir' }, { code: 'bceid' }]
      }
    });
    service.checkSubmissionPermission = jest.fn().mockReturnValue(undefined);

    const mw = hasSubmissionPermissions('submission_read');
    const nxt = jest.fn();
    const cu = {
      forms: [{
        formId: '456'
      }, {
        formId: '999',
        permissions: ['submission_read', 'submission_update', 'submission_delete'],
      }]
    };
    const req = {
      currentUser: cu,
      params: {
        formSubmissionId: 123
      }
    };

    await mw(req, undefined, nxt);
    // just run to the end and fall into the base case
    expect(service.checkSubmissionPermission).toHaveBeenCalledTimes(0);
    expect(nxt).toHaveBeenCalledTimes(1);
    expect(nxt).toHaveBeenCalledWith();
  });


});
