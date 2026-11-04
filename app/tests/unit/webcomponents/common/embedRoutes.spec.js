const express = require('express');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');

const { createEmbedRouter } = require('../../../../src/webcomponents/common/embedRoutes');
const { releaseDir } = require('../../../../src/webcomponents/common/releases');

// Fixture releases folder: one served release, one without integrity.json, a non-version folder and v1
function writeFixture(dir) {
  const files = {
    '1.1.0/integrity.json': '{}\n',
    '1.1.0/embed/chefs-form-viewer.min.js': 'console.log("1.1.0");\n',
    '1.1.0/assets/chefs-index.css': 'body{}\n',
    '1.1.0/.hidden': 'secret\n',
    '9.9.9/embed/chefs-form-viewer.min.js': 'console.log("9.9.9");\n',
    '1.1.0-beta/integrity.json': '{}\n',
    '1.1.0-beta/embed/chefs-form-viewer.min.js': 'console.log("beta");\n',
    'v1/embed/chefs-form-viewer.js': 'console.log("v1");\n',
  };
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  }
}

describe('webcomponents embed routes', () => {
  let dir;
  let app;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chefs-embed-'));
    writeFixture(dir);
    app = express();
    app.use('/app/embed', createEmbedRouter(dir));
    app.use((_req, res) => res.status(418).send('fell through'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe('versioned releases', () => {
    it.each([
      ['/embed/chefs-form-viewer.min.js', 'text/javascript; charset=utf-8', 'console.log("1.1.0");\n'],
      ['/assets/chefs-index.css', 'text/css; charset=utf-8', 'body{}\n'],
      ['/integrity.json', 'application/json; charset=utf-8', '{}\n'],
    ])('serves %s with release headers', async (file, contentType, body) => {
      const res = await request(app).get(`/app/embed/1.1.0${file}`);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe(contentType);
      expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.text).toBe(body);
    });

    it('answers HEAD requests', async () => {
      const res = await request(app).head('/app/embed/1.1.0/embed/chefs-form-viewer.min.js');
      expect(res.statusCode).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('*');
    });

    it.each([
      ['unknown file', '/app/embed/1.1.0/embed/missing.js'],
      ['dotfile', '/app/embed/1.1.0/.hidden'],
      ['directory', '/app/embed/1.1.0/embed/'],
      ['release root', '/app/embed/1.1.0'],
      ['unknown version', '/app/embed/2.0.0/embed/chefs-form-viewer.min.js'],
      ['version without integrity.json', '/app/embed/9.9.9/embed/chefs-form-viewer.min.js'],
      ['encoded traversal', '/app/embed/1.1.0/..%2Fv1%2Fembed%2Fchefs-form-viewer.js'],
      ['malformed escape', '/app/embed/1.1.0/%FF'],
    ])('returns 404 with CORS for %s', async (_name, url) => {
      const res = await request(app).get(url);
      expect(res.statusCode).toBe(404);
      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.body).toEqual({ detail: 'Release file not found' });
    });

    it('returns 500 with CORS when a release file cannot be read', async () => {
      const stat = fs.stat;
      jest.spyOn(fs, 'stat').mockImplementation((file, ...args) => {
        if (!String(file).includes(`${path.sep}1.1.0${path.sep}`)) return stat(file, ...args);
        args[args.length - 1](Object.assign(new Error('EIO: i/o error'), { code: 'EIO' }));
      });
      const res = await request(app).get('/app/embed/1.1.0/embed/chefs-form-viewer.min.js');
      expect(res.statusCode).toBe(500);
      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body).toEqual({ detail: 'Release file could not be read' });
    });

    it('answers a range past the end with 416 and an uncacheable body', async () => {
      const res = await request(app).get('/app/embed/1.1.0/embed/chefs-form-viewer.min.js').set('Range', 'bytes=99999999-');
      expect(res.statusCode).toBe(416);
      expect(res.headers['content-range']).toBe('bytes */22');
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.body).toEqual({ detail: 'Range Not Satisfiable' });
    });

    it.each([
      ['If-Match', '"not-this-file"'],
      ['If-Unmodified-Since', 'Mon, 01 Jan 2001 00:00:00 GMT'],
    ])('answers a failed %s with 412 and an uncacheable body', async (header, value) => {
      const res = await request(app).get('/app/embed/1.1.0/embed/chefs-form-viewer.min.js').set(header, value);
      expect(res.statusCode).toBe(412);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body).toEqual({ detail: 'Precondition Failed' });
    });

    it('returns 404 for methods other than GET and HEAD', async () => {
      const res = await request(app).post('/app/embed/1.1.0/embed/chefs-form-viewer.min.js');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('legacy v1', () => {
    it('serves v1 embed files with the default static headers', async () => {
      const res = await request(app).get('/app/embed/chefs-form-viewer.js');
      expect(res.statusCode).toBe(200);
      expect(res.headers['cache-control']).toBe('public, max-age=0');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
      expect(res.headers['cross-origin-resource-policy']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBeUndefined();
      expect(res.text).toBe('console.log("v1");\n');
    });

    it.each([
      '/app/embed/missing.js',
      '/app/embed/1.1.0-beta/embed/chefs-form-viewer.min.js',
      '/app/embed/v1/embed/chefs-form-viewer.js',
      '/app/embed/%FF',
      '/app/embed/1.1.0x/a.js',
    ])('falls through for %s', async (url) => {
      const res = await request(app).get(url);
      expect(res.statusCode).toBe(418);
    });
  });

  describe('committed releases', () => {
    it('serves the frozen v1 embed files by default', async () => {
      const real = express();
      real.use('/app/embed', createEmbedRouter());
      const res = await request(real).get('/app/embed/chefs-form-viewer.min.js');
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe(fs.readFileSync(path.join(releaseDir('v1'), 'embed/chefs-form-viewer.min.js'), 'utf8'));
    });
  });
});
