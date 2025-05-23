describe('StatusService', () => {
  let statusService;
  let mockInstance;

  beforeEach(() => {
    // Clear singleton state for each test
    jest.resetModules();
    const StatusServiceClass = require('../../../src/components/statusService');
    statusService = new StatusServiceClass.constructor();
    statusService.connections = {};
    statusService.checkIntervals = {};
    statusService.stopped = false;
    statusService.ready = false;

    // Mock instance with startup and check functions
    mockInstance = {
      startup: jest.fn().mockResolvedValue(true),
      check: jest.fn().mockResolvedValue(true),
    };
  });

  afterEach(() => {
    statusService.stopAll();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('registers a connection and initializes it', async () => {
    statusService.registerConnection('mock', mockInstance, 'startup', 'check', 100);
    await statusService.initializeAllConnections();

    expect(mockInstance.startup).toHaveBeenCalled();
    expect(statusService.connections.mock.started).toBe(true);
    expect(statusService.connections.mock.connected).toBe(true);
  });

  it('throws if instance or function names are invalid', () => {
    // Missing instance
    expect(() => statusService.registerConnection('bad1', null, 'startup', 'check')).toThrow(/Invalid instance or function names/);

    // Missing startup function
    expect(() => statusService.registerConnection('bad2', {}, 'startup', 'check')).toThrow(/Invalid instance or function names/);

    // Startup or check is not a function
    const badInstance = { startup: true, check: () => true };
    expect(() => statusService.registerConnection('bad3', badInstance, 'startup', 'check')).toThrow(/Invalid function types/);

    // Invalid interval
    const goodInstance = { startup: () => Promise.resolve(), check: () => Promise.resolve() };
    expect(() => statusService.registerConnection('bad4', goodInstance, 'startup', 'check', -1)).toThrow(/Invalid interval/);
  });

  it('handles errors in initializeAllConnections when startupFn throws', async () => {
    const badStartupInstance = {
      startup: jest.fn().mockRejectedValue(new Error('Startup failed')),
      check: jest.fn().mockResolvedValue(true),
    };
    statusService.registerConnection('badStartup', badStartupInstance, 'startup', 'check', 100);

    await statusService.initializeAllConnections();

    expect(badStartupInstance.startup).toHaveBeenCalled();
    expect(statusService.connections.badStartup.started).toBe(false);
    expect(statusService.connections.badStartup.connected).toBe(false);
  });

  it('periodically checks connection status', async () => {
    jest.useFakeTimers();
    mockInstance.check = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    statusService.registerConnection('mock', mockInstance, 'startup', 'check', 50);
    await statusService.initializeAllConnections();

    // Initial check
    expect(statusService.connections.mock.connected).toBe(true);

    // Advance timer to trigger next check
    await jest.advanceTimersByTimeAsync(60);
    // Wait for async check to complete
    await Promise.resolve();

    expect(statusService.connections.mock.connected).toBe(false);
  });

  it('handles errors in _startChecking when checkFn throws', async () => {
    jest.useFakeTimers();
    const errorInstance = {
      startup: jest.fn().mockResolvedValue(true),
      check: jest
        .fn()
        .mockResolvedValueOnce(true) // Initial check succeeds
        .mockImplementationOnce(() => {
          throw new Error('Check failed');
        }), // Next check throws
    };

    statusService.registerConnection('errorConn', errorInstance, 'startup', 'check', 50);
    await statusService.initializeAllConnections();

    // Initial check
    expect(statusService.connections.errorConn.connected).toBe(true);

    // Advance timer to trigger next check (which throws)
    await jest.advanceTimersByTimeAsync(60);
    // Wait for async check to complete
    await Promise.resolve();

    expect(statusService.connections.errorConn.connected).toBe(false);
  });

  it('getStatus returns correct structure', async () => {
    statusService.registerConnection('mock', mockInstance, 'startup', 'check', 100);
    await statusService.initializeAllConnections();
    const status = statusService.getStatus();

    expect(status).toHaveProperty('ready');
    expect(status).toHaveProperty('stopped');
    expect(status).toHaveProperty('connections');
    expect(status.connections).toHaveProperty('mock');
    expect(typeof status.connections.mock.connected).toBe('boolean');
    expect(typeof status.connections.mock.started).toBe('boolean');
  });

  it('stopAll sets stopped and ready to false', () => {
    statusService.stopAll();
    expect(statusService.stopped).toBe(true);
    expect(statusService.ready).toBe(false);
  });

  it('throws if registering after stopAll', () => {
    statusService.stopAll();
    expect(() => statusService.registerConnection('mock', mockInstance, 'startup', 'check')).toThrow(/after shutdown/);
  });
});
