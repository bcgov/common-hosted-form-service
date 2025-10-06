const express = require('express');
const request = require('supertest');
const routes = require('../../../../../src/webcomponents/v1/form-viewer/routes');
const controller = require('../../../../../src/webcomponents/v1/form-viewer/controller');

describe('webcomponents/v1/form-viewer routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/webcomponents/v1/form-viewer', routes);
  });

  it('GET /components routes to controller.getCustomComponents', async () => {
    const spy = jest.spyOn(controller, 'getCustomComponents').mockImplementation(async (_req, res) => res.status(200).json({ ok: true }));
    const res = await request(app).get('/webcomponents/v1/form-viewer/components');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(spy).toHaveBeenCalled();
  });

  it('GET /styles routes to controller.getBcGovStyles', async () => {
    const spy = jest.spyOn(controller, 'getBcGovStyles').mockImplementation(async (_req, res) => res.status(200).json({ css: true }));
    const res = await request(app).get('/webcomponents/v1/form-viewer/styles');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ css: true });
    expect(spy).toHaveBeenCalled();
  });

  it('GET /theme routes to controller.getBcGovTheme', async () => {
    const spy = jest.spyOn(controller, 'getBcGovTheme').mockImplementation(async (_req, res) => res.status(200).json({ theme: true }));
    const res = await request(app).get('/webcomponents/v1/form-viewer/theme');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ theme: true });
    expect(spy).toHaveBeenCalled();
  });
});
