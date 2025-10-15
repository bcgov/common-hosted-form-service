const controller = require('../../../../../src/webcomponents/v1/form-viewer/controller');
const service = require('../../../../../src/forms/form/service');
const fs = require('node:fs');
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
      const req = { params: { formId: uuidv4() }, body: { submission: { data: { a: 1 } } } };
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
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('getCustomComponents serves JS when exists', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('console.log(1);');
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
      await controller.getCustomComponents(req, res, next);
      expect(headers['Content-Type']).toBe('application/javascript');
      expect(headers['Cache-Control']).toMatch('max-age=3600');
      expect(res.send).toHaveBeenCalledWith('console.log(1);');
      expect(next).not.toHaveBeenCalled();
    });

    it('getCustomComponents returns 404 when missing', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const req = {};
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn(), send: jest.fn() };
      const next = jest.fn();
      await controller.getCustomComponents(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ detail: 'Custom components not found' });
    });

    it('getBcGovStyles serves CSS when exists', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('/* css */');
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
      await controller.getBcGovStyles(req, res, next);
      expect(headers['Content-Type']).toBe('text/css');
      expect(res.send).toHaveBeenCalledWith('/* css */');
      expect(next).not.toHaveBeenCalled();
    });

    it('getBcGovStyles returns 404 when missing', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const req = {};
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn(), send: jest.fn() };
      const next = jest.fn();
      await controller.getBcGovStyles(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ detail: 'BC Gov styles not found' });
    });

    it('getBcGovTheme serves CSS when exists', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('/* theme */');
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
      await controller.getBcGovTheme(req, res, next);
      expect(headers['Content-Type']).toBe('text/css');
      expect(res.send).toHaveBeenCalledWith('/* theme */');
      expect(next).not.toHaveBeenCalled();
    });

    it('getBcGovTheme returns 404 when missing', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const req = {};
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn(), send: jest.fn() };
      const next = jest.fn();
      await controller.getBcGovTheme(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ detail: 'BC Gov theme not found' });
    });
  });
});
