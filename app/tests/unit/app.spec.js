const request = require('supertest');

const statusService = require('../../src/components/statusService');
const DataConnection = require('../../src/db/dataConnection');

// Runs the real app: its middleware order decides which handler answers an error
describe('app error handling', () => {
  let app;
  let resetConnection;

  beforeAll(() => {
    jest.spyOn(statusService, 'getStatus').mockReturnValue({ ready: true, stopped: false });
    resetConnection = jest.spyOn(DataConnection.prototype, 'resetConnection').mockImplementation(() => {});
    app = require('../../app');
  });

  beforeEach(() => {
    resetConnection.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['an unsatisfiable Range', { Range: 'bytes=99999999-' }, 416],
    ['a failed precondition', { 'If-Match': '"not-the-etag"' }, 412],
  ])('keeps the status of a static file error for %s, without resetting the DB pool', async (_name, headers, status) => {
    // A frozen v1 embed script, served as a static file
    const res = await request(app).get('/app/embed/chefs-form-viewer-embed.js').set(headers);

    expect(res.statusCode).toBe(status);
    expect(resetConnection).not.toHaveBeenCalled();
  });

  it('rejects a body nested too deeply before any route, without resetting the DB pool', async () => {
    const res = await request(app)
      .post('/app/api/v1/forms')
      .set('Content-Type', 'application/json')
      .send('{"a":'.repeat(5000) + '{}' + '}'.repeat(5000));

    expect(res.statusCode).toBe(400);
    expect(res.body.detail).toMatch(/nested more than 500 levels deep/);
    expect(resetConnection).not.toHaveBeenCalled();
  });
});
