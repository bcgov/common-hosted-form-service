const express = require('express');
const request = require('supertest');

const authService = require('../../../../src/forms/auth/service');
const fileService = require('../../../../src/forms/file/service');
const formService = require('../../../../src/forms/form/service');
const submissionService = require('../../../../src/forms/submission/service');
const gatewayService = require('../../../../src/gateway/v1/auth/service');
const formViewerController = require('../../../../src/webcomponents/v1/form-viewer/controller');
const printController = require('../../../../src/webcomponents/v1/print/controller');
const fileController = require('../../../../src/forms/file/controller');
const filesRoutes = require('../../../../src/webcomponents/v1/files/routes');
const formViewerRoutes = require('../../../../src/webcomponents/v1/form-viewer/routes');
const printRoutes = require('../../../../src/webcomponents/v1/print/routes');

// Runs the real runtime-auth pipeline; services and controllers are stubbed.

const formA = { id: '11111111-1111-4111-8111-111111111111', secret: 'secret-a' };
const formB = { id: '22222222-2222-4222-8222-222222222222', secret: 'secret-b' };
const forms = { [formA.id]: formA, [formB.id]: formB };

const submissionA = '33333333-3333-4333-8333-333333333333';
const submissionB = '44444444-4444-4444-8444-444444444444';
const submissionForms = { [submissionA]: formA.id, [submissionB]: formB.id };

const basicAuth = (form) => {
  const credentials = Buffer.from(`${form.id}:${form.secret}`).toString('base64');
  return { Authorization: `Basic ${credentials}` };
};

const gatewayAuth = async (form) => ({ 'X-Chefs-Gateway-Token': await gatewayService.createToken({ formId: form.id }) });

const ok = async (_req, res) => res.status(200).json({ ok: true });

describe('webcomponents credential form binding', () => {
  let app;
  let controllerSpies;

  beforeEach(() => {
    jest.spyOn(authService, 'readUser').mockResolvedValue({ id: 'api-user-id', username: 'api-user' });
    // uuid columns match case-insensitively
    jest.spyOn(formService, 'readApiKey').mockImplementation(async (formId) => {
      const form = forms[formId.toLowerCase()];
      return form ? { formId, secret: form.secret, filesApiAccess: true } : undefined;
    });
    jest.spyOn(formService, 'readForm').mockImplementation(async (formId) => {
      const form = forms[formId];
      return form ? { id: form.id, identityProviders: [], active: true } : undefined;
    });
    // The schema, submit and print-draft routes resolve the published form instead
    jest.spyOn(formService, 'readPublishedForm').mockImplementation(async (formId) => {
      const form = forms[formId];
      return form ? { id: form.id, identityProviders: [], active: true, versions: [] } : undefined;
    });
    jest.spyOn(submissionService, 'read').mockImplementation(async (submissionId) => {
      const formId = submissionForms[submissionId];
      if (!formId) throw new Error('NotFoundError');
      return { submission: { id: submissionId }, form: { id: formId, identityProviders: [] }, version: {} };
    });

    controllerSpies = [
      jest.spyOn(formViewerController, 'readFormSchema').mockImplementation(ok),
      jest.spyOn(formViewerController, 'createSubmission').mockImplementation(ok),
      jest.spyOn(formViewerController, 'readSubmission').mockImplementation(ok),
      jest.spyOn(printController, 'printSubmission').mockImplementation(ok),
      jest.spyOn(printController, 'printDraft').mockImplementation(ok),
      jest.spyOn(fileController, 'read').mockImplementation(ok),
      jest.spyOn(fileController, 'delete').mockImplementation(ok),
    ];

    app = express();
    app.use(express.json());
    app.use('/webcomponents/v1/files', filesRoutes);
    app.use('/webcomponents/v1/form-viewer', formViewerRoutes);
    app.use('/webcomponents/v1/print', printRoutes);
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => res.status(err.status || 500).json({ detail: err.detail || err.message }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const expectHandlerNotCalled = () => {
    for (const spy of controllerSpies) expect(spy).not.toHaveBeenCalled();
  };

  describe('credential for the requested form', () => {
    it('GET /:formId/schema returns 200', async () => {
      const res = await request(app).get(`/webcomponents/v1/form-viewer/${formA.id}/schema`).set(basicAuth(formA));
      expect(res.statusCode).toBe(200);
    });

    it('GET /:formId/submission/:formSubmissionId returns 200', async () => {
      const res = await request(app).get(`/webcomponents/v1/form-viewer/${formA.id}/submission/${submissionA}`).set(basicAuth(formA));
      expect(res.statusCode).toBe(200);
    });

    it('GET /:formId/schema returns 200 when the credential form id is upper case', async () => {
      const upperFormA = { id: formA.id.toUpperCase(), secret: formA.secret };
      const res = await request(app).get(`/webcomponents/v1/form-viewer/${formA.id}/schema`).set(basicAuth(upperFormA));
      expect(res.statusCode).toBe(200);
    });

    it('POST /:formId/submission/:formSubmissionId/print returns 200', async () => {
      const res = await request(app)
        .post(`/webcomponents/v1/print/${formA.id}/submission/${submissionA}/print`)
        .set(await gatewayAuth(formA));
      expect(res.statusCode).toBe(200);
    });
  });

  describe('credential for another form', () => {
    it('GET /:formId/schema returns 404 with Basic auth', async () => {
      const res = await request(app).get(`/webcomponents/v1/form-viewer/${formB.id}/schema`).set(basicAuth(formA));
      expect(res.statusCode).toBe(404);
      expectHandlerNotCalled();
    });

    it('POST /:formId/submit returns 404 with a gateway token', async () => {
      const res = await request(app)
        .post(`/webcomponents/v1/form-viewer/${formB.id}/submit`)
        .set(await gatewayAuth(formA))
        .send({ submission: { data: {} } });
      expect(res.statusCode).toBe(404);
      expectHandlerNotCalled();
    });

    it('GET /:formId/submission/:formSubmissionId returns 404', async () => {
      const res = await request(app).get(`/webcomponents/v1/form-viewer/${formB.id}/submission/${submissionB}`).set(basicAuth(formA));
      expect(res.statusCode).toBe(404);
      expectHandlerNotCalled();
    });

    it('POST /:formId/print returns 404', async () => {
      const res = await request(app)
        .post(`/webcomponents/v1/print/${formB.id}/print`)
        .set(basicAuth(formA))
        .send({ submission: { data: {} } });
      expect(res.statusCode).toBe(404);
      expectHandlerNotCalled();
    });
  });

  describe('submission that belongs to another form', () => {
    it('GET /:formId/submission/:formSubmissionId returns 404', async () => {
      const res = await request(app).get(`/webcomponents/v1/form-viewer/${formA.id}/submission/${submissionB}`).set(basicAuth(formA));
      expect(res.statusCode).toBe(404);
      expectHandlerNotCalled();
    });

    it('POST /:formId/submission/:formSubmissionId/print returns 404', async () => {
      const res = await request(app)
        .post(`/webcomponents/v1/print/${formA.id}/submission/${submissionB}/print`)
        .set(await gatewayAuth(formA));
      expect(res.statusCode).toBe(404);
      expectHandlerNotCalled();
    });
  });

  describe('draft files', () => {
    const draftFile = '66666666-6666-4666-8666-666666666666';
    const fileUrl = `/webcomponents/v1/files/${draftFile}`;
    const mockDraft = (formId) => jest.spyOn(fileService, 'read').mockResolvedValue({ id: draftFile, formSubmissionId: null, formId, createdBy: 'api-user' });

    it.each([['GET'], ['DELETE']])('%s returns 200 for a credential on the form the file was uploaded for', async (method) => {
      mockDraft(formA.id);
      const res = await request(app)[method.toLowerCase()](fileUrl).set(basicAuth(formA));
      expect(res.statusCode).toBe(200);
    });

    it.each([['GET'], ['DELETE']])('%s returns 404 for a credential on another form', async (method) => {
      mockDraft(formA.id);
      const res = await request(app)
        [method.toLowerCase()](fileUrl)
        .set(await gatewayAuth(formB));
      expect(res.statusCode).toBe(404);
      expectHandlerNotCalled();
    });

    it('returns 404 for a draft file with no recorded form', async () => {
      mockDraft(null);
      const res = await request(app).get(fileUrl).set(basicAuth(formA));
      expect(res.statusCode).toBe(404);
      expectHandlerNotCalled();
    });
  });

  describe('query parameters naming another resource', () => {
    const draftFile = '55555555-5555-4555-8555-555555555555';

    beforeEach(() => {
      // A draft file has no submission, so it resolves without a form
      jest.spyOn(fileService, 'read').mockResolvedValue({ id: draftFile, formSubmissionId: null });
    });

    it.each([
      ['GET', `/webcomponents/v1/form-viewer/${formB.id}/schema?fileId=${draftFile}`],
      ['POST', `/webcomponents/v1/form-viewer/${formB.id}/submit?fileId=${draftFile}`],
      ['GET', `/webcomponents/v1/form-viewer/${formB.id}/submission/${submissionB}?fileId=${draftFile}`],
      ['POST', `/webcomponents/v1/print/${formB.id}/print?fileId=${draftFile}`],
      ['GET', `/webcomponents/v1/form-viewer/${formB.id}/schema?submissionId=${submissionA}`],
    ])('%s %s returns 404 for a credential on another form', async (method, url) => {
      const res = await request(app)
        [method.toLowerCase()](url)
        .set(basicAuth(formA))
        .send({ submission: { data: {} } });
      expect(res.statusCode).toBe(404);
      expectHandlerNotCalled();
    });
  });
});
