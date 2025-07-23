const request = require('supertest');
const Problem = require('api-problem');

const jwtService = require('../../../../src/components/jwtService');
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

    const response = await appRequest.get(`${basePath}/formModuleId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.readFormModule = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.get(`${basePath}/formModuleId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.readFormModule = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.get(`${basePath}/formModuleId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`PUT ${basePath}/formModuleId`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.updateFormModule = jest.fn().mockReturnValue([]);

    const response = await appRequest.put(`${basePath}/formModuleId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.updateFormModule = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.put(`${basePath}/formModuleId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.updateFormModule = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.put(`${basePath}/formModuleId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`POST ${basePath}/formModuleId/version`, () => {
  it('should return 201', async () => {
    // mock a success return value...
    service.createFormModuleVersion = jest.fn().mockReturnValue({});

    const response = await appRequest.post(`${basePath}/formModuleId/version`);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.createFormModuleVersion = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.post(`${basePath}/formModuleId/version`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.createFormModuleVersion = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.post(`${basePath}/formModuleId/version`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`GET ${basePath}/formModuleId/version/formModuleVersionId`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.readFormModuleVersion = jest.fn().mockReturnValue([]);

    const response = await appRequest.get(`${basePath}/formModuleId/version/formModuleVersionId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.readFormModuleVersion = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.get(`${basePath}/formModuleId/version/formModuleVersionId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.readFormModuleVersion = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.get(`${basePath}/formModuleId/version`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`PUT ${basePath}/formModuleId/version/formModuleVersionId`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.updateFormModuleVersion = jest.fn().mockReturnValue([]);

    const response = await appRequest.put(`${basePath}/formModuleId/version/formModuleVersionId`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });

  it('should handle 401', async () => {
    // mock an authentication/permission issue...
    service.updateFormModuleVersion = jest.fn(() => {
      throw new Problem(401);
    });

    const response = await appRequest.put(`${basePath}/formModuleId/version/formModuleVersionId`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toBeTruthy();
  });

  it('should handle 500', async () => {
    // mock an unexpected error...
    service.updateFormModuleVersion = jest.fn(() => {
      throw new Error();
    });

    const response = await appRequest.put(`${basePath}/formModuleId/version/formModuleVersionId`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeTruthy();
  });
});

describe(`GET ${basePath}/formModuleId/idp`, () => {
  it('should return 200', async () => {
    // mock a success return value...
    service.listFormModuleIdentityProviders = jest.fn().mockReturnValue([]);

    const response = await appRequest.get(`${basePath}/formModuleId/idp`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeTruthy();
  });
});
