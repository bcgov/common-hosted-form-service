const express = require('express');
const request = require('supertest');

const middleware = require('../../../../../src/forms/common/middleware');

const { jsonDepth, limitJsonDepth, MAX_JSON_DEPTH } = middleware;

// A JSON object nested the given number of levels deep, built as text so nothing recurses
const nestedJson = (depth) => '{"a":'.repeat(depth - 1) + '{}' + '}'.repeat(depth - 1);

describe('jsonDepth', () => {
  it.each([
    [42, 0],
    ['text', 0],
    [null, 0],
    [{}, 1],
    [[1, 2], 1],
    [{ a: { b: [{ c: 1 }] } }, 4],
  ])('measures %p as %p', (value, expected) => {
    expect(jsonDepth(value)).toBe(expected);
  });

  it('measures data far deeper than a call stack allows', () => {
    expect(jsonDepth(JSON.parse(nestedJson(100000)))).toBe(100000);
  });

  it('stops once past the limit', () => {
    expect(jsonDepth(JSON.parse(nestedJson(1000)), 10)).toBe(11);
  });
});

describe('limitJsonDepth', () => {
  let app;
  let handler;

  beforeEach(() => {
    handler = jest.fn((_req, res) => res.sendStatus(204));
    app = express();
    app.use(express.json({ limit: '1mb' }));
    app.use(limitJsonDepth());
    app.post('/', handler);
    app.use(middleware.errorHandler);
  });

  const post = (body) => request(app).post('/').set('Content-Type', 'application/json').send(body);

  it('allows a body at the limit', async () => {
    const res = await post(nestedJson(MAX_JSON_DEPTH));
    expect(res.statusCode).toBe(204);
    expect(handler).toHaveBeenCalled();
  });

  it.each([[MAX_JSON_DEPTH + 1], [5000]])('rejects a body %p levels deep with 400', async (depth) => {
    const res = await post(nestedJson(depth));
    expect(res.statusCode).toBe(400);
    expect(res.body.detail).toBe(`The request body is nested more than ${MAX_JSON_DEPTH} levels deep.`);
    expect(handler).not.toHaveBeenCalled();
  });

  it('counts arrays as levels', async () => {
    const res = await post('['.repeat(MAX_JSON_DEPTH + 1) + ']'.repeat(MAX_JSON_DEPTH + 1));
    expect(res.statusCode).toBe(400);
  });

  it('allows a request without a body', async () => {
    const res = await request(app).post('/');
    expect(res.statusCode).toBe(204);
  });
});
