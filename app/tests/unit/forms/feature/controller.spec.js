jest.mock('../../../../src/forms/feature/submitToEmail/worker', () => ({
  drain: jest.fn(),
}));

const controller = require('../../../../src/forms/feature/controller');
const service = require('../../../../src/forms/feature/service');
const submitToEmailWorker = require('../../../../src/forms/feature/submitToEmail/worker');
const { getMockRes } = require('@jest-mock/express');

afterEach(() => {
  jest.clearAllMocks();
});

describe('listFeatures', () => {
  it('responds 200 with the catalog', async () => {
    const data = [{ code: 'offlineForms', enabled: true }];
    service.listFeatures = jest.fn().mockResolvedValue(data);
    const { res, next } = getMockRes();

    await controller.listFeatures({}, res, next);

    expect(service.listFeatures).toBeCalledTimes(1);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith(data);
    expect(next).not.toBeCalled();
  });

  it('forwards errors to next', async () => {
    const err = new Error('boom');
    service.listFeatures = jest.fn().mockRejectedValue(err);
    const { res, next } = getMockRes();

    await controller.listFeatures({}, res, next);

    expect(next).toBeCalledWith(err);
  });
});

describe('check', () => {
  it('passes the query context to the service and responds 200', async () => {
    const data = { offlineForms: true };
    service.check = jest.fn().mockResolvedValue(data);
    const { res, next } = getMockRes();
    const req = { query: { formId: 'fid', tenantId: 'tid', code: 'offlineForms' } };

    await controller.check(req, res, next);

    expect(service.check).toBeCalledWith({ formId: 'fid', tenantId: 'tid', code: 'offlineForms' });
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith(data);
  });

  it('forwards errors to next', async () => {
    const err = new Error('boom');
    service.check = jest.fn().mockRejectedValue(err);
    const { res, next } = getMockRes();

    await controller.check({ query: {} }, res, next);

    expect(next).toBeCalledWith(err);
  });
});

describe('processSubmissionPackages', () => {
  it('drains the queue and responds 200 with the summary', async () => {
    const summary = { processed: 2, succeeded: 1, failed: 1 };
    submitToEmailWorker.drain.mockResolvedValue(summary);
    const { res, next } = getMockRes();

    await controller.processSubmissionPackages({ body: {} }, res, next);

    expect(submitToEmailWorker.drain).toBeCalledWith(undefined);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith(summary);
    expect(next).not.toBeCalled();
  });

  it('passes an optional body.batchSize through to drain', async () => {
    submitToEmailWorker.drain.mockResolvedValue({});
    const { res, next } = getMockRes();

    await controller.processSubmissionPackages({ body: { batchSize: 5 } }, res, next);

    expect(submitToEmailWorker.drain).toBeCalledWith(5);
  });

  it('forwards errors to next', async () => {
    const err = new Error('boom');
    submitToEmailWorker.drain.mockRejectedValue(err);
    const { res, next } = getMockRes();

    await controller.processSubmissionPackages({ body: {} }, res, next);

    expect(next).toBeCalledWith(err);
  });
});
