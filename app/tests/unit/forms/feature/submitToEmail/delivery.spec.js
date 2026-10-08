jest.mock('../../../../../src/forms/feature/submitToEmail/config', () => ({ getConfig: jest.fn() }));

const config = require('../../../../../src/forms/feature/submitToEmail/config');
const delivery = require('../../../../../src/forms/feature/submitToEmail/delivery');

const report = (bytes) => ({ buffer: Buffer.alloc(bytes) });
const files = (sizes) => sizes.map((n) => ({ buffer: Buffer.alloc(n) }));

beforeEach(() => {
  jest.clearAllMocks();
  config.getConfig.mockReturnValue({
    delivery: 'attachment',
    batchSize: 25,
    reportSizeLimit: 1000,
    attachmentsSizeLimit: 2000,
    attachmentsCountLimit: 3,
  });
});

describe('decide', () => {
  it('chooses attachment when report, total size, and count are all within limits', () => {
    const { strategy } = delivery.decide({ report: report(500), files: files([400, 400]) });
    expect(strategy).toBe(delivery.attachmentStrategy);
  });

  it('always chooses link when delivery is configured to "link", even within limits', () => {
    config.getConfig.mockReturnValue({ delivery: 'link', reportSizeLimit: 1000, attachmentsSizeLimit: 2000, attachmentsCountLimit: 3 });
    const { strategy, reason } = delivery.decide({ report: report(10), files: files([10]) });
    expect(strategy).toBe(delivery.linkStrategy);
    expect(reason).toMatch(/delivery=link/);
  });

  it('falls back to link when the report is too large', () => {
    const { strategy, reason } = delivery.decide({ report: report(1500), files: files([100]) });
    expect(strategy).toBe(delivery.linkStrategy);
    expect(reason).toMatch(/report/);
  });

  it('falls back to link when the total attachment size is too large', () => {
    const { strategy, reason } = delivery.decide({ report: report(100), files: files([1500, 1000]) });
    expect(strategy).toBe(delivery.linkStrategy);
    expect(reason).toMatch(/attachments/);
  });

  it('falls back to link when there are too many attachments', () => {
    const { strategy, reason } = delivery.decide({ report: report(100), files: files([1, 1, 1, 1]) });
    expect(strategy).toBe(delivery.linkStrategy);
    expect(reason).toMatch(/exceed limit 3/);
  });

  it('chooses attachment with no files (only the report) when within the report limit', () => {
    const { strategy } = delivery.decide({ report: report(100), files: [] });
    expect(strategy).toBe(delivery.attachmentStrategy);
  });
});
