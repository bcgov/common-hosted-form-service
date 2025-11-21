const express = require('express');
const request = require('supertest');
const controller = require('../../../../src/gateway/v1/auth/controller');
const apiAccess = require('../../../../src/forms/auth/middleware/apiAccess');

// Mock middleware
jest.mock('../../../../src/forms/auth/middleware/apiAccess', () => jest.fn((req, res, next) => next()));

// Mock controller methods
jest.mock('../../../../src/gateway/v1/auth/controller', () => ({
  issueFormToken: jest.fn(),
  refreshToken: jest.fn(),
  validateToken: jest.fn(),
}));

describe('gateway/v1/auth routes', () => {
  let app;
  let routes;

  beforeEach(() => {
    jest.clearAllMocks();
    // Import routes after mocks are set up
    routes = require('../../../../src/gateway/v1/auth/routes');
    app = express();
    app.use(express.json());
    app.use('/gateway/v1/auth', routes);
  });

  it('POST /token/forms/:formId should route to controller.issueFormToken with apiAccess middleware', async () => {
    controller.issueFormToken.mockImplementation(async (_req, res) => res.status(201).json({ token: 'abc' }));
    const res = await request(app).post('/gateway/v1/auth/token/forms/123').send({ formId: '123' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ token: 'abc' });
    expect(controller.issueFormToken).toHaveBeenCalled();
    expect(apiAccess).toHaveBeenCalled();
  });

  it('POST /refresh should route to controller.refreshToken without middleware', async () => {
    controller.refreshToken.mockImplementation(async (_req, res) => res.status(200).json({ refreshed: true }));
    const res = await request(app).post('/gateway/v1/auth/refresh').send({ token: 'oldtoken' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ refreshed: true });
    expect(controller.refreshToken).toHaveBeenCalled();
  });

  it('POST /validate should route to controller.validateToken without middleware', async () => {
    controller.validateToken.mockImplementation(async (_req, res) => res.status(200).json({ valid: true }));
    const res = await request(app).post('/gateway/v1/auth/validate').send({ token: 'sometoken' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ valid: true });
    expect(controller.validateToken).toHaveBeenCalled();
  });

  it('should not support GET /token/forms/:formId', async () => {
    const res = await request(app).get('/gateway/v1/auth/token/forms/123');
    expect(res.statusCode).toBe(404);
  });

  it('should not support PUT /token/forms/:formId', async () => {
    const res = await request(app).put('/gateway/v1/auth/token/forms/123');
    expect(res.statusCode).toBe(404);
  });

  it('should not support DELETE /token/forms/:formId', async () => {
    const res = await request(app).delete('/gateway/v1/auth/token/forms/123');
    expect(res.statusCode).toBe(404);
  });

  it('should not support GET /refresh', async () => {
    const res = await request(app).get('/gateway/v1/auth/refresh');
    expect(res.statusCode).toBe(404);
  });

  it('should not support GET /validate', async () => {
    const res = await request(app).get('/gateway/v1/auth/validate');
    expect(res.statusCode).toBe(404);
  });

  it('should only have the expected endpoints', () => {
    const router = routes;
    const layers = router.stack;

    // Extract all route paths and methods
    const routeInfo = layers
      .map((layer) => ({
        path: layer.route?.path,
        methods: layer.route ? Object.keys(layer.route.methods) : [],
      }))
      .filter((info) => info.path);

    expect(routeInfo).toEqual([
      { path: '/token/forms/:formId', methods: ['post'] },
      { path: '/refresh', methods: ['post'] },
      { path: '/validate', methods: ['post'] },
    ]);
  });
});
