const { NotFoundError } = require('objection');
const request = require('supertest');
const uuid = require('uuid');

const { expressHelper } = require('../../../common/helper');

//
// Form API keys on the submission routes, through the real router and
// middleware chain: currentUser, apiAccess and hasSubmissionPermissions run
// for real. Only I/O edges are stubbed: the identity provider list, the user
// lookup, the form API key lookup, and the submission read and delete.
//
const authService = require('../../../../src/forms/auth/service');
const formService = require('../../../../src/forms/form/service');
const submissionService = require('../../../../src/forms/submission/service');
const idpService = require('../../../../src/components/idpService');

const router = require('../../../../src/forms/submission/routes');

const basePath = '/submissions';
const appRequest = request(expressHelper(basePath, router));

const API_KEY_DENIED = 'Invalid authorization credentials.';

const forms = { mine: uuid.v4(), theirs: uuid.v4() };
const submissions = {
  mine: { id: uuid.v4(), formId: forms.mine },
  theirs: { id: uuid.v4(), formId: forms.theirs },
};

const secret = uuid.v4();
const basicAuthFor = (formId) => `Basic ${Buffer.from([formId, secret].join(':')).toString('base64')}`;

beforeEach(() => {
  jest.spyOn(idpService, 'getIdentityProviders').mockResolvedValue([{ code: 'public', idp: 'public', active: true, login: false, tokenmap: null, extra: {} }]);
  jest.spyOn(authService, 'getUserId').mockImplementation(async (userInfo) => ({ id: 'public', ...userInfo }));
  // Only "mine" has an API key.
  jest.spyOn(formService, 'readApiKey').mockImplementation(async (formId) => (formId === forms.mine ? { secret, filesApiAccess: true } : undefined));
  jest.spyOn(submissionService, 'read').mockImplementation(async (id) => {
    const s = Object.values(submissions).find((x) => x.id === id);
    if (!s) throw new NotFoundError({});
    return { submission: { id: s.id, submission: { data: { secret: s.id } } }, form: { id: s.formId } };
  });
  jest.spyOn(submissionService, 'delete').mockResolvedValue({ deleted: true });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /submissions/:formSubmissionId with a form API key', () => {
  it('returns a submission of the key form', async () => {
    const response = await appRequest.get(`${basePath}/${submissions.mine.id}`).set('Authorization', basicAuthFor(forms.mine));

    expect(response.status).toBe(200);
    expect(response.body.submission.id).toBe(submissions.mine.id);
  });

  it('401s a submission of another form', async () => {
    const response = await appRequest.get(`${basePath}/${submissions.theirs.id}`).set('Authorization', basicAuthFor(forms.mine));

    expect(response.status).toBe(401);
    expect(response.body.submission).toBeUndefined();
  });

  it('401s a submission of another form when the formId query names the key form', async () => {
    const response = await appRequest.get(`${basePath}/${submissions.theirs.id}`).query({ formId: forms.mine }).set('Authorization', basicAuthFor(forms.mine));

    expect(response.status).toBe(401);
    expect(response.body.detail).toBe(API_KEY_DENIED);
    expect(response.body.submission).toBeUndefined();
    expect(formService.readApiKey).not.toBeCalled();
  });

  it('returns a submission of the key form when the formId query names the same form', async () => {
    const response = await appRequest.get(`${basePath}/${submissions.mine.id}`).query({ formId: forms.mine }).set('Authorization', basicAuthFor(forms.mine));

    expect(response.status).toBe(200);
  });
});

describe('DELETE /submissions/:formSubmissionId with a form API key', () => {
  it('401s a submission of another form when the formId query names the key form', async () => {
    const response = await appRequest.delete(`${basePath}/${submissions.theirs.id}`).query({ formId: forms.mine }).set('Authorization', basicAuthFor(forms.mine));

    expect(response.status).toBe(401);
    expect(submissionService.delete).not.toBeCalled();
  });

  it('deletes a submission of the key form', async () => {
    const response = await appRequest.delete(`${basePath}/${submissions.mine.id}`).set('Authorization', basicAuthFor(forms.mine));

    expect(response.status).toBe(200);
    expect(submissionService.delete).toBeCalledWith(submissions.mine.id, expect.anything());
  });
});
