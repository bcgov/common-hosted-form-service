const express = require('express');
const request = require('supertest');

jest.mock('../../../../../src/webcomponents/common/security', () => ({
  inline: () => (_req, _res, next) => next(),
}));

jest.mock('../../../../../src/webcomponents/common/middleware/originAccess', () => (_req, _res, next) => next());

const routes = require('../../../../../src/webcomponents/v1/print/routes');
const controller = require('../../../../../src/webcomponents/v1/print/controller');

describe('webcomponents/v1/print routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/webcomponents/v1/print', routes);
  });

  it('POST /:formId/submission/:formSubmissionId/print routes to controller.printSubmission', async () => {
    const spy = jest.spyOn(controller, 'printSubmission').mockImplementation(async (_req, res) => res.status(200).json({ ok: true }));
    const formId = '11111111-1111-4111-8111-111111111111';
    const submissionId = '22222222-2222-4222-8222-222222222222';
    const res = await request(app).post(`/webcomponents/v1/print/${formId}/submission/${submissionId}/print`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(spy).toHaveBeenCalled();
  });

  it('POST /:formId/print routes to controller.printDraft', async () => {
    const spy = jest.spyOn(controller, 'printDraft').mockImplementation(async (_req, res) => res.status(200).json({ ok: true }));
    const formId = '11111111-1111-4111-8111-111111111111';
    const res = await request(app)
      .post(`/webcomponents/v1/print/${formId}/print`)
      .send({ submission: { data: {} } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(spy).toHaveBeenCalled();
  });
});
