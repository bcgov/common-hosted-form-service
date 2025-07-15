const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

const jwtService = require('../../../../src/components/jwtService');
const apiAccess = require('../../../../src/forms/auth/middleware/apiAccess');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const validateParameter = require('../../../../src/forms/common/middleware/validateParameter');
const controller = require('../../../../src/forms/submission/controller');

//
// Mock out all the middleware - we're testing that the routes are set up
// correctly, not the functionality of the middleware.
//

jest.mock('../../../../src/forms/auth/middleware/apiAccess');
apiAccess.mockImplementation(
  jest.fn((_req, _res, next) => {
    next();
  })
);

jwtService.protect = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

const hasSubmissionPermissionsMock = jest.fn((_req, _res, next) => {
  next();
});
userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});
userAccess.filterMultipleSubmissions = jest.fn((_req, _res, next) => {
  next();
});
userAccess.hasSubmissionPermissions = jest.fn(() => {
  return hasSubmissionPermissionsMock;
});

validateParameter.validateDocumentTemplateId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateFormId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateFormSubmissionId = jest.fn((_req, _res, next) => {
  next();
});

//
// Create the router and a simple Express server.
//

const router = require('../../../../src/forms/submission/routes');
const basePath = '/submissions';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/:formSubmissionId`, () => {
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}`;

  it('should have correct middleware for DELETE', async () => {
    controller.delete = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.delete(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.delete).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });

  it('should have correct middleware for GET', async () => {
    controller.read = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.read).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });

  it('should have correct middleware for PUT', async () => {
    controller.update = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.update).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formSubmissionId/:formId/submissions`, () => {
  const formId = uuid.v4();
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/${formId}/submissions`;

  it('should have correct middleware for DELETE', async () => {
    controller.deleteMultipleSubmissions = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.delete(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.deleteMultipleSubmissions).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(1);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formSubmissionId/:formId/submissions/restore`, () => {
  const formId = uuid.v4();
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/${formId}/submissions/restore`;

  it('should have correct middleware for PUT', async () => {
    controller.restoreMultipleSubmissions = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.restoreMultipleSubmissions).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(1);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(1);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formSubmissionId/edits`, () => {
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/edits`;

  it('should have correct middleware for GET', async () => {
    controller.listEdits = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.listEdits).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formSubmissionId/email`, () => {
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/email`;

  it('should have correct middleware for POST', async () => {
    controller.email = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.post(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.email).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formSubmissionId/notes`, () => {
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/notes`;

  it('should have correct middleware for GET', async () => {
    controller.getNotes = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.getNotes).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });

  it('should have correct middleware for POST', async () => {
    controller.addNote = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.post(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.addNote).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formSubmissionId/options`, () => {
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/options`;

  it('should have correct middleware for GET', async () => {
    controller.readOptions = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.readOptions).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(0);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formSubmissionId/restore`, () => {
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/restore`;

  it('should have correct middleware for PUT', async () => {
    controller.restore = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.put(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.restore).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formSubmissionId/status`, () => {
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/status`;

  it('should have correct middleware for GET', async () => {
    controller.getStatus = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.getStatus).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });

  it('should have correct middleware for POST', async () => {
    controller.addStatus = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.post(path);

    expect(apiAccess).toBeCalledTimes(0);
    expect(controller.addStatus).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formSubmissionId/template/:documentTemplateId/render`, () => {
  const documentTemplateId = uuid.v4();
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/template/${documentTemplateId}/render`;

  it('should have correct middleware for GET', async () => {
    controller.templateRender = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.get(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.templateRender).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(1);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });
});

describe(`${basePath}/:formSubmissionId/template/render`, () => {
  const formSubmissionId = uuid.v4();
  const path = `${basePath}/${formSubmissionId}/template/render`;

  it('should have correct middleware for POST', async () => {
    controller.templateUploadAndRender = jest.fn((_req, res) => {
      res.sendStatus(200);
    });

    await appRequest.post(path);

    expect(apiAccess).toBeCalledTimes(1);
    expect(controller.templateUploadAndRender).toBeCalledTimes(1);
    expect(hasSubmissionPermissionsMock).toBeCalledTimes(1);
    expect(userAccess.currentUser).toBeCalledTimes(1);
    expect(userAccess.filterMultipleSubmissions).toBeCalledTimes(0);
    expect(validateParameter.validateDocumentTemplateId).toBeCalledTimes(0);
    expect(validateParameter.validateFormId).toBeCalledTimes(0);
    expect(validateParameter.validateFormSubmissionId).toBeCalledTimes(1);
  });
});
