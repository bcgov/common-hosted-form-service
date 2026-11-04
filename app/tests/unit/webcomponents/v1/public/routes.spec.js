const express = require('express');
const request = require('supertest');

const authService = require('../../../../../src/forms/auth/service');
const fileService = require('../../../../../src/forms/file/service');
const formService = require('../../../../../src/forms/form/service');
const submissionService = require('../../../../../src/forms/submission/service');
const webcomponentSettingsService = require('../../../../../src/forms/form/webcomponentSettings/service');
const webcomponentRouter = require('../../../../../src/webcomponents');
const publicController = require('../../../../../src/webcomponents/v1/public/controller');

// Runs the real web component router (credential stripping, runtime-auth, origin check, controller); services are stubbed.

const publicForm = '11111111-1111-4111-8111-111111111111';
const loginForm = '22222222-2222-4222-8222-222222222222';
const noOriginsForm = '33333333-3333-4333-8333-333333333333';
const allowedOrigin = 'https://www.example.com';

const forms = {
  [publicForm]: { identityProviders: [{ code: 'public' }], allowedOrigins: [allowedOrigin] },
  [loginForm]: { identityProviders: [{ code: 'idir' }], allowedOrigins: [allowedOrigin] },
  [noOriginsForm]: { identityProviders: [{ code: 'public' }], allowedOrigins: [] },
};

const schema = { display: 'form', components: [{ type: 'textfield', key: 'name' }] };
const body = { submission: { data: { name: 'Ada' } } };
const wrongApiKey = Buffer.from(`${publicForm}:wrong`).toString('base64');

describe('webcomponents/v1/public routes', () => {
  let app;
  let handlers;

  // runtime-auth reads the published form itself, so a refused request shows as a handler that never ran
  const expectNoHandler = () => {
    for (const handler of handlers) expect(handler).not.toHaveBeenCalled();
  };

  beforeEach(() => {
    jest.spyOn(authService, 'readUser').mockResolvedValue({ id: 'public-user-id', username: 'public-user', idpCode: 'public' });
    jest.spyOn(formService, 'readForm').mockImplementation(async (formId) => {
      const form = forms[formId];
      if (!form) throw new Error('NotFoundError');
      return { id: formId, identityProviders: form.identityProviders, active: true };
    });
    // runtime-auth loads the published form for these routes, so this is what it resolves
    jest.spyOn(formService, 'readPublishedForm').mockImplementation(async (formId) => {
      const form = forms[formId];
      if (!form) throw new Error('NotFoundError');
      return { id: formId, name: 'Form', active: true, identityProviders: form.identityProviders, versions: [{ id: 'version-1', schema }] };
    });
    jest.spyOn(formService, 'createSubmission').mockResolvedValue({
      id: '44444444-4444-4444-8444-444444444444',
      confirmationId: '44444444',
      createdAt: '2026-10-23T00:00:00.000Z',
      createdBy: 'public',
      submission: body.submission,
    });
    jest.spyOn(webcomponentSettingsService, 'readAllowedOrigins').mockImplementation(async (formId) => forms[formId].allowedOrigins);

    handlers = [jest.spyOn(publicController, 'readFormSchema'), jest.spyOn(publicController, 'createSubmission')];

    app = express();
    app.use(express.json());
    app.use('/webcomponents', webcomponentRouter);
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => res.status(err.status || 500).json({ detail: err.detail || err.message }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /:formId/schema', () => {
    it('returns the schema for a Public form on an allowed origin', async () => {
      const res = await request(app).get(`/webcomponents/v1/public/${publicForm}/schema?active=false`).set('Origin', allowedOrigin);
      expect(res.statusCode).toBe(200);
      expect(res.body.schema).toEqual(schema);
      expect(res.headers.vary).toMatch(/Origin/);
      expect(formService.readPublishedForm).toHaveBeenCalledWith(publicForm);
      expect(webcomponentSettingsService.readAllowedOrigins).toHaveBeenCalledWith(publicForm);
    });

    it('returns only the form fields the web component reads', async () => {
      formService.readPublishedForm.mockImplementationOnce(async (formId) => ({
        id: formId,
        name: 'Form',
        showSubmissionConfirmation: true,
        hideSubmissionContentOnSuccess: true,
        submissionReceivedEmails: ['owner@example.com'],
        createdBy: 'JDOE@idir',
        updatedBy: 'ASMITH@idir',
        identityProviders: [{ code: 'public', createdBy: 'migration-002' }],
        versions: [{ id: 'version-1', createdBy: 'JDOE@idir', updatedBy: 'ASMITH@idir', schema }],
      }));
      const res = await request(app).get(`/webcomponents/v1/public/${publicForm}/schema`).set('Origin', allowedOrigin);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        form: { name: 'Form', showSubmissionConfirmation: true, hideSubmissionContentOnSuccess: true, identityProviders: [{ code: 'public' }] },
        schema,
      });
    });

    it('matches the origin after normalising case and default port', async () => {
      const res = await request(app).get(`/webcomponents/v1/public/${publicForm}/schema`).set('Origin', 'https://WWW.Example.com:443');
      expect(res.statusCode).toBe(200);
    });

    it('returns 404 for a form that does not use the Public identity provider', async () => {
      const res = await request(app).get(`/webcomponents/v1/public/${loginForm}/schema`).set('Origin', allowedOrigin);
      expect(res.statusCode).toBe(404);
      expectNoHandler();
    });

    it('returns 404 for an unknown form', async () => {
      const res = await request(app).get('/webcomponents/v1/public/55555555-5555-4555-8555-555555555555/schema').set('Origin', allowedOrigin);
      expect(res.statusCode).toBe(404);
    });

    it.each([
      ['an origin that is not allowed', 'https://evil.example.org'],
      ['an allowed host over http', 'http://www.example.com'],
      ['an opaque origin', 'null'],
    ])('returns 403 for %s', async (_name, origin) => {
      const res = await request(app).get(`/webcomponents/v1/public/${publicForm}/schema`).set('Origin', origin);
      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({ detail: 'This website is not allowed to embed this form.' });
      expectNoHandler();
    });

    it('returns 403 when the request has no Origin', async () => {
      const res = await request(app).get(`/webcomponents/v1/public/${publicForm}/schema`);
      expect(res.statusCode).toBe(403);
    });

    it('returns 403 when the form has no allowed origins', async () => {
      const res = await request(app).get(`/webcomponents/v1/public/${noOriginsForm}/schema`).set('Origin', allowedOrigin);
      expect(res.statusCode).toBe(403);
    });

    it.each([
      ['a host Bearer token', { Authorization: 'Bearer host.app.token' }],
      ['an API key', { Authorization: `Basic ${wrongApiKey}` }],
      ['a gateway token', { 'X-Chefs-Gateway-Token': 'not-a-real-token' }],
    ])('ignores %s and keeps it from the handler', async (_name, headers) => {
      jest.spyOn(publicController, 'readFormSchema');
      const res = await request(app).get(`/webcomponents/v1/public/${publicForm}/schema`).set('Origin', allowedOrigin).set(headers);
      expect(res.statusCode).toBe(200);
      const [req] = publicController.readFormSchema.mock.calls[0];
      expect(req.headers).not.toHaveProperty('authorization');
      expect(req.headers).not.toHaveProperty('x-chefs-gateway-token');
    });
  });

  describe('query parameters naming another resource', () => {
    const submittedFile = '77777777-7777-4777-8777-777777777777';
    const publicSubmission = '88888888-8888-4888-8888-888888888888';

    beforeEach(() => {
      // A file and a submission that belong to the Public form, which allows the origin
      jest.spyOn(fileService, 'read').mockResolvedValue({ id: submittedFile, formSubmissionId: publicSubmission });
      jest.spyOn(submissionService, 'read').mockResolvedValue({
        submission: { id: publicSubmission },
        form: { id: publicForm, identityProviders: [{ code: 'public' }] },
        version: {},
      });
    });

    it.each([
      ['GET', `/webcomponents/v1/public/${loginForm}/schema?fileId=${submittedFile}`],
      ['POST', `/webcomponents/v1/public/${loginForm}/submit?fileId=${submittedFile}`],
      ['GET', `/webcomponents/v1/public/${loginForm}/schema?submissionId=${publicSubmission}`],
      ['POST', `/webcomponents/v1/public/${loginForm}/submit?submissionId=${publicSubmission}`],
    ])('%s %s still checks the form in the path', async (method, url) => {
      const res = await request(app)[method.toLowerCase()](url).set('Origin', allowedOrigin).send(body);
      expect(res.statusCode).toBe(404);
      expectNoHandler();
      expect(formService.createSubmission).not.toHaveBeenCalled();
    });
  });

  describe('POST /:formId/submit', () => {
    const submit = (formId, payload = body) => request(app).post(`/webcomponents/v1/public/${formId}/submit`).set('Origin', allowedOrigin).send(payload);

    it('creates a submission and returns only its id, confirmation id, time and draft flag', async () => {
      const res = await submit(publicForm);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ id: '44444444-4444-4444-8444-444444444444', confirmationId: '44444444', createdAt: '2026-10-23T00:00:00.000Z', draft: false });
      expect(formService.createSubmission).toHaveBeenCalledWith(
        'version-1',
        { submission: { data: body.submission.data }, draft: false },
        expect.objectContaining({ public: true })
      );
    });

    it('always stores the submission as final', async () => {
      await submit(publicForm, { ...body, draft: true });
      expect(formService.createSubmission).toHaveBeenCalledWith('version-1', expect.objectContaining({ draft: false }), expect.anything());
    });

    it('takes only the submission data and metadata from the request', async () => {
      const metadata = { timezone: 'America/Vancouver' };
      await submit(publicForm, { submission: { data: body.submission.data, metadata, state: 'x' }, updatedAt: '2000-01-01', deleted: true, queuedAt: 'now' });
      expect(formService.createSubmission).toHaveBeenCalledWith('version-1', { submission: { data: body.submission.data, metadata }, draft: false }, expect.anything());
    });

    it('submits as the anonymous user when a host passes its own token', async () => {
      const res = await request(app).post(`/webcomponents/v1/public/${publicForm}/submit`).set('Origin', allowedOrigin).set('Authorization', 'Bearer host.app.token').send(body);
      expect(res.statusCode).toBe(201);
      expect(formService.createSubmission).toHaveBeenCalledWith('version-1', expect.anything(), expect.objectContaining({ public: true, id: 'public-user-id' }));
    });

    it('returns 400 when the submission references files', async () => {
      const res = await submit(publicForm, { submission: { data: { upload: [{ data: { id: '66666666-6666-4666-8666-666666666666' } }] } } });
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ detail: 'Anonymous submissions cannot include files.' });
      expect(formService.createSubmission).not.toHaveBeenCalled();
    });

    it.each([[{}], [{ submission: {} }], [{ submission: { data: 'text' } }], [{ submission: { data: [{ name: 'Ada' }] } }]])('returns 400 for body %p', async (payload) => {
      const res = await submit(publicForm, payload);
      expect(res.statusCode).toBe(400);
      expect(formService.createSubmission).not.toHaveBeenCalled();
    });

    it('returns 400 when the form has no published version', async () => {
      formService.readPublishedForm.mockResolvedValueOnce({ id: publicForm, active: true, identityProviders: [{ code: 'public' }], versions: [] });
      const res = await submit(publicForm);
      expect(res.statusCode).toBe(400);
      expect(formService.createSubmission).not.toHaveBeenCalled();
    });

    it('returns 404 for a form that does not use the Public identity provider', async () => {
      const res = await submit(loginForm);
      expect(res.statusCode).toBe(404);
      expect(formService.createSubmission).not.toHaveBeenCalled();
    });

    it('returns 403 for an origin that is not allowed', async () => {
      const res = await request(app).post(`/webcomponents/v1/public/${publicForm}/submit`).set('Origin', 'https://evil.example.org').send(body);
      expect(res.statusCode).toBe(403);
      expect(formService.createSubmission).not.toHaveBeenCalled();
    });
  });
});
