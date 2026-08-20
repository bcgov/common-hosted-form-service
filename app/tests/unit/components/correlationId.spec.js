const express = require('express');
const request = require('supertest');
const clsRtracer = require('cls-rtracer');
const { getId, exists } = require('../../../src/components/correlationId');

function createTestApp() {
  const app = express();
  app.use(clsRtracer.expressMiddleware({ useHeader: true }));
  app.use(express.json());

  app.get('/test', handleTestRoute);
  app.get('/async-test', handleAsyncTestRoute);

  return app;
}

function handleTestRoute(req, res) {
  const id = getId();
  res.json({ correlationId: id });
}

async function handleAsyncTestRoute(req, res) {
  const id1 = getId();
  await new Promise((resolve) => setTimeout(resolve, 10));
  const id2 = getId();
  res.json({ correlationId1: id1, correlationId2: id2 });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function nestedAsyncOperation(results) {
  await delay(10);
  results.push(getId());
}

describe('correlationId utilities', () => {
  it('getId should return undefined when not in async context', () => {
    const id = getId();
    expect(id).toBeUndefined();
  });

  it('getId should return correlation ID when in async context', async () => {
    const testId = 'test-correlation-id';
    let capturedId;

    await clsRtracer.runWithId(async () => {
      capturedId = getId();
    }, testId);

    expect(capturedId).toBe(testId);
  });

  it('exists should return false when not in async context', () => {
    expect(exists()).toBe(false);
  });

  it('exists should return true when in async context', async () => {
    let result;

    await clsRtracer.runWithId(async () => {
      result = exists();
    }, 'test-id');

    expect(result).toBe(true);
  });

  it('should propagate correlation ID through async operations', async () => {
    const testId = 'test-id-123';
    const results = [];

    await clsRtracer.runWithId(async () => {
      results.push(getId());
      await delay(10);
      results.push(getId());
    }, testId);

    expect(results).toEqual([testId, testId]);
  });

  it('should handle nested async operations', async () => {
    const testId = 'nested-test-id';
    const results = [];

    await clsRtracer.runWithId(async () => {
      results.push(getId());
      await nestedAsyncOperation(results);
    }, testId);

    expect(results).toEqual([testId, testId]);
  });

  it('should generate a correlation ID for requests', async () => {
    const app = createTestApp();
    const response = await request(app).get('/test');

    expect(response.status).toBe(200);
    expect(response.body.correlationId).toBeDefined();
    expect(typeof response.body.correlationId).toBe('string');
    expect(response.body.correlationId.length).toBeGreaterThan(0);
  });

  it('should maintain correlation ID through async operations in Express', async () => {
    const app = createTestApp();
    const response = await request(app).get('/async-test');

    expect(response.status).toBe(200);
    expect(response.body.correlationId1).toBe(response.body.correlationId2);
    expect(response.body.correlationId1).toBeDefined();
  });

  it('should generate different IDs for different requests', async () => {
    const app = createTestApp();
    const response1 = await request(app).get('/test');
    const response2 = await request(app).get('/test');

    expect(response1.body.correlationId).not.toBe(response2.body.correlationId);
  });

  it('should accept X-Request-ID header from client', async () => {
    const app = createTestApp();
    const customId = 'preserved-id-456';
    const response = await request(app).get('/test').set('X-Request-ID', customId);

    expect(response.status).toBe(200);
    expect(response.body.correlationId).toBe(customId);
  });
});
