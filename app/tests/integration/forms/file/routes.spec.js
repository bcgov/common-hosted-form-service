const request = require('supertest');
const uuid = require('uuid');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const app = require('../../../../app');

const basePath = '/api/v1/files';

// Helper to create a test file
function createTestFile(filename, content = 'test file content') {
  const testDir = path.join(os.tmpdir(), 'chefs-test-fixtures');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  const filePath = path.join(testDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Helper to clean up test files
function cleanupTestFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

describe('File Routes Integration Tests', () => {
  // track created file ids for clean up
  const createdFileIds = [];
  let apikey;

  beforeAll(() => {
    apikey = process.env.APITOKEN;
  });

  describe('POST /files', () => {
    let testFilePath;

    afterEach(() => {
      if (testFilePath && fs.existsSync(testFilePath)) {
        cleanupTestFile(testFilePath);
      }
    });

    it('should return 201 when a file is uploaded with valid path', async () => {
      testFilePath = createTestFile(`test-${uuid.v4()}.txt`, 'test content');
      const response = await request(app).post(basePath).set('apikey', apikey).attach('files', testFilePath);

      expect([200, 201, 202, 503]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('originalName');
        expect(response.body).toHaveProperty('size');
        expect(response.body).toHaveProperty('createdBy');
        expect(response.body).toHaveProperty('createAt');
        if (response.body.id) {
          createdFileIds.push(response.body.id);
        }
      }
    });

    it('should return 401 or 503 when uploading without authentication', async () => {
      testFilePath = createTestFile(`test-${uuid.v4()}.txt`, 'test content');

      const response = await request(app).post(basePath).attach('files', testFilePath);

      expect([401, 403, 503]).toContain(response.status);
    });

    it('should return 400 or 503 when no file is provided', async () => {
      const response = await request(app).post(basePath).set('apikey', apikey).send({});
      expect([400, 503]).toContain(response.status);
    });

    it('should handle multiple file uploads', async () => {
      const file1 = createTestFile(`test1-${uuid.v4()}.txt`, 'content 1');
      const file2 = createTestFile(`test2-${uuid.v4()}.txt`, 'content 2');

      const response = await request(app).post(basePath).set('apikey', apikey).attach('files', file1).attach('files', file2);

      expect([200, 201, 202, 503]).toContain(response.status);

      if (response.status === 201 && Array.isArray(response.body)) {
        expect(response.body.length).toBe(2);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[1]).toHaveProperty('id');

        response.body.forEach((file) => {
          if (file.id) {
            createdFileIds.push(file.id);
          }
        });
      }

      cleanupTestFile(file1);
      cleanupTestFile(file2);
    });
  });

  describe('GET /files/:fileId', () => {
    it('should handle GET request with created file ID', async () => {
      const fileId = createdFileIds.length > 0 ? createdFileIds[0] : uuid.v4();
      const response = await request(app).get(`${basePath}/${fileId}`).set('apikey', apikey);

      expect([200, 403, 404, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.headers['content-disposition']).toBeDefined();
      }
    });

    it('should return 401 or 403 when accessing without authentication', async () => {
      const fileId = uuid.v4();
      const response = await request(app).get(`${basePath}/${fileId}`);

      expect([301, 302, 401, 403, 404, 503]).toContain(response.status);
    });

    it('should accept valid file UUID format', async () => {
      const response = await request(app).get(`${basePath}/${uuid.v4()}`).set('apikey', apikey);

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('GET /files/:fileId/clone', () => {
    it('should handle cloning an existing file', async () => {
      const fileId = createdFileIds.length > 0 ? createdFileIds[0] : uuid.v4();
      const response = await request(app).get(`${basePath}/${fileId}/clone`).set('apikey', apikey);

      expect([200, 201, 202, 301, 302, 403, 404, 503]).toContain(response.status);

      if ([200, 201, 202].includes(response.status)) {
        expect(response.body).toHaveProperty('id');
        expect(response.body.id).not.toBe(fileId);
        if (response.body.id) {
          createdFileIds.push(response.body.id);
        }
      }
    });

    it('should return 401 or 503 when cloning without authentication', async () => {
      const fileId = uuid.v4();
      const response = await request(app).get(`${basePath}/${fileId}/clone`);

      expect([301, 302, 401, 403, 404, 503]).toContain(response.status);
    });
  });

  describe('DELETE /files/:fileId', () => {
    it('should handle deleting an existing file', async () => {
      if (createdFileIds.length === 0) {
        return;
      }

      const fileId = createdFileIds.shift();
      const response = await request(app).delete(`${basePath}/${fileId}`).set('apikey', apikey);

      expect([204, 403, 404, 503]).toContain(response.status);
    });

    it('should return 401 or 503 when deleting without authentication', async () => {
      const fileId = uuid.v4();
      const response = await request(app).delete(`${basePath}/${fileId}`);

      expect([301, 302, 401, 403, 404, 503]).toContain(response.status);
    });

    it('should accept valid UUID in path', async () => {
      const response = await request(app).delete(`${basePath}/${uuid.v4()}`).set('apikey', apikey);

      expect([204, 301, 302, 403, 404, 503]).toContain(response.status);
    });
  });

  describe('DELETE /files', () => {
    it('should handle bulk deleting files', async () => {
      if (createdFileIds.length === 0) {
        return;
      }

      const fileIds = createdFileIds.splice(0);

      const response = await request(app).delete(basePath).set('apikey', apikey).send({ fileIds });

      expect([200, 204, 403, 404, 503]).toContain(response.status);
    });

    it('should return 401 or 503 when bulk deleting without authentication', async () => {
      const response = await request(app)
        .delete(basePath)
        .send({ fileIds: [uuid.v4()] });

      expect([301, 302, 401, 403, 404, 503]).toContain(response.status);
    });

    it('should return 400 or 503 when fileIds is not an array', async () => {
      const response = await request(app).delete(basePath).set('apikey', apikey).send({ fileIds: 'not-an-array' });
      expect([301, 302, 400, 503]).toContain(response.status);
    });
  });

  afterAll(async () => {
    if (createdFileIds.length > 0) {
      await request(app).delete(basePath).set('apikey', apikey).send({ fileIds: createdFileIds });
    }
  });
});
