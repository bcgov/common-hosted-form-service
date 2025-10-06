const express = require('express');
const request = require('supertest');
const routes = require('../../../../../src/webcomponents/v1/files/routes');
const controller = require('../../../../../src/forms/file/controller');

// Mock all middleware to focus on route testing
jest.mock('cors', () => () => (req, res, next) => next());
jest.mock('../../../../../src/forms/common/middleware/validateParameter', () => ({
  validateFileId: (req, res, next) => {
    req.params.fileId = req.params.fileId || 'test-file-id';
    next();
  },
}));
jest.mock('../../../../../src/forms/auth/middleware/apiAccess', () => (req, res, next) => next());
jest.mock('../../../../../src/webcomponents/common/middleware/gatewayTokenVerify', () => (req, res, next) => next());
jest.mock('../../../../../src/webcomponents/common/middleware/originAccess', () => (req, res, next) => next());
jest.mock('../../../../../src/forms/file/middleware/filePermissions', () => ({
  currentFileRecord: (req, res, next) => next(),
  hasFileCreate: (req, res, next) => next(),
  hasFileDelete: (req, res, next) => next(),
  hasFilePermissions: () => (req, res, next) => next(),
}));
jest.mock('../../../../../src/forms/file/middleware/upload', () => ({
  fileUpload: { upload: (req, res, next) => next() },
}));
jest.mock('../../../../../src/forms/file/middleware/virusScan', () => ({
  scanFile: (req, res, next) => next(),
}));

describe('webcomponents/v1/files routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Manually set up parameter middleware to avoid mocking issues
    app.param('fileId', (req, res, next, fileId) => {
      req.params.fileId = fileId;
      next();
    });
    app.use('/webcomponents/v1/files', routes);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /:fileId', () => {
    it('routes to controller.read', async () => {
      const spy = jest.spyOn(controller, 'read').mockImplementation((req, res) => {
        res.status(200).json({ id: 'test-file-id', data: 'file content' });
      });

      const res = await request(app).get('/webcomponents/v1/files/test-file-id');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id: 'test-file-id', data: 'file content' });
      expect(spy).toHaveBeenCalled();
    });

    it('handles controller errors', async () => {
      jest.spyOn(controller, 'read').mockImplementation((req, res) => {
        res.status(404).json({ detail: 'File not found' });
      });

      const res = await request(app).get('/webcomponents/v1/files/missing-file');

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ detail: 'File not found' });
    });
  });

  describe('DELETE /:fileId', () => {
    it('routes to controller.delete', async () => {
      const spy = jest.spyOn(controller, 'delete').mockImplementation((req, res) => {
        res.status(204).send();
      });

      const res = await request(app).delete('/webcomponents/v1/files/test-file-id');

      expect(res.statusCode).toBe(204);
      expect(spy).toHaveBeenCalled();
    });

    it('handles delete errors', async () => {
      jest.spyOn(controller, 'delete').mockImplementation((req, res) => {
        res.status(403).json({ detail: 'Delete not allowed' });
      });

      const res = await request(app).delete('/webcomponents/v1/files/protected-file');

      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({ detail: 'Delete not allowed' });
    });
  });

  describe('POST /', () => {
    it('routes to controller.create for file upload', async () => {
      const spy = jest.spyOn(controller, 'create').mockImplementation((req, res) => {
        res.status(201).json({ id: 'new-file-id', filename: 'test.txt' });
      });

      const res = await request(app).post('/webcomponents/v1/files').field('filename', 'test.txt').attach('file', Buffer.from('test content'), 'test.txt');

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ id: 'new-file-id', filename: 'test.txt' });
      expect(spy).toHaveBeenCalled();
    });

    it('handles upload errors', async () => {
      jest.spyOn(controller, 'create').mockImplementation((req, res) => {
        res.status(413).json({ detail: 'File too large' });
      });

      const res = await request(app)
        .post('/webcomponents/v1/files')
        .field('filename', 'large.txt')
        .attach('file', Buffer.alloc(1024 * 1024 * 50), 'large.txt');

      expect(res.statusCode).toBe(413);
      expect(res.body).toEqual({ detail: 'File too large' });
    });

    it('handles virus scan failures', async () => {
      jest.spyOn(controller, 'create').mockImplementation((req, res) => {
        res.status(422).json({ detail: 'Virus detected' });
      });

      const res = await request(app).post('/webcomponents/v1/files').field('filename', 'infected.txt').attach('file', Buffer.from('malicious content'), 'infected.txt');

      expect(res.statusCode).toBe(422);
      expect(res.body).toEqual({ detail: 'Virus detected' });
    });
  });
});
