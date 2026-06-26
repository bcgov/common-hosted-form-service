const { getMockReq, getMockRes } = require('@jest-mock/express');
const uuid = require('uuid');

const checkDedupKey = require('../../../../../src/forms/auth/middleware/checkDedupKey');
const { FormSubmission } = require('../../../../../src/forms/common/models');

const validKey = uuid.v4();
const username = 'someone@idir';

function mockFindOne(returnValue) {
  return jest.spyOn(FormSubmission, 'query').mockReturnValue({
    findOne: jest.fn().mockResolvedValue(returnValue),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('checkDedupKey', () => {
  it('passes through when the header is absent (req.dedupKey not set)', async () => {
    const req = getMockReq({ headers: {} });
    const { res, next } = getMockRes();
    const spy = mockFindOne(undefined);

    await checkDedupKey(req, res, next);

    expect(req.dedupKey).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a non-UUID header with 400', async () => {
    const req = getMockReq({ headers: { 'dedup-key': 'not-a-uuid' } });
    const { res, next } = getMockRes();
    const spy = mockFindOne(undefined);

    await checkDedupKey(req, res, next);

    expect(spy).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });

  it('sets req.dedupKey and continues when no prior submission exists', async () => {
    const req = getMockReq({ headers: { 'dedup-key': validKey } });
    const { res, next } = getMockRes();
    mockFindOne(undefined);

    await checkDedupKey(req, res, next);

    expect(req.dedupKey).toBe(validKey);
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns the cached 201 when the same submitter replays', async () => {
    const existing = { id: uuid.v4(), createdBy: username, dedupKey: validKey };
    const req = getMockReq({
      headers: { 'dedup-key': validKey },
      currentUser: { usernameIdp: username },
    });
    const { res, next } = getMockRes();
    mockFindOne(existing);

    await checkDedupKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(existing);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 409 when a different user replays the same key', async () => {
    const existing = { id: uuid.v4(), createdBy: 'original@idir', dedupKey: validKey };
    const req = getMockReq({
      headers: { 'dedup-key': validKey },
      currentUser: { usernameIdp: 'someone-else@idir' },
    });
    const { res, next } = getMockRes();
    mockFindOne(existing);

    await checkDedupKey(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 409 }));
  });

  it('returns the cached 201 for a public-form replay (no createdBy mismatch)', async () => {
    const existing = { id: uuid.v4(), createdBy: 'public', dedupKey: validKey };
    const req = getMockReq({
      headers: { 'dedup-key': validKey },
      currentUser: { public: true },
    });
    const { res, next } = getMockRes();
    mockFindOne(existing);

    await checkDedupKey(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(existing);
    expect(next).not.toHaveBeenCalled();
  });
});
