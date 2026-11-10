const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const controller = require('../../../../../src/forms/form/webcomponentSettings/controller');
const service = require('../../../../../src/forms/form/webcomponentSettings/service');

const currentUser = { usernameIdp: 'TESTER' };
const formId = uuid.v4();
const settings = { id: uuid.v4(), formId, allowedOrigins: ['https://www.example.com'] };

afterEach(() => {
  jest.restoreAllMocks();
});

describe('readWebcomponentSettings', () => {
  it('returns 200 with the settings', async () => {
    jest.spyOn(service, 'readSettings').mockResolvedValue(settings);
    const req = getMockReq({ params: { formId } });
    const { res, next } = getMockRes();

    await controller.readWebcomponentSettings(req, res, next);

    expect(service.readSettings).toHaveBeenCalledWith(formId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(settings);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes errors to next', async () => {
    const error = new Error('db down');
    jest.spyOn(service, 'readSettings').mockRejectedValue(error);
    const req = getMockReq({ params: { formId } });
    const { res, next } = getMockRes();

    await controller.readWebcomponentSettings(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('upsertWebcomponentSettings', () => {
  it('returns 200 with the saved settings', async () => {
    jest.spyOn(service, 'upsert').mockResolvedValue(settings);
    const body = { allowedOrigins: ['https://www.example.com'] };
    const req = getMockReq({ params: { formId }, body, currentUser });
    const { res, next } = getMockRes();

    await controller.upsertWebcomponentSettings(req, res, next);

    expect(service.upsert).toHaveBeenCalledWith(formId, body, currentUser);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(settings);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes errors to next', async () => {
    const error = new Error('invalid');
    jest.spyOn(service, 'upsert').mockRejectedValue(error);
    const req = getMockReq({ params: { formId }, body: {}, currentUser });
    const { res, next } = getMockRes();

    await controller.upsertWebcomponentSettings(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
