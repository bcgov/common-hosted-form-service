const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');

const { releaseDir } = require('../../../../../src/webcomponents/common/releases');
const routes = require('../../../../../src/webcomponents/v1/assets/routes');

const assetsDir = path.join(releaseDir('v1'), 'assets');

// Collect the raw body so binary files compare byte for byte
function binary(res, cb) {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
}

describe('webcomponents/v1/assets routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/webcomponents/v1/assets', routes);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['/chefs-index.css', 'chefs-index.css', 'text/css'],
    ['/chefs-theme.css', 'chefs-theme.css', 'text/css'],
    ['/formio.js', 'formio.full.min.js', 'application/javascript'],
    ['/formio.css', 'formio.full.min.css', 'text/css'],
    ['/font-awesome/css/font-awesome.min.css', 'font-awesome/css/font-awesome.min.css', 'text/css'],
    ['/font-awesome/fonts/fontawesome-webfont.woff2', 'font-awesome/fonts/fontawesome-webfont.woff2', 'font/woff2'],
    ['/font-awesome/fonts/FontAwesome.otf', 'font-awesome/fonts/FontAwesome.otf', 'font/otf'],
    ['/chefs-assets/BCSans-Regular-D1GWWdtt.woff', 'chefs-assets/BCSans-Regular-D1GWWdtt.woff', 'font/woff'],
    ['/chefs-assets/spritesheet-DpIxuf5L.svg', 'chefs-assets/spritesheet-DpIxuf5L.svg', 'image/svg+xml'],
  ])('serves %s from the v1 release', async (url, file, contentType) => {
    const res = await request(app).get(`/webcomponents/v1/assets${url}`).buffer(true).parse(binary);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe(contentType);
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(res.body.equals(fs.readFileSync(path.join(assetsDir, file)))).toBe(true);
  });

  it('serves every chefs-assets file referenced by chefs-index.css', async () => {
    const css = fs.readFileSync(path.join(assetsDir, 'chefs-index.css'), 'utf8');
    expect(css).not.toContain('/app/assets/');
    const files = [...new Set([...css.matchAll(/url\(chefs-assets\/([^?#)]+)/g)].map((match) => match[1]))];
    expect(files).toHaveLength(14);
    const responses = await Promise.all(files.map((file) => request(app).get(`/webcomponents/v1/assets/chefs-assets/${file}`)));
    expect(responses.map((res) => res.statusCode)).toEqual(files.map(() => 200));
  });

  it.each([
    ['/chefs-index.css', 'CHEFS index CSS not found'],
    ['/chefs-theme.css', 'CHEFS theme CSS not found'],
    ['/formio.js', 'Form.io asset not found'],
    ['/formio.css', 'Form.io CSS not found'],
    ['/font-awesome/css/font-awesome.min.css', 'Font Awesome CSS not found'],
  ])('returns 404 when %s is missing', async (url, detail) => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const res = await request(app).get(`/webcomponents/v1/assets${url}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ detail });
  });

  it.each([
    ['/font-awesome/fonts/missing.woff', 'Font file not found'],
    ['/chefs-assets/missing.woff', 'Asset file not found'],
  ])('returns 404 for unknown file %s', async (url, detail) => {
    const res = await request(app).get(`/webcomponents/v1/assets${url}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ detail });
  });

  it.each([
    ['/font-awesome/fonts/bad%24name.woff', 'Invalid font path'],
    ['/font-awesome/fonts/a..b.woff', 'Invalid font path'],
    ['/chefs-assets/bad%24name.woff', 'Invalid asset path'],
    ['/chefs-assets/a..b.woff', 'Invalid asset path'],
  ])('returns 400 for invalid file name %s', async (url, detail) => {
    const res = await request(app).get(`/webcomponents/v1/assets${url}`);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ detail });
  });

  // An encoded slash reaches the handler as part of :file
  it.each([
    ['/font-awesome/fonts/..%2F..%2Fchefs-index.css', 'Invalid font path'],
    ['/font-awesome/fonts/..%2F..%2F..%2Fintegrity.json', 'Invalid font path'],
    ['/chefs-assets/..%2Fchefs-index.css', 'Invalid asset path'],
    ['/chefs-assets/..%2F..%2Fintegrity.json', 'Invalid asset path'],
  ])('returns 400 for path traversal %s', async (url, detail) => {
    const res = await request(app).get(`/webcomponents/v1/assets${url}`);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ detail });
  });

  it.each(['/formio.js', '/formio.css', '/font-awesome/css/font-awesome.min.css', '/font-awesome/fonts/fontawesome-webfont.ttf', '/chefs-assets/BCSans-Bold-DLThXedW.woff'])(
    'returns 500 when %s handler throws',
    async (url) => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => {
        throw new Error('boom');
      });
      const res = await request(app).get(`/webcomponents/v1/assets${url}`);
      expect(res.statusCode).toBe(500);
    }
  );
});
