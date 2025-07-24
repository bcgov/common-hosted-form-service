const request = require('supertest');
const Problem = require('api-problem');

const jwtService = require('../../../../src/components/jwtService');
const validateParameter = require('../../../../src/forms/common/middleware/validateParameter');
const { expressHelper } = require('../../../common/helper');

//
// mock middleware
//

jwtService.protect = jest.fn(() => {
  return jest.fn((_req, _res, next) => {
    next();
  });
});

const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
userAccess.currentUser = jest.fn((_req, _res, next) => {
  next();
});

validateParameter.validateFormModuleId = jest.fn((_req, _res, next) => {
  next();
});
validateParameter.validateFormModuleVersionId = jest.fn((_req, _res, next) => {
  next();
});

//
// we will mock the underlying data service calls...
//
const service = require('../../../../src/forms/formModule/service');

//
// mocks are in place, create the router
//
const router = require('../../../../src/forms/formModule/routes');

// Simple Express Server
const basePath = '/form_modules';
const app = expressHelper(basePath, router);
const appRequest = request(app);

const validFormModuleId = '97cd8ef7-f7b6-4ff0-94cf-7ac3f85dafff';
const validFormModuleVersionId = '7a69d0fc-66e5-4982-add0-501615a7cd6e';

afterEach(() => {
  jest.clearAllMocks();
});

describe(`GET ${basePath}`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.listFormModules = jest.fn().mockReturnValue([]);

    const response = await appRequest.get(`${basePath}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.listFormModules = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.get(`${basePath}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.listFormModules = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.get(`${basePath}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`POST ${basePath}`, () => {
  it('should return 201', async () => {
    // mock a success return value...
    service.createFormModule = jest.fn().mockReturnValue({});

    const response = await appRequest.post(`${basePath}`);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.createFormModule = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.post(`${basePath}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.createFormModule = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.post(`${basePath}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`GET ${basePath}/formModuleId`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.readFormModule = jest.fn().mockReturnValue([]);

    const response = await appRequest.get(`${basePath}/${validFormModuleId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.readFormModule = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.get(`${basePath}/${validFormModuleId}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.readFormModule = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.get(`${basePath}/${validFormModuleId}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`PUT ${basePath}/formModuleId`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.updateFormModule = jest.fn().mockReturnValue([]);

    const response = await appRequest.put(`${basePath}/${validFormModuleId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.updateFormModule = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.put(`${basePath}/${validFormModuleId}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.updateFormModule = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.put(`${basePath}/${validFormModuleId}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`POST ${basePath}/formModuleId/version`, () => {
  it('should return 201', async () => {
    // mock a success return value...
    service.createFormModuleVersion = jest.fn().mockReturnValue({});

    const response = await appRequest.post(`${basePath}/${validFormModuleId}/version`);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.createFormModuleVersion = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.post(`${basePath}/${validFormModuleId}/version`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.createFormModuleVersion = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.post(`${basePath}/${validFormModuleId}/version`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`GET ${basePath}/formModuleId/version/${validFormModuleVersionId}`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.readFormModuleVersion = jest.fn().mockReturnValue([]);

    const response = await appRequest.get(`${basePath}/${validFormModuleId}/version/${validFormModuleVersionId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.readFormModuleVersion = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.get(`${basePath}/${validFormModuleId}/version/${validFormModuleVersionId}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.readFormModuleVersion = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.get(`${basePath}/${validFormModuleId}/version`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`PUT ${basePath}/formModuleId/version/formModuleVersionId`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.updateFormModuleVersion = jest.fn().mockReturnValue([]);

    const response = await appRequest.put(`${basePath}/${validFormModuleId}/version/${validFormModuleVersionId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.updateFormModuleVersion = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.put(`${basePath}/${validFormModuleId}/version/${validFormModuleVersionId}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.updateFormModuleVersion = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.put(`${basePath}/${validFormModuleId}/version/${validFormModuleVersionId}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`GET ${basePath}/formModuleId/idp`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.listFormModuleIdentityProviders = jest.fn().mockReturnValue([]);

    const response = await appRequest.get(`${basePath}/${validFormModuleId}/idp`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });
});
