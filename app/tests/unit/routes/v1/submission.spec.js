const request = require('supertest');
const Problem = require('api-problem');

const { expressHelper } = require('../../../common/helper');

//
// mock middleware
//
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});
userAccess.filterMultipleSubmissions = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});
userAccess.hasSubmissionPermissions = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

//
// we will mock the underlying data service calls...
//
const service = require('../../../../src/forms/submission/service');

const cdogsService = require('../../../../src/components/cdogsService');
const emailService = require('../../../../src/forms/email/emailService');

//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/submission/routes');

// Simple Express Server
const basePath = '/submissions';
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

describe(`${basePath}/:formSubmissionId`, () => {
  const path = `${basePath}/:formSubmissionId`;

  describe('DELETE', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.delete = jest.fn().mockReturnValue({});

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.delete = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.delete = jest.fn(() => {
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
      service.read = jest.fn().mockReturnValue({});

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.read = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.read = jest.fn(() => {
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
      service.update = jest.fn().mockReturnValue({});

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.update = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error.
      service.update = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formSubmissionId/edits`, () => {
  const path = `${basePath}/:formSubmissionId/edits`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.listEdits = jest.fn().mockReturnValue({});

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.listEdits = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.listEdits = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formSubmissionId/email`, () => {
  const path = `${basePath}/:formSubmissionId/email`;

  describe('POST', () => {
    const submissionResult = { form: { id: '' }, submission: { id: '' }, version: { id: '' } };

    it('should return 200', async () => {
      // mock a success return value...
      service.read = jest.fn().mockReturnValue(submissionResult);
      emailService.submissionConfirmation = jest.fn().mockReturnValue(true);

      const response = await appRequest.post(path, { to: 'account@fake.com' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.read = jest.fn(() => {
        throw new Problem(401);
      });
      emailService.submissionConfirmation = jest.fn().mockReturnValue(true);

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error.
      service.read = jest.fn(() => {
        throw new Error();
      });
      emailService.submissionConfirmation = jest.fn().mockReturnValue(true);

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500 from email service', async () => {
      // mock an unexpected error from email.
      service.read = jest.fn().mockReturnValue(submissionResult);
      emailService.submissionConfirmation = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formSubmissionId/:formId/submissions`, () => {
  const path = `${basePath}/:formSubmissionId/:formId/submissions`;

  describe('DELETE', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.deleteMutipleSubmissions = jest.fn().mockReturnValue({});

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.deleteMutipleSubmissions = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.deleteMutipleSubmissions = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formSubmissionId/:formId/submissions/restore`, () => {
  const path = `${basePath}/:formSubmissionId/:formId/submissions/restore`;

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.restoreMutipleSubmissions = jest.fn().mockReturnValue({});

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.restoreMutipleSubmissions = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.restoreMutipleSubmissions = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formSubmissionId/notes`, () => {
  const path = `${basePath}/:formSubmissionId/notes`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getNotes = jest.fn().mockReturnValue({});

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getNotes = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getNotes = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('POST', () => {
    it('should return 200', async () => {
      const noteRes = { note: 'responseNote' };
      // mock a success return value...
      service.addNote = jest.fn().mockReturnValue(noteRes);

      const response = await appRequest.post(path, { note: 'requestNote' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.addNote = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error.
      service.addNote = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formSubmissionId/options`, () => {
  const path = `${basePath}/:formSubmissionId/options`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.readOptions = jest.fn().mockReturnValue({});

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.readOptions = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readOptions = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formSubmissionId/restore`, () => {
  const path = `${basePath}/:formSubmissionId/restore`;

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.restore = jest.fn().mockReturnValue({});

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.restore = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.restore = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formSubmissionId/status`, () => {
  const path = `${basePath}/:formSubmissionId/status`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getStatus = jest.fn().mockReturnValue({});

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getStatus = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getStatus = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path).set('Authorization', bearerAuth);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });

  describe('POST', () => {
    it('should return 200', async () => {
      const statRes = { code: 'SUBMITTED', user: {} };
      // mock a success return value...
      service.changeStatusState = jest.fn().mockReturnValue(statRes);
      emailService.statusAssigned = jest.fn().mockReturnValue(true);

      const response = await appRequest.post(path, { code: 'SUBMITTED', user: {} });

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

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error.
      service.changeStatusState = jest.fn(() => {
        throw new Error();
      });
      emailService.statusAssigned = jest.fn().mockReturnValue(true);

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/:formSubmissionId/template/render`, () => {
  const path = `${basePath}/:formSubmissionId/template/render`;

  describe('POST', () => {
    it('should return 200', async () => {
      // mock a success return value...
      const readResponse = {
        submission: {
          submission: {},
        },
      };
      const renderResponse = {
        headers: {},
        status: 200,
      };
      service.read = jest.fn().mockReturnValue(readResponse);
      cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(renderResponse);

      const response = await appRequest.post(path, {});

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.read = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.post(path, {});

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error.
      service.read = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});
