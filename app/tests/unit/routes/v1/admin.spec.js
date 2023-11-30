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

//
// we will mock the underlying data service calls...
//
const service = require('../../../../src/forms/admin/service');

const formService = require('../../../../src/forms/form/service');
const rbacService = require('../../../../src/forms/rbac/service');
const userService = require('../../../../src/forms/user/service');

//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/admin/routes');

// Simple Express Server
const basePath = '/admin';
const app = expressHelper(basePath, router);
const appRequest = request(app);

afterEach(() => {
  jest.clearAllMocks();
});

describe(`${basePath}/formcomponents/proactivehelp/imageUrl/:componentId`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/imageUrl/:componentId`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getFCProactiveHelpImageUrl = jest.fn().mockReturnValue({});

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
      service.listFormComponentsProactiveHelp = jest.fn().mockReturnValue({});

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

describe(`${basePath}/formcomponents/proactivehelp/object`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/object`;

  describe('POST', () => {
    it('should return 200', async () => {
      const formComponentsHelpInfo = {
        componentname: 'Content',
        description: 'gughuhiuhuih',
        externallink: 'https://helplink.com',
        groupname: 'Basic Layout',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
        status: false,
        version: 1,
      };

      // mock a success return value...
      service.createFormComponentsProactiveHelp = jest.fn().mockReturnValue(formComponentsHelpInfo);

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.createFormComponentsProactiveHelp = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.createFormComponentsProactiveHelp = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.post(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/formcomponents/proactivehelp/:publishStatus/:componentId`, () => {
  const path = `${basePath}/formcomponents/proactivehelp/:publishStatus/:componentId`;

  describe('PUT', () => {
    it('should return 200', async () => {
      const formComponentsHelpInfo = {
        componentname: 'Content',
        externallink: 'https://helplink.com',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB3g',
        version: 1,
        groupname: 'Basic Layout',
        description: 'gughuhiuhuih',
        status: false,
      };

      // mock a success return value...
      service.updateFormComponentsProactiveHelp = jest.fn().mockReturnValue(formComponentsHelpInfo);

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.updateFormComponentsProactiveHelp = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.updateFormComponentsProactiveHelp = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/forms`, () => {
  const path = `${basePath}/forms`;

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
});

describe(`${basePath}/forms/:formId`, () => {
  const path = `${basePath}/forms/:formId`;

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

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readForm = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/forms/:formId/addUser`, () => {
  const path = `${basePath}/forms/:formId/addUser`;

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      rbacService.setFormUsers = jest.fn().mockReturnValue([]);

      const response = await appRequest.put(path).query({ userId: '123' }).send({ userId: '123' });

      expect(rbacService.setFormUsers).toHaveBeenCalledWith(':formId', '123', { userId: '123' }, undefined);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should 422 if no userId is supplied', async () => {
      // mock an authentication/permission issue...
      rbacService.setFormUsers = jest.fn().mockReturnValue([]);

      const response = await appRequest.put(path).query({ val: 'Test1' }).send({ otherBody: '123' });

      expect(response.statusCode).toBe(422);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      rbacService.setFormUsers = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path).query({ userId: '123' }).send({ userId: '123' });

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      rbacService.setFormUsers = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path).query({ userId: '123' }).send({ userId: '123' });

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/forms/:formId/apiKey`, () => {
  const path = `${basePath}/forms/:formId/apiKey`;

  describe('DELETE', () => {
    it('should return 204', async () => {
      // mock a success return value...
      formService.deleteApiKey = jest.fn().mockReturnValue({});

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(204);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      formService.deleteApiKey = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.delete(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      formService.deleteApiKey = jest.fn(() => {
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
      formService.readApiKey = jest.fn().mockReturnValue({});

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      formService.readApiKey = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      formService.readApiKey = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/forms/:formId/formUsers`, () => {
  const path = `${basePath}/forms/:formId/formUsers`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getFormUserRoles = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getFormUserRoles = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getFormUserRoles = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/forms/:formId/restore`, () => {
  const path = `${basePath}/forms/:formId/restore`;

  describe('PUT', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.restoreForm = jest.fn().mockReturnValue([]);

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.restoreForm = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.restoreForm = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.put(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/forms/:formId/versions/:formVersionId`, () => {
  const path = `${basePath}/forms/:formId/versions/:formVersionId`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.readVersion = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.readVersion = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.readVersion = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/users`, () => {
  const path = `${basePath}/users`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      service.getUsers = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      service.getUsers = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      service.getUsers = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});

describe(`${basePath}/users/:userId`, () => {
  const path = `${basePath}/users/:userId`;

  describe('GET', () => {
    it('should return 200', async () => {
      // mock a success return value...
      userService.readSafe = jest.fn().mockReturnValue([]);

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('should handle 401', async () => {
      // mock an authentication/permission issue...
      userService.readSafe = jest.fn(() => {
        throw new Problem(401);
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(401);
      expect(response.body).toBeTruthy();
    });

    it('should handle 500', async () => {
      // mock an unexpected error...
      userService.readSafe = jest.fn(() => {
        throw new Error();
      });

      const response = await appRequest.get(path);

      expect(response.statusCode).toBe(500);
      expect(response.body).toBeTruthy();
    });
  });
});
