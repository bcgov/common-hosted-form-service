const webcomponentSettingsService = require('../../../../../src/forms/form/webcomponentSettings/service');
const requireAllowedOrigin = require('../../../../../src/webcomponents/common/middleware/requireAllowedOrigin');

const formId = '11111111-1111-4111-8111-111111111111';

const makeReq = (origin) => ({
  params: { formId },
  get: (name) => (name.toLowerCase() === 'origin' ? origin : undefined),
});
const makeRes = () => ({ vary: jest.fn() });

describe('webcomponents/common/middleware/requireAllowedOrigin', () => {
  beforeEach(() => {
    jest.spyOn(webcomponentSettingsService, 'readAllowedOrigins').mockResolvedValue(['https://www.example.com']);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows an allowed origin of the form in the path', async () => {
    const res = makeRes();
    const next = jest.fn();

    await requireAllowedOrigin(makeReq('https://www.example.com'), res, next);

    expect(next).toHaveBeenCalledWith();
    expect(webcomponentSettingsService.readAllowedOrigins).toHaveBeenCalledWith(formId);
    expect(res.vary).toHaveBeenCalledWith('Origin');
  });

  it.each([
    ['an origin that is not allowed', 'https://evil.example.org'],
    ['no origin', undefined],
    ['an invalid origin', 'not a url'],
  ])('rejects %s with 403', async (_name, origin) => {
    const res = makeRes();
    const next = jest.fn();

    await requireAllowedOrigin(makeReq(origin), res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
    expect(res.vary).toHaveBeenCalledWith('Origin');
  });

  it('rejects every origin when the form has none', async () => {
    webcomponentSettingsService.readAllowedOrigins.mockResolvedValueOnce([]);
    const next = jest.fn();

    await requireAllowedOrigin(makeReq('https://www.example.com'), makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it('passes on errors from reading the settings', async () => {
    const error = new Error('db down');
    webcomponentSettingsService.readAllowedOrigins.mockRejectedValueOnce(error);
    const next = jest.fn();

    await requireAllowedOrigin(makeReq('https://www.example.com'), makeRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
