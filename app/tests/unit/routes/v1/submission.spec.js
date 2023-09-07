const request = require('supertest');
const Problem = require('api-problem');

const { expressHelper } = require('../../../common/helper');

//
// mock middleware
//
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
userAccess.currentUser = jest.fn((req, res, next) => {
  next();
});
userAccess.hasSubmissionPermissions = jest.fn(() => {
  return jest.fn((req, res, next) => {
    next();
  });
});
userAccess.filterMultipleSubmissions = jest.fn(() => {
  return jest.fn((req, res, next) => {
    next();
  });
});

//
// we will mock the underlying data service calls...
//
const emailService = require('../../../../src/forms/email/emailService');
const service = require('../../../../src/forms/submission/service');

//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/submission/routes');

// Simple Express Server
const basePath = '/submissions';
const app = expressHelper(basePath, router);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`GET ${basePath}/ID`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.read = jest.fn().mockReturnValue({});

    const response = await request(app).get(`${basePath}/ID`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.read = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).get(`${basePath}/ID`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.read = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).get(`${basePath}/ID`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`PUT ${basePath}/ID`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.update = jest.fn().mockReturnValue({});

    const response = await request(app).put(`${basePath}/ID`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.update = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).put(`${basePath}/ID`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error.
    service.update = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).put(`${basePath}/ID`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`DELETE ${basePath}/ID`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.delete = jest.fn().mockReturnValue({});

    const response = await request(app).delete(`${basePath}/ID`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.delete = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).delete(`${basePath}/ID`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.delete = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).delete(`${basePath}/ID`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`GET ${basePath}/ID/notes`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.getNotes = jest.fn().mockReturnValue({});

    const response = await request(app).get(`${basePath}/ID/notes`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.getNotes = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).get(`${basePath}/ID/notes`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.getNotes = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).get(`${basePath}/ID/notes`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`POST ${basePath}/ID/notes`, () => {
  const noteRes = { note: 'responseNote' };
  it('should return 200', async () => {
    // mock a success return value...
    service.addNote = jest.fn().mockReturnValue(noteRes);

    const response = await request(app).post(`${basePath}/ID/notes`, { note: 'requestNote' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.addNote = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).post(`${basePath}/ID/notes`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error.
    service.addNote = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).post(`${basePath}/ID/notes`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`POST ${basePath}/ID/email`, () => {
  const submissionResult = { form: { id: '' }, submission: { id: '' }, version: { id: '' } };
  it('should return 200', async () => {
    // mock a success return value...
    service.read = jest.fn().mockReturnValue(submissionResult);
    emailService.submissionConfirmation = jest.fn().mockReturnValue(true);

    const response = await request(app).post(`${basePath}/ID/email`, { to: 'account@fake.com' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.read = jest.fn(() => {
      throw new Problem(401);
    });
    emailService.submissionConfirmation = jest.fn().mockReturnValue(true);

    const response = await request(app).post(`${basePath}/ID/email`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error.
    service.read = jest.fn(() => {
      throw new Error();
    });
    emailService.submissionConfirmation = jest.fn().mockReturnValue(true);

    const response = await request(app).post(`${basePath}/ID/email`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500 from email service', async () => {
    // mock an unexpected error from email.
    service.read = jest.fn().mockReturnValue(submissionResult);
    emailService.submissionConfirmation = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).post(`${basePath}/ID/email`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`GET ${basePath}/ID/status`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.getStatus = jest.fn().mockReturnValue({});

    const response = await request(app).get(`${basePath}/ID/status`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.getStatus = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).get(`${basePath}/ID/status`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.getStatus = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).get(`${basePath}/ID/status`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`POST ${basePath}/ID/status`, () => {
  const statRes = { code: 'SUBMITTED', user: {} };
  it('should return 200', async () => {
    // mock a success return value...
    service.changeStatusState = jest.fn().mockReturnValue(statRes);
    emailService.statusAssigned = jest.fn().mockReturnValue(true);

    const response = await request(app).post(`${basePath}/ID/status`, { code: 'SUBMITTED', user: {} });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
    expect(emailService.statusAssigned).toHaveBeenCalledTimes(0);
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.changeStatusState = jest.fn(() => {
      throw new Problem(401);
    });
    emailService.statusAssigned = jest.fn().mockReturnValue(true);

    const response = await request(app).post(`${basePath}/ID/status`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error.
    service.changeStatusState = jest.fn(() => {
      throw new Error();
    });
    emailService.statusAssigned = jest.fn().mockReturnValue(true);

    const response = await request(app).post(`${basePath}/ID/status`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`GET ${basePath}/ID/edits`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.listEdits = jest.fn().mockReturnValue({});

    const response = await request(app).get(`${basePath}/ID/edits`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.listEdits = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).get(`${basePath}/ID/edits`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.listEdits = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).get(`${basePath}/ID/edits`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`DELETE ${basePath}/ID/formId/submissions`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.deleteMutipleSubmissions = jest.fn().mockReturnValue({});

    const response = await request(app).delete(`${basePath}/formSubmissionId/formId/submissions`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.deleteMutipleSubmissions = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).delete(`${basePath}/formSubmissionId/formId/submissions`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.deleteMutipleSubmissions = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).delete(`${basePath}/formSubmissionId/formId/submissions`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`PUT ${basePath}/ID/formId/submissions/restore`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.restoreMutipleSubmissions = jest.fn().mockReturnValue({});

    const response = await request(app).put(`${basePath}/formSubmissionId/formId/submissions/restore`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.restoreMutipleSubmissions = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await request(app).put(`${basePath}/:formSubmissionId/formId/submissions/restore`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.restoreMutipleSubmissions = jest.fn(() => {
      throw new Error();
    });

    const response = await request(app).put(`${basePath}/:formSubmissionId/formId/submissions/restore`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});
