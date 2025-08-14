const express = require('express');
const request = require('supertest');
const fs = require('fs');
const { Readable } = require('stream');

// Ensure predictable config for asset roots in tests
jest.mock('config', () => ({
  has: jest.fn(() => false),
  get: jest.fn(() => []),
}));

const routes = require('../../../../../src/webcomponents/v1/assets/routes');

describe('webcomponents/v1/assets routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/webcomponents/v1/assets', routes);
  });

  it('serves formio.js when present', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((p) => String(p).includes('formiojs/dist/formio.full.min.js'));
    jest.spyOn(fs, 'createReadStream').mockReturnValue(Readable.from('console.log("ok");'));
    const res = await request(app).get('/webcomponents/v1/assets/formio.js');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/javascript');
    expect(res.headers['cache-control']).toMatch('max-age=31536000');
    expect(res.text).toContain('ok');
  });

  it('returns 404 when formio.css missing', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const res = await request(app).get('/webcomponents/v1/assets/formio.css');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ detail: 'Form.io CSS not found' });
  });

  it('serves formio.css when present', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((p) => String(p).includes('formiojs/dist/formio.full.min.css'));
    jest.spyOn(fs, 'createReadStream').mockReturnValue(Readable.from('/*ok*/'));
    const res = await request(app).get('/webcomponents/v1/assets/formio.css');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/css');
    expect(res.headers['cache-control']).toMatch('max-age=31536000');
    expect(res.text).toContain('ok');
  });

  it('returns 404 when formio.js missing', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const res = await request(app).get('/webcomponents/v1/assets/formio.js');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ detail: 'Form.io asset not found' });
  });

  it('serves Font Awesome CSS when present', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((p) => String(p).includes('font-awesome/css/font-awesome.min.css'));
    jest.spyOn(fs, 'createReadStream').mockReturnValue(Readable.from('/* fa */'));
    const res = await request(app).get('/webcomponents/v1/assets/font-awesome/css/font-awesome.min.css');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/css');
    expect(res.text).toContain('fa');
  });

  it('returns 404 when Font Awesome CSS missing', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const res = await request(app).get('/webcomponents/v1/assets/font-awesome/css/font-awesome.min.css');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ detail: 'Font Awesome CSS not found' });
  });

  it('rejects font path traversal with 400', async () => {
    // Route param does not match slashes; use ".." to test traversal attempt
    const res = await request(app).get('/webcomponents/v1/assets/font-awesome/fonts/..');
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ detail: 'Invalid font path' });
  });

  it('serves font file with correct content-type', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((p) => String(p).includes('font-awesome/fonts/fontawesome-webfont.woff2'));
    jest.spyOn(fs, 'createReadStream').mockReturnValue(Readable.from('woff2data'));
    const res = await request(app).get('/webcomponents/v1/assets/font-awesome/fonts/fontawesome-webfont.woff2');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('font/woff2');
  });

  it('returns 404 when font file missing', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const res = await request(app).get('/webcomponents/v1/assets/font-awesome/fonts/fontawesome-webfont.ttf');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ detail: 'Font file not found' });
  });

  it('returns 500 when formio.js handler throws', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation(() => {
      throw new Error('boom');
    });
    const res = await request(app).get('/webcomponents/v1/assets/formio.js');
    expect(res.statusCode).toBe(500);
  });

  it('returns 500 when formio.css handler throws', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation(() => {
      throw new Error('boom');
    });
    const res = await request(app).get('/webcomponents/v1/assets/formio.css');
    expect(res.statusCode).toBe(500);
  });

  it('returns 500 when Font Awesome CSS handler throws', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation(() => {
      throw new Error('boom');
    });
    const res = await request(app).get('/webcomponents/v1/assets/font-awesome/css/font-awesome.min.css');
    expect(res.statusCode).toBe(500);
  });

  it('returns 500 when font file handler throws', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation(() => {
      throw new Error('boom');
    });
    const res = await request(app).get('/webcomponents/v1/assets/font-awesome/fonts/fontawesome-webfont.ttf');
    expect(res.statusCode).toBe(500);
  });
});
