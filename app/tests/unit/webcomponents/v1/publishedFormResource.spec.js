const express = require('express');
const request = require('supertest');

const authService = require('../../../../src/forms/auth/service');
const formService = require('../../../../src/forms/form/service');
const formViewerRoutes = require('../../../../src/webcomponents/v1/form-viewer/routes');

// Runs the real runtime-auth pipeline and the real handlers: the keyed schema and submit routes
// must answer from the published form runtime-auth loads, not from what readForm would give.

const formId = '11111111-1111-4111-8111-111111111111';
const credentials = Buffer.from(`${formId}:secret`).toString('base64');
const basicAuth = { Authorization: `Basic ${credentials}` };
const schema = { display: 'form', components: [{ type: 'textfield', key: 'name' }] };

describe('web component routes that use the published form', () => {
  let app;

  beforeEach(() => {
    jest.spyOn(authService, 'readUser').mockResolvedValue({ id: 'api-user-id', username: 'api-user' });
    jest.spyOn(formService, 'readApiKey').mockResolvedValue({ formId, secret: 'secret', filesApiAccess: false });
    // What a formOnly resource would hold: every version, newest first, without schemas
    jest.spyOn(formService, 'readForm').mockResolvedValue({
      id: formId,
      name: 'Form',
      active: true,
      identityProviders: [],
      versions: [{ id: 'unpublished-v2' }, { id: 'published-v1' }],
    });
    jest.spyOn(formService, 'readPublishedForm').mockResolvedValue({
      id: formId,
      name: 'Form',
      active: true,
      identityProviders: [],
      versions: [{ id: 'published-v1', schema }],
    });
    jest.spyOn(formService, 'createSubmission').mockResolvedValue({ id: 'sub-1', confirmationId: 'SUB1', createdAt: 'now', draft: false });

    app = express();
    app.use(express.json());
    app.use('/webcomponents/v1/form-viewer', formViewerRoutes);
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => res.status(err.status || 500).json({ detail: err.detail || err.message }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('serves the published schema, reading the form once', async () => {
    const res = await request(app).get(`/webcomponents/v1/form-viewer/${formId}/schema`).set(basicAuth);

    expect(res.statusCode).toBe(200);
    expect(res.body.schema).toEqual(schema);
    expect(formService.readPublishedForm).toHaveBeenCalledTimes(1);
    expect(formService.readForm).not.toHaveBeenCalled();
  });

  it('submits to the published version, reading the form once', async () => {
    const res = await request(app)
      .post(`/webcomponents/v1/form-viewer/${formId}/submit`)
      .set(basicAuth)
      .send({ submission: { data: { name: 'Ada' } } });

    expect(res.statusCode).toBe(201);
    expect(formService.createSubmission).toHaveBeenCalledWith('published-v1', expect.anything(), expect.anything());
    expect(formService.readPublishedForm).toHaveBeenCalledTimes(1);
    expect(formService.readForm).not.toHaveBeenCalled();
  });
});
