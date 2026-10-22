const controller = require('../../../../../src/webcomponents/v1/form-viewer/controller');
const service = require('../../../../../src/forms/form/service');
const { releaseDir } = require('../../../../../src/webcomponents/common/releases');
const fs = require('node:fs');
const path = require('node:path');
const { v4: uuidv4 } = require('uuid');

describe('webcomponents/v1/form-viewer controller', () => {
  describe('readFormSchema', () => {
    it('returns 400 when formId is invalid', async () => {
      const req = { params: { formId: 'not-a-uuid' }, query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await controller.readFormSchema(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ detail: 'Bad formId "not-a-uuid".' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('createSubmission', () => {
    it('returns 400 when formId is invalid', async () => {
      const req = { params: { formId: 'not-a-uuid' }, body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await controller.createSubmission(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ detail: 'Bad formId "not-a-uuid".' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('readFormSchema success paths', () => {
    it('returns first version schema with 200', async () => {
      const mockForm = { versions: [{ id: 'ver-1', schema: { display: 'form' } }] };
      jest.spyOn(service, 'readPublishedForm').mockResolvedValue(mockForm);
      const req = { params: { formId: uuidv4() }, query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await controller.readFormSchema(req, res, next);
      expect(service.readPublishedForm).toHaveBeenCalledWith(req.params.formId, req.query);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ form: mockForm, schema: mockForm.versions[0].schema });
      expect(next).not.toHaveBeenCalled();
    });

    it('falls back to form.schema when versions missing', async () => {
      const mockForm = { schema: { display: 'form' } };
      jest.spyOn(service, 'readPublishedForm').mockResolvedValue(mockForm);
      const req = { params: { formId: uuidv4() }, query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await controller.readFormSchema(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ form: mockForm, schema: mockForm.schema });
    });

    it('calls next(err) on service error', async () => {
      const boom = new Error('boom');
      jest.spyOn(service, 'readPublishedForm').mockRejectedValue(boom);
      const req = { params: { formId: uuidv4() }, query: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await controller.readFormSchema(req, res, next);
      expect(next).toHaveBeenCalledWith(boom);
    });
  });

  describe('createSubmission success/failure', () => {
    it('returns 400 when no published version', async () => {
      jest.spyOn(service, 'readPublishedForm').mockResolvedValue({ versions: [] });
      const req = { params: { formId: uuidv4() }, body: { submission: { data: {} } } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await controller.createSubmission(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ detail: 'No published version found for this form.' });
    });

    it('creates submission and returns 201', async () => {
      jest.spyOn(service, 'readPublishedForm').mockResolvedValue({ versions: [{ id: 'ver-1' }] });
      jest.spyOn(service, 'createSubmission').mockResolvedValue({ id: 'sub-1' });
      const req = {
        params: { formId: uuidv4() },
        body: { submission: { data: { a: 1 } } },
        currentUser: { id: 'external-user' },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await controller.createSubmission(req, res, next);
      expect(service.createSubmission).toHaveBeenCalledWith('ver-1', req.body, expect.objectContaining({ id: 'external-user' }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 'sub-1' });
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next(err) on service error', async () => {
      jest.spyOn(service, 'readPublishedForm').mockResolvedValue({ versions: [{ id: 'ver-1' }] });
      const boom = new Error('boom');
      jest.spyOn(service, 'createSubmission').mockRejectedValue(boom);
      const req = { params: { formId: uuidv4() }, body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await controller.createSubmission(req, res, next);
      expect(next).toHaveBeenCalledWith(boom);
    });
  });

  describe('static asset handlers', () => {
    const formViewerDir = path.join(releaseDir('v1'), 'form-viewer');

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it.each([
      ['getCustomComponents', 'bcgov-formio-components.use.min.js', 'application/javascript'],
      ['getBcGovStyles', 'chefs-form-viewer.css', 'text/css'],
      ['getBcGovTheme', 'bcgov-theme.css', 'text/css'],
    ])('%s serves %s from the v1 release', async (handler, file, contentType) => {
      const req = {};
      const headers = {};
      const res = {
        setHeader: (k, v) => {
          headers[k] = v;
        },
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      await controller[handler](req, res, next);
      expect(headers['Content-Type']).toBe(contentType);
      expect(headers['Cache-Control']).toBe('public, max-age=3600');
      expect(res.send).toHaveBeenCalledWith(fs.readFileSync(path.join(formViewerDir, file), 'utf8'));
      expect(res.status).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it.each([
      ['getCustomComponents', 'Custom components not found'],
      ['getBcGovStyles', 'BC Gov styles not found'],
      ['getBcGovTheme', 'BC Gov theme not found'],
    ])('%s returns 404 when missing', async (handler, detail) => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const req = {};
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn(), send: jest.fn() };
      const next = jest.fn();
      await controller[handler](req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ detail });
    });
  });
});
