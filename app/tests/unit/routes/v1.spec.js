const request = require('supertest');

const { expressHelper } = require('../../common/helper');
const router = require('../../../src/routes/v1');

// Simple Express Server
const basePath = '/api/v1';
const app = expressHelper(basePath, router);

describe(`${basePath}`, () => {
  const path = `${basePath}`;

  describe('GET', () => {
    it('should return all available endpoints', async () => {
      const response = await request(app).get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
      expect(Array.isArray(response.body.endpoints)).toBeTruthy();
      expect(response.body.endpoints).toHaveLength(11);
      expect(response.body.endpoints).toContain('/docs');
      expect(response.body.endpoints).toContain('/files');
      expect(response.body.endpoints).toContain('/forms');
      expect(response.body.endpoints).toContain('/permissions');
      expect(response.body.endpoints).toContain('/public');
      expect(response.body.endpoints).toContain('/rbac');
      expect(response.body.endpoints).toContain('/roles');
      expect(response.body.endpoints).toContain('/submissions');
      expect(response.body.endpoints).toContain('/users');
      expect(response.body.endpoints).toContain('/utils');
    });
  });
});

describe(`${basePath}/api-spec.json`, () => {
  const path = `${basePath}/api-spec.json`;

  describe('GET', () => {
    it('should return the OpenAPI spec in json', async () => {
      const response = await request(app).get(path);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBeTruthy();
      expect(response.headers['content-type']).toMatch('application/json; charset=utf-8');
      expect(response.body).toBeTruthy();
      expect(response.body.openapi).toMatch('3.0.3');
      expect(response.body.info.title).toMatch('Common Hosted Form Service (CHEFS)');
    });
  });
});

describe(`${basePath}/api-spec.yaml`, () => {
  const path = `${basePath}/api-spec.yaml`;

  describe('GET', () => {
    it('should return the OpenAPI spec in yaml', async () => {
      const response = await request(app).get(path);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeTruthy();
      expect(response.headers['content-type']).toBeTruthy();
      expect(response.headers['content-type']).toMatch('application/yaml; charset=utf-8');
      expect(response.text).toContain('openapi: 3.0.3');
      expect(response.text).toContain('title: Common Hosted Form Service (CHEFS)');
    });
  });
});

describe(`${basePath}/docs`, () => {
  const path = `${basePath}/docs`;

  describe('GET', () => {
    it('should return a redoc html page', async () => {
      const response = await request(app).get(path);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain('<title>Common Hosted Form Service - Documentation ');
    });
  });
});
