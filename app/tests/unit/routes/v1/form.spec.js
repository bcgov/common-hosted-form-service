const request = require('supertest');
const Problem = require('api-problem');

const { expressHelper } = require('../../../common/helper');

//
// mock middleware
//
const keycloak = require('../../../../src/components/keycloak');

//
// test assumes that caller has appropriate token, we are not testing middleware here...
//
keycloak.protect = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});
userAccess.hasFormPermissions = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

//
// we will mock the underlying data service calls...
//
const service = require('../../../../src/forms/form/service');

const emailService = require('../../../../src/forms/email/emailService');
const exportService = require('../../../../src/forms/form/exportService');
const fileService = require('../../../../src/forms/file/service');

//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/form/routes');

// Simple Express Server
const basePath = '/form';
const app = expressHelper(basePath, router);
const appRequest = request(app);

//
// We don't want static code analysis complaining about hard-coded tokens, even
// if they're fake. Mock a token with a non-existing ("undefined") environment
// variable.
//
const bearerAuth = `Bearer: ${process.env.DOES_NOT_EXIST}`;

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}`, () => {
  const path = `${basePath}`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.listForms = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.listForms = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.listForms = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('POST', () => {
    it('should return 201', async () => {
      // mock a success return value...
      service.createForm = jest.fn().mockReturnValue({});

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(201);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.createForm = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.createForm = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/formcomponents/proactivehelp/imageUrl/:componentId`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/imageUrl/:componentId`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getFCProactiveHelpImageUrl = jest.fn().mockReturnValue([{}]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getFCProactiveHelpImageUrl = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getFCProactiveHelpImageUrl = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/formcomponents/proactivehelp/list`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/list`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.listFormComponentsProactiveHelp = jest.fn().mockReturnValue([{}]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.listFormComponentsProactiveHelp = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.listFormComponentsProactiveHelp = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId`, () => {
  const path = `${basePath}/:formId`;

  describe('DELETE', () => {
    it('should return 204', async () => {
      // mock a success return value...
      service.deleteForm = jest.fn().mockReturnValue([]);

      const response = await appRequest.delete(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(204);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.deleteForm = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.delete(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.deleteForm = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.delete(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.readForm = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.readForm = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readForm = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.updateForm = jest.fn().mockReturnValue([]);

      const response = await appRequest.put(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.updateForm = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.updateForm = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/apiKey`, () => {
  const path = `${basePath}/:formId/apiKey`;

  describe('DELETE', () => {
    it('should return 204', async () => {
      // mock a success return value...
      service.deleteApiKey = jest.fn().mockReturnValue([]);

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(204);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.deleteApiKey = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.deleteApiKey = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.readApiKey = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.readApiKey = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readApiKey = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.createOrReplaceApiKey = jest.fn().mockReturnValue([]);

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.createOrReplaceApiKey = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.createOrReplaceApiKey = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/csvexport/fields`, () => {
  const path = `${basePath}/:formId/csvexport/fields`;

  describe('GET', () => {
    it('should return 200', async () => {
      const formFields = [
        'form.confirmationId',
        'form.formName',
        'form.version',
        'form.createdAt',
        'form.fullName',
        'form.username',
        'form.email',
        'fishermansName',
        'email',
        'forWhichBcLakeRegionAreYouCompletingTheseQuestions',
        'didYouFishAnyBcLakesThisYear',
        'oneRowPerLake',
        'oneRowPerLake.lakeName',
        'oneRowPerLake.closestTown',
        'oneRowPerLake.numberOfDays',
        'oneRowPerLake.dataGrid',
        'oneRowPerLake.dataGrid.fishType',
        'oneRowPerLake.dataGrid.numberCaught',
        'oneRowPerLake.dataGrid.numberKept',
      ];

      // mock a success return value...
      exportService.fieldsForCSVExport = jest.fn().mockReturnValue(formFields);

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      exportService.fieldsForCSVExport = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      exportService.fieldsForCSVExport = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/drafts`, () => {
  const path = `${basePath}/:formId/drafts`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.listDrafts = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.listDrafts = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.listDrafts = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('POST', () => {
    it('should return 201', async () => {
      // mock a success return value...
      service.createDraft = jest.fn().mockReturnValue({});

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(201);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.createDraft = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.createDraft = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/drafts/:formVersionDraftId`, () => {
  const path = `${basePath}/:formId/drafts/:formVersionDraftId`;

  describe('DELETE', () => {
    it('should return 204', async () => {
      // mock a success return value...
      service.deleteDraft = jest.fn().mockReturnValue([]);

      const response = await appRequest.delete(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(204);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.deleteDraft = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.delete(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.deleteDraft = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.delete(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.readDraft = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.readDraft = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readDraft = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.updateDraft = jest.fn().mockReturnValue([]);

      const response = await appRequest.put(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.updateDraft = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.updateDraft = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/drafts/:formVersionDraftId/publish`, () => {
  const path = `${basePath}/:formId/drafts/:formVersionDraftId/publish`;

  describe('POST', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.publishDraft = jest.fn().mockReturnValue({});

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.publishDraft = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.publishDraft = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/emailTemplate`, () => {
  const path = `${basePath}/:formId/emailTemplate`;

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.createOrUpdateEmailTemplate = jest.fn().mockReturnValue([{}]);

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.createOrUpdateEmailTemplate = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.createOrUpdateEmailTemplate = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/emailTemplates`, () => {
  const path = `${basePath}/:formId/emailTemplates`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.readEmailTemplates = jest.fn().mockReturnValue([{}]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.readEmailTemplates = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readEmailTemplates = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/export`, () => {
  const path = `${basePath}/:formId/export`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      exportService.export = jest.fn().mockReturnValue({
        data: {},
        headers: {
          'content-disposition': 'attachment; filename="not-real.csv"',
          'content-type': 'text/csv',
        },
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      exportService.export = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      exportService.export = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/export/fields`, () => {
  const path = `${basePath}/:formId/export/fields`;

  describe('POST', () => {
    it('should return 200', async () => {
      // mock a success return value...
      exportService.export = jest.fn().mockReturnValue({
        data: {},
        headers: {
          'content-disposition': 'attachment; filename="not-real.csv"',
          'content-type': 'text/csv',
        },
      });

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      exportService.export = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      exportService.export = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/options`, () => {
  const path = `${basePath}/:formId/options`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.readFormOptions = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.readFormOptions = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readFormOptions = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/statusCodes`, () => {
  const path = `${basePath}/:formId/statusCodes`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getStatusCodes = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getStatusCodes = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getStatusCodes = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/submissions`, () => {
  const path = `${basePath}/:formId/submissions`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.listFormSubmissions = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.listFormSubmissions = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.listFormSubmissions = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/subscriptions`, () => {
  const path = `${basePath}/:formId/subscriptions`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.readFormSubscriptionDetails = jest.fn().mockReturnValue([{}]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.readFormSubscriptionDetails = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readFormSubscriptionDetails = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.createOrUpdateSubscriptionDetails = jest.fn().mockReturnValue([{}]);

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.createOrUpdateSubscriptionDetails = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.createOrUpdateSubscriptionDetails = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/version`, () => {
  const path = `${basePath}/:formId/version`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.readPublishedForm = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.readPublishedForm = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readPublishedForm = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/versions/:formVersionId`, () => {
  const path = `${basePath}/:formId/versions/:formVersionId`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.readVersion = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.readVersion = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readVersion = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/versions/:formVersionId/fields`, () => {
  const path = `${basePath}/:formId/versions/:formVersionId/fields`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.readVersionFields = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.readVersionFields = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readVersionFields = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/versions/:formVersionId/multiSubmission`, () => {
  const path = `${basePath}/:formId/versions/:formVersionId/multiSubmission`;

  describe('POST', () => {
    it('should return 201', async () => {
      // mock a success return value...
      service.createMultiSubmission = jest.fn().mockReturnValue([]);

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(201);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.createMultiSubmission = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.createMultiSubmission = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/versions/:formVersionId/publish`, () => {
  const path = `${basePath}/:formId/versions/:formVersionId/publish`;

  describe('POST', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.publishVersion = jest.fn().mockReturnValue({});

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.publishVersion = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.publishVersion = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/versions/:formVersionId/submissions`, () => {
  const path = `${basePath}/:formId/versions/:formVersionId/submissions`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.listSubmissions = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.listSubmissions = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.listSubmissions = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('POST', () => {
    const createSubmissionResult = { id: 'id' };

    it('should return 201', async () => {
      // mock a success return value...
      service.createSubmission = jest.fn().mockReturnValue(createSubmissionResult);
      emailService.submissionReceived = jest.fn(() => Promise.resolve({}));
      fileService.moveSubmissionFiles = jest.fn(() => Promise.resolve({}));

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(emailService.submissionReceived).toHaveBeenCalledTimes(1);
      expect(fileService.moveSubmissionFiles).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(201);
      expect(response.body).toBeTruthy();
    });

    it('should not call email service if it is a draft', async () => {
      // mock a success return value...
      service.createSubmission = jest.fn().mockReturnValue(createSubmissionResult);
      emailService.submissionReceived = jest.fn(() => Promise.resolve({}));
      fileService.moveSubmissionFiles = jest.fn(() => Promise.resolve({}));

      const response = await appRequest.post(path).send({ draft: true }).set('Authorization', bearerAuth);

      expect(emailService.submissionReceived).toHaveBeenCalledTimes(0);
      expect(fileService.moveSubmissionFiles).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(201);
      expect(response.body).toBeTruthy();
    });

    it('should call email service if draft is provided and false', async () => {
      // mock a success return value...
      service.createSubmission = jest.fn().mockReturnValue(createSubmissionResult);
      emailService.submissionReceived = jest.fn(() => Promise.resolve({}));
      fileService.moveSubmissionFiles = jest.fn(() => Promise.resolve({}));

      const response = await appRequest.post(path).send({ draft: false }).set('Authorization', bearerAuth);

      expect(emailService.submissionReceived).toHaveBeenCalledTimes(1);
      expect(fileService.moveSubmissionFiles).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(201);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.createSubmission = jest.fn(() => {
        throw new Problem(401);
      });
      emailService.submissionReceived = jest.fn().mockReturnValue(true);
      fileService.moveSubmissionFiles = jest.fn(() => Promise.resolve({}));

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.createSubmission = jest.fn(() => {
        throw new Error();
      });
      emailService.submissionReceived = jest.fn().mockReturnValue(true);
      fileService.moveSubmissionFiles = jest.fn(() => Promise.resolve({}));

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });

    it('should handle error from email service gracefully', async () => {
      service.createSubmission = jest.fn().mockReturnValue(createSubmissionResult);
      emailService.submissionReceived = jest.fn(() => Promise.reject({}));
      fileService.moveSubmissionFiles = jest.fn(() => Promise.resolve({}));

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(201);
      expect(response.body).toBeTruthy();
    });

    it('should handle error from file service gracefully', async () => {
      service.createSubmission = jest.fn().mockReturnValue(createSubmissionResult);
      emailService.submissionReceived = jest.fn(() => Promise.resolve({}));
      fileService.moveSubmissionFiles = jest.fn(() => Promise.reject({}));

      const response = await appRequest.post(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(201);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formId/versions/:formVersionId/submissions/discover`, () => {
  const path = `${basePath}/:formId/versions/:formVersionId/submissions/discover`;

  describe('GET', () => {
    it('should return 200 with comma separated fields', async () => {
      // mock a success return value...
      service.listSubmissionFields = jest.fn().mockReturnValue([]);
      service.readVersionFields = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path).set('Authorization', bearerAuth).query({ fields: 'foo,bar' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should return 200 with discrete fields', async () => {
      // mock a success return value...
      service.listSubmissionFields = jest.fn().mockReturnValue([]);
      service.readVersionFields = jest.fn().mockReturnValue([]);

      const response = await appRequest
        .get(path)
        .set('Authorization', bearerAuth)
        .query({ fields: ['foo', 'bar'] });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.listSubmissionFields = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.listSubmissionFields = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});
