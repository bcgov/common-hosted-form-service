const request = require('supertest');
const Problem = require('api-problem');

const helper = require('../../../common/helper');

//
// mock middleware
//
const keycloak = require('../../../../src/components/keycloak');
//
// test assumes that caller has appropriate token, we are not testing middleware here...
//
keycloak.protect = jest.fn(() => {
  return jest.fn((req, res, next) => {
    next();
  });
});

const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
userAccess.currentUser = jest.fn((req, res, next) => {
  next();
});
userAccess.hasFormPermissions = jest.fn(() => {
  return jest.fn((req, res, next) => {
    next();
  });
});
//
// we will mock the underlying data service calls...
//
const service = require('../../../../src/forms/form/service');

const exportService = require('../../../../src/forms/form/exportService');

const emailService = require('../../../../src/forms/email/emailService');


//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/form/routes');

// Simple Express Server
const basePath = '/form';
const app = helper.expressHelper(basePath, router);
helper.logHelper();

afterEach(() => {
  jest.clearAllMocks();
});

describe(`GET ${basePath}`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.listForms = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.listForms = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.listForms = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`POST ${basePath}`, () => {

  it('should return 201', async () => {
    // mock a success return value...
    service.createForm = jest.fn().mockReturnValue({});

    const response = await request(app).post(`${basePath}`);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.createForm = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).post(`${basePath}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.createForm = jest.fn(() => { throw new Error(); });

    const response = await request(app).post(`${basePath}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/formId`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.readForm = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/formId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.readForm = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/formId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.readForm = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/formId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`PUT ${basePath}/formId`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.updateForm = jest.fn().mockReturnValue([]);

    const response = await request(app).put(`${basePath}/formId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.updateForm = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).put(`${basePath}/formId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.updateForm = jest.fn(() => { throw new Error(); });

    const response = await request(app).put(`${basePath}/formId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/formId/export`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    exportService.export = jest.fn().mockReturnValue({
      data: {},
      headers: {
        'content-disposition': 'attachment; filename="not-real.csv"',
        'content-type': 'text/csv'
      }
    });

    const response = await request(app).get(`${basePath}/formId/export`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    exportService.export = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/formId/export`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    exportService.export = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/formId/export`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/formId/version`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.readPublishedForm = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/formId/version`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.readPublishedForm = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/formId/version`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.readPublishedForm = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/formId/version`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/formId/submissions`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.listFormSubmissions = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/formId/submissions`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.listFormSubmissions = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/formId/submissions`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.listFormSubmissions = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/formId/submissions`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/formId/versions`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.listVersions = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/formId/versions`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.listVersions = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/formId/versions`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.listVersions = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/formId/versions`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`POST ${basePath}/formId/versions`, () => {

  it('should return 410', async () => {

    const response = await request(app).post(`${basePath}/formId/versions`);

    expect(response.statusCode).toBe(410);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/formId/versions/formVersionId`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.readVersion = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/formId/versions/formVersionId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.readVersion = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/formId/versions/formVersionId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.readVersion = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/formId/versions/formVersionId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`PUT ${basePath}/formId/versions/formVersionId`, () => {

  it('should return 410', async () => {
    const response = await request(app).put(`${basePath}/formId/versions/formVersionId`);

    expect(response.statusCode).toBe(410);
    expect(response.body).toBeTruthy();
  });

});

describe(`POST ${basePath}/formId/versions/formVersionId/publish`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.publishVersion = jest.fn().mockReturnValue({});

    const response = await request(app).post(`${basePath}/formId/versions/formVersionId/publish`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.publishVersion = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).post(`${basePath}/formId/versions/formVersionId/publish`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.publishVersion = jest.fn(() => { throw new Error(); });

    const response = await request(app).post(`${basePath}/formId/versions/formVersionId/publish`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/formId/versions/formVersionId/submissions`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.listSubmissions = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/formId/versions/formVersionId/submissions`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.listSubmissions = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/formId/versions/formVersionId/submissions`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.listSubmissions = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/formId/versions/formVersionId/submissions`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`POST ${basePath}/formId/versions/formVersionId/submissions`, () => {

  const createSubmissionResult = {id: 'id'};
  it('should return 201', async () => {
    // mock a success return value...
    service.createSubmission = jest.fn().mockReturnValue(createSubmissionResult);
    emailService.submissionReceived = jest.fn().mockReturnValue(true);

    const response = await request(app).post(`${basePath}/formId/versions/formVersionId/submissions`);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.createSubmission = jest.fn(() => { throw new Problem(401); });
    emailService.submissionReceived = jest.fn().mockReturnValue(true);

    const response = await request(app).post(`${basePath}/formId/versions/formVersionId/submissions`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.createSubmission = jest.fn(() => { throw new Error(); });
    emailService.submissionReceived = jest.fn().mockReturnValue(true);

    const response = await request(app).post(`${basePath}/formId/versions/formVersionId/submissions`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

  it('should handle error from email service gracefully', async () => {
    service.createSubmission = jest.fn().mockReturnValue(createSubmissionResult);
    emailService._sendSubmissionReceived = jest.fn(() => { throw new Error(); });

    const response = await request(app).post(`${basePath}/formId/versions/formVersionId/submissions`);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/formId/versions/formVersionId/submissions/formSubmissionId`, () => {

  it('should return 410', async () => {
    const response = await request(app).get(`${basePath}/formId/versions/formVersionId/submissions/formSubmissionId`);

    expect(response.statusCode).toBe(410);
    expect(response.body).toBeTruthy();
  });

});

describe(`PUT ${basePath}/formId/versions/formVersionId/submissions/formSubmissionId`, () => {

  it('should return 410', async () => {
    const response = await request(app).put(`${basePath}/formId/versions/formVersionId/submissions/formSubmissionId`);

    expect(response.statusCode).toBe(410);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/formId/drafts`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.listDrafts = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/formId/drafts`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.listDrafts = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/formId/drafts`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.listDrafts = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/formId/drafts`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`POST ${basePath}/formId/drafts`, () => {

  it('should return 201', async () => {
    // mock a success return value...
    service.createDraft = jest.fn().mockReturnValue({});

    const response = await request(app).post(`${basePath}/formId/drafts`);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.createDraft = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).post(`${basePath}/formId/drafts`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.createDraft = jest.fn(() => { throw new Error(); });

    const response = await request(app).post(`${basePath}/formId/drafts`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`GET ${basePath}/formId/drafts/formVersionDraftId`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.readDraft = jest.fn().mockReturnValue([]);

    const response = await request(app).get(`${basePath}/formId/drafts/formVersionDraftId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.readDraft = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).get(`${basePath}/formId/drafts/formVersionDraftId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.readDraft = jest.fn(() => { throw new Error(); });

    const response = await request(app).get(`${basePath}/formId/drafts/formVersionDraftId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`PUT ${basePath}/formId/drafts/formVersionDraftId`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.updateDraft = jest.fn().mockReturnValue([]);

    const response = await request(app).put(`${basePath}/formId/drafts/formVersionDraftId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.updateDraft = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).put(`${basePath}/formId/drafts/formVersionDraftId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.updateDraft = jest.fn(() => { throw new Error(); });

    const response = await request(app).put(`${basePath}/formId/drafts/formVersionDraftId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`DELETE ${basePath}/formId/drafts/formVersionDraftId`, () => {

  it('should return 204', async () => {
    // mock a success return value...
    service.deleteDraft = jest.fn().mockReturnValue([]);

    const response = await request(app).delete(`${basePath}/formId/drafts/formVersionDraftId`);

    expect(response.statusCode).toBe(204);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.deleteDraft = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).delete(`${basePath}/formId/drafts/formVersionDraftId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.deleteDraft = jest.fn(() => { throw new Error(); });

    const response = await request(app).delete(`${basePath}/formId/drafts/formVersionDraftId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

describe(`POST ${basePath}/formId/drafts/formVersionDraftId/publish`, () => {

  it('should return 200', async () => {
    // mock a success return value...
    service.publishDraft = jest.fn().mockReturnValue({});

    const response = await request(app).post(`${basePath}/formId/drafts/formVersionDraftId/publish`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.publishDraft = jest.fn(() => { throw new Problem(401); });

    const response = await request(app).post(`${basePath}/formId/drafts/formVersionDraftId/publish`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.publishDraft = jest.fn(() => { throw new Error(); });

    const response = await request(app).post(`${basePath}/formId/drafts/formVersionDraftId/publish`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });

});

