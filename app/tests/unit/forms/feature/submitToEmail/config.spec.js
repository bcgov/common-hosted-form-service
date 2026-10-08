jest.mock('config', () => ({ get: jest.fn(), has: jest.fn() }));

const config = require('config');
const service = require('../../../../../src/forms/feature/submitToEmail/config');

afterEach(() => {
  jest.clearAllMocks();
});

describe('getConfig', () => {
  it('returns all defaults when nothing is configured', () => {
    config.has.mockReturnValue(false);
    expect(service.getConfig()).toEqual({
      batchSize: 25,
      delivery: 'attachment',
      reportSizeLimit: 5000000,
      attachmentsSizeLimit: 10000000,
      attachmentsCountLimit: 10,
      stuckTimeoutMinutes: 30,
      maxAttempts: 3,
    });
    expect(config.get).not.toHaveBeenCalled();
  });

  it('reads each features.submitToEmail.* path', () => {
    config.has.mockReturnValue(true);
    config.get.mockReturnValue(50);
    service.getConfig();
    expect(config.get).toHaveBeenCalledWith('features.submitToEmail.batchSize');
    expect(config.get).toHaveBeenCalledWith('features.submitToEmail.reportSizeLimit');
    expect(config.get).toHaveBeenCalledWith('features.submitToEmail.attachmentsSizeLimit');
    expect(config.get).toHaveBeenCalledWith('features.submitToEmail.attachmentsCountLimit');
  });

  it('coerces a string env value to a number', () => {
    config.has.mockReturnValue(true);
    config.get.mockReturnValue('50');
    expect(service.getConfig().batchSize).toBe(50);
  });

  it.each([
    ['link', 'link'],
    ['attachment', 'attachment'],
    ['LINK', 'link'],
    ['bogus', 'attachment'],
  ])('resolves delivery %p to %p (default attachment)', (value, expected) => {
    config.has.mockReturnValue(true);
    config.get.mockReturnValue(value);
    expect(service.getConfig().delivery).toBe(expected);
  });

  it.each([
    ['0', 25],
    ['-5', 25],
    ['abc', 25],
    [10.5, 25],
    ['', 25],
  ])('falls back to the default for invalid value %p', (value, expected) => {
    config.has.mockReturnValue(true);
    config.get.mockReturnValue(value);
    expect(service.getConfig().batchSize).toBe(expected);
  });
});
