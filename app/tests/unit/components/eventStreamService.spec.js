const { MockModel } = require('../../common/dbHelper');

// change these as appropriate after adding new default keys/algos...
const FORM_EVENT_TYPES_COUNT = 2;
const SUBMISSION_EVENT_TYPES_COUNT = 3;

beforeEach(() => {
  MockModel.mockReset();
  jest.resetModules();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('eventStreamService', () => {
  let service;
  beforeEach(() => {
    MockModel.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a implemented service when feature flag is true', () => {
    const { featureFlags } = require('../../../src/components/featureFlags');
    featureFlags.enabled = jest.fn().mockReturnValueOnce(true);
    const { eventStreamService, FORM_EVENT_TYPES, SUBMISSION_EVENT_TYPES } = require('../../../src/components/eventStreamService');
    expect(eventStreamService).toBeTruthy();
    expect(eventStreamService.servers).toBeTruthy();
    expect(Object.entries(FORM_EVENT_TYPES)).toHaveLength(FORM_EVENT_TYPES_COUNT);
    expect(Object.entries(SUBMISSION_EVENT_TYPES)).toHaveLength(SUBMISSION_EVENT_TYPES_COUNT);
    service = eventStreamService;
  });

  it('should publish', async () => {
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service.js = jest.fn().mockReturnThis();
    service.js.publish = jest.fn().mockResolvedValueOnce({ seq: 1 });
    await service.onPublish('123', '456', true);
  });
});

describe('DummyEventStreamService', () => {
  beforeEach(() => {
    MockModel.mockReset();
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a dummy service when feature flag is false', () => {
    const { featureFlags } = require('../../../src/components/featureFlags');
    featureFlags.enabled = jest.fn().mockReturnValueOnce(false);
    const { eventStreamService } = require('../../../src/components/eventStreamService');
    expect(eventStreamService).toBeTruthy();
    expect(eventStreamService.servers).toBeFalsy();
  });
});
