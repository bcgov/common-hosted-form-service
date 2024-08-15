const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

const jwtService = require('../../../../src/components/jwtService');
const apiAccess = require('../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const rateLimiter = require('../../../../src/forms/common/middleware/rateLimiter');
const validateParameter = require('../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../src/forms/form/controller');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//

jwtService.protect = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

jest.mock('../../../../src/forms/auth/middleware/apiAccess');
apiAccess.mockImplementation(
  jest.fn((_req, _res, next) => {
    next();
  })
);

rateLimiter.apiKeyRateLimiter = jest.fn((_req, _res, next) => {
  next();
});

const hasFormPermissionsMock = jest.fn((_req, _res, next) => {
  next();
});
userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});
userAccess.hasFormPermissions = jest.fn(() => {
  return hasFormPermissionsMock;
});

validateParameter.validateDocumentTemplateId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateFormId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateFormVersionDraftId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateFormVersionId = jest.fn((_req, _res, next) => {
  next();
});

controller.createDraft = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.createForm = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.createMultiSubmission = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.createOrReplaceApiKey = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.createOrUpdateEmailTemplate = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.createOrUpdateSubscriptionDetails = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.createSubmission = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.deleteApiKey = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.deleteDraft = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.deleteForm = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.documentTemplateCreate = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.documentTemplateDelete = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.documentTemplateList = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.documentTemplateRead = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.getFCProactiveHelpImageUrl = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.getStatusCodes = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.export = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.exportWithFields = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.filesApiKeyAccess = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.listDrafts = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.listFormComponentsProactiveHelp = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.listFormSubmissions = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.listForms = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.listSubmissionFields = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.listSubmissions = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.publishDraft = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.publishVersion = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.readApiKey = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.readDraft = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.readEmailTemplates = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.readFieldsForCSVExport = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.readForm = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.readFormOptions = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.readFormSubscriptionDetails = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.readPublishedForm = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.readVersion = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.readVersionFields = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.updateDraft = jest.fn((_req, res) => {
  res.sendStatus(200);
});
controller.updateForm = jest.fn((_req, res) => {
  res.sendStatus(200);
});

const componentId = uuid.v4();
const documentTemplateId = uuid.v4();
const formId = uuid.v4();
const formVersionDraftId = uuid.v4();
const formVersionId = uuid.v4();

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/form/routes');
const basePath = '/form';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}`, () => {
  const path = `${basePath}`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(controller.listForms).toBeCalledTimes(1);
  });

  it('should have correct middleware for POST', async () => {
    await appRequest.post(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(controller.createForm).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId`, () => {
  const path = `${basePath}/${formId}`;

  it('should have correct middleware for DELETE', async () => {
    await appRequest.delete(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.deleteForm).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.readForm).toBeCalledTimes(1);
  });

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.updateForm).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/apiKey`, () => {
  const path = `${basePath}/${formId}/apiKey`;

  it('should have correct middleware for DELETE', async () => {
    await appRequest.delete(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.deleteApiKey).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.readApiKey).toBeCalledTimes(1);
  });

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.createOrReplaceApiKey).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/apiKey/filesApiAccess`, () => {
  const path = `${basePath}/${formId}/apiKey/filesApiAccess`;

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.filesApiKeyAccess).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/csvexport/fields`, () => {
  const path = `${basePath}/${formId}/csvexport/fields`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.readFieldsForCSVExport).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/documentTemplates`, () => {
  const path = `${basePath}/${formId}/documentTemplates`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.documentTemplateList).toBeCalledTimes(1);
  });

  it('should have correct middleware for POST', async () => {
    await appRequest.post(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.documentTemplateCreate).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/documentTemplates/:documentTemplateId`, () => {
  const path = `${basePath}/${formId}/documentTemplates/${documentTemplateId}`;

  it('should have correct middleware for DELETE', async () => {
    await appRequest.delete(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.documentTemplateDelete).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.documentTemplateRead).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/drafts`, () => {
  const path = `${basePath}/${formId}/drafts`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.listDrafts).toBeCalledTimes(1);
  });

  it('should have correct middleware for POST', async () => {
    await appRequest.post(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.createDraft).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/drafts/:formVersionDraftId`, () => {
  const path = `${basePath}/${formId}/drafts/${formVersionDraftId}`;

  it('should have correct middleware for DELETE', async () => {
    await appRequest.delete(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.deleteDraft).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.readDraft).toBeCalledTimes(1);
  });

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.updateDraft).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/drafts/:formVersionDraftId/publish`, () => {
  const path = `${basePath}/${formId}/drafts/${formVersionDraftId}/publish`;

  it('should have correct middleware for POST', async () => {
    await appRequest.post(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.publishDraft).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/emailTemplate`, () => {
  const path = `${basePath}/${formId}/emailTemplate`;

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.createOrUpdateEmailTemplate).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/emailTemplates`, () => {
  const path = `${basePath}/${formId}/emailTemplates`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.readEmailTemplates).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/export`, () => {
  const path = `${basePath}/${formId}/export`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.export).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/export/fields`, () => {
  const path = `${basePath}/${formId}/export/fields`;

  it('should have correct middleware for POST', async () => {
    await appRequest.post(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.exportWithFields).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/options`, () => {
  const path = `${basePath}/${formId}/options`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(controller.readFormOptions).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/statusCodes`, () => {
  const path = `${basePath}/${formId}/statusCodes`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.getStatusCodes).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/submissions`, () => {
  const path = `${basePath}/${formId}/submissions`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.listFormSubmissions).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/subscriptions`, () => {
  const path = `${basePath}/${formId}/subscriptions`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.readFormSubscriptionDetails).toBeCalledTimes(1);
  });

  it('should have correct middleware for PUT', async () => {
    await appRequest.put(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.createOrUpdateSubscriptionDetails).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/version`, () => {
  const path = `${basePath}/${formId}/version`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.readPublishedForm).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/versions/:formVersionId`, () => {
  const path = `${basePath}/${formId}/versions/${formVersionId}`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.readVersion).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/versions/:formVersionId/fields`, () => {
  const path = `${basePath}/${formId}/versions/${formVersionId}/fields`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.readVersionFields).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/versions/:formVersionId/multiSubmission`, () => {
  const path = `${basePath}/${formId}/versions/${formVersionId}/multiSubmission`;

  it('should have correct middleware for POST', async () => {
    await appRequest.post(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.createMultiSubmission).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/versions/:formVersionId/publish`, () => {
  const path = `${basePath}/${formId}/versions/${formVersionId}/publish`;

  it('should have correct middleware for POST', async () => {
    await appRequest.post(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.publishVersion).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/versions/:formVersionId/submissions`, () => {
  const path = `${basePath}/${formId}/versions/${formVersionId}/submissions`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.listSubmissions).toBeCalledTimes(1);
  });

  it('should have correct middleware for POST', async () => {
    await appRequest.post(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.createSubmission).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formId/versions/:formVersionId/submissions/discover`, () => {
  const path = `${basePath}/${formId}/versions/${formVersionId}/submissions/discover`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(1);
    expect(apiAccess).toBeCalledTimes(1);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(1);
    expect(hasFormPermissionsMock).toBeCalledTimes(1);
    expect(controller.listSubmissionFields).toBeCalledTimes(1);
  });
});

describe(`${basePath}/formcomponents/proactivehelp/imageUrl/:componentId`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/imageUrl/${componentId}`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(controller.getFCProactiveHelpImageUrl).toBeCalledTimes(1);
  });
});

describe(`${basePath}/formcomponents/proactivehelp/list`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/list`;

  it('should have correct middleware for GET', async () => {
    await appRequest.get(path);

    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionDraftId).toBeCalledTimes(0);
    expect(validateParameter.validateFormVersionId).toBeCalledTimes(0);
    expect(apiAccess).toBeCalledTimes(0);
    expect(rateLimiter.apiKeyRateLimiter).toBeCalledTimes(0);
    expect(hasFormPermissionsMock).toBeCalledTimes(0);
    expect(controller.listFormComponentsProactiveHelp).toBeCalledTimes(1);
  });
});
