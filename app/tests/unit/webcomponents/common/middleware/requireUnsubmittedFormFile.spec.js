const fileService = require('../../../../../src/forms/file/service');
const requireUnsubmittedFormFile = require('../../../../../src/webcomponents/common/middleware/requireUnsubmittedFormFile');

const formId = '11111111-1111-4111-8111-111111111111';
const fileId = '22222222-2222-4222-8222-222222222222';

const makeReq = () => ({ params: { formId, fileId }, securityContext: { resource: { form: { id: formId } } } });

describe('webcomponents/common/middleware/requireUnsubmittedFormFile', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows an unsubmitted upload for the form in the path and keeps its record', async () => {
    const file = { id: fileId, formId, formSubmissionId: null };
    jest.spyOn(fileService, 'findByIds').mockResolvedValue([file]);
    const req = makeReq();
    const next = jest.fn();

    await requireUnsubmittedFormFile(req, {}, next);

    expect(fileService.findByIds).toHaveBeenCalledWith([fileId]);
    expect(next).toHaveBeenCalledWith();
    expect(req.currentFileRecord).toBe(file);
  });

  it.each([
    ['no file', []],
    ['a file that records no form', [{ id: fileId, formId: null, formSubmissionId: null }]],
    ['a file uploaded for another form', [{ id: fileId, formId: '33333333-3333-4333-8333-333333333333', formSubmissionId: null }]],
    ['a file that is part of a submission', [{ id: fileId, formId, formSubmissionId: '44444444-4444-4444-8444-444444444444' }]],
  ])('reports %s as not found', async (_name, found) => {
    jest.spyOn(fileService, 'findByIds').mockResolvedValue(found);
    const req = makeReq();
    const next = jest.fn();

    await requireUnsubmittedFormFile(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 404, detail: 'File not found.' }));
    expect(req.currentFileRecord).toBeUndefined();
  });

  it('passes on a lookup error', async () => {
    const error = new Error('db down');
    jest.spyOn(fileService, 'findByIds').mockRejectedValue(error);
    const next = jest.fn();

    await requireUnsubmittedFormFile(makeReq(), {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
