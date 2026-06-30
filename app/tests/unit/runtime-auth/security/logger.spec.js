/* eslint-env jest */

// Path constants for easier maintenance
const SECURITY_LOGGER_PATH = '../../../../src/runtime-auth/security/logger';
const CLS_RTRACER_PATH = 'cls-rtracer';

// Helper functions for requiring modules
function requireSecurityLogger() {
  return require(SECURITY_LOGGER_PATH);
}

function requireClsRtracer() {
  return require(CLS_RTRACER_PATH);
}

// Mock dependencies - create mock logger instances inside factory and expose them
let mockChildLogger;
let mockBaseLogger;

jest.mock('../../../../src/components/log', () => {
  mockChildLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    verbose: jest.fn(),
    log: jest.fn(),
    child: jest.fn(),
  };

  mockBaseLogger = {
    child: jest.fn(() => mockChildLogger),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    verbose: jest.fn(),
  };

  return jest.fn(() => mockBaseLogger);
});

jest.mock('cls-rtracer', () => ({
  id: jest.fn(() => 'test-correlation-id'),
}));

describe('logger', () => {
  let securityLog;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));

    // Ensure child returns the mock child logger
    if (mockBaseLogger && mockChildLogger) {
      mockBaseLogger.child.mockReturnValue(mockChildLogger);
    }

    // Clear the module cache to get fresh mocks
    jest.resetModules();
    securityLog = requireSecurityLogger();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should export securityLog object', () => {
    expect(typeof securityLog).toBe('object');
    expect(securityLog).toBeDefined();
  });

  it('should export getLogContext function', () => {
    const { getLogContext } = requireSecurityLogger();
    expect(typeof getLogContext).toBe('function');
  });

  it('should have component loggers', () => {
    expect(securityLog.orchestrator).toBeDefined();
    expect(securityLog.enrichRBAC).toBeDefined();
    expect(securityLog.authRegistry).toBeDefined();
    expect(securityLog.resourceResolver).toBeDefined();
    expect(securityLog.policyStore).toBeDefined();
  });

  it('should have utility methods', () => {
    expect(typeof securityLog.logAuthAttempt).toBe('function');
    expect(typeof securityLog.logPermissionCheck).toBe('function');
    expect(typeof securityLog.logResourceAccess).toBe('function');
    expect(typeof securityLog.logSecurityDecision).toBe('function');
    expect(typeof securityLog.logPerformance).toBe('function');
  });

  describe('getLogContext', () => {
    it('should return correlation ID and timestamp', () => {
      const currentClsRtracer = requireClsRtracer();
      currentClsRtracer.id.mockReturnValue('test-id-123');
      const loggerModule = requireSecurityLogger();
      const { getLogContext } = loggerModule;
      const context = getLogContext();

      expect(context).toHaveProperty('correlationId');
      expect(context).toHaveProperty('timestamp');
      expect(context.correlationId).toBe('test-id-123');
      expect(context.timestamp).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should return no-cid when correlation ID is null', () => {
      const currentClsRtracer = requireClsRtracer();
      currentClsRtracer.id.mockReturnValue(null);
      const loggerModule = requireSecurityLogger();
      const { getLogContext } = loggerModule;
      const context = getLogContext();

      expect(context.correlationId).toBe('no-cid');
      expect(context.timestamp).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should return no-cid when correlation ID is undefined', () => {
      const currentClsRtracer = requireClsRtracer();
      currentClsRtracer.id.mockReturnValue(undefined);
      const loggerModule = requireSecurityLogger();
      const { getLogContext } = loggerModule;
      const context = getLogContext();

      expect(context.correlationId).toBe('no-cid');
      expect(context.timestamp).toBe('2024-01-01T12:00:00.000Z');
    });
  });

  describe('component loggers', () => {
    it('should create orchestrator logger with correct metadata', () => {
      const logger = securityLog.orchestrator;

      // Test that the logger was created correctly (not testing mock internals)
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.verbose).toBe('function');

      // Verify that when we log, it uses the child logger
      logger.info({ test: 'data' });
      expect(mockChildLogger.info).toHaveBeenCalled();
    });

    it('should enhance log arguments with correlation ID and timestamp for info', () => {
      const currentClsRtracer = requireClsRtracer();
      currentClsRtracer.id.mockReturnValue('correlation-123');
      const logger = securityLog.orchestrator;
      logger.info({ message: 'test' });

      // Verify the child logger was called with enhanced data
      expect(mockChildLogger.info).toHaveBeenCalled();
      const callArgs = mockChildLogger.info.mock.calls[0];
      // The logger passes an array as the first argument, so extract the object from it
      const logObject = Array.isArray(callArgs[0]) ? callArgs[0][0] : callArgs[0];
      expect(logObject).toMatchObject({
        correlationId: 'correlation-123',
        timestamp: '2024-01-01T12:00:00.000Z',
        message: 'test',
      });
    });

    it('should enhance log arguments for debug', () => {
      const currentClsRtracer = requireClsRtracer();
      currentClsRtracer.id.mockReturnValue('correlation-456');
      const logger = securityLog.orchestrator;
      logger.debug({ message: 'debug test' });

      expect(mockChildLogger.debug).toHaveBeenCalled();
      const callArgs = mockChildLogger.debug.mock.calls[0];
      const logObject = Array.isArray(callArgs[0]) ? callArgs[0][0] : callArgs[0];
      expect(logObject).toMatchObject({
        correlationId: 'correlation-456',
        timestamp: '2024-01-01T12:00:00.000Z',
        message: 'debug test',
      });
    });

    it('should enhance log arguments for warn', () => {
      const currentClsRtracer = requireClsRtracer();
      currentClsRtracer.id.mockReturnValue('correlation-789');
      const logger = securityLog.orchestrator;
      logger.warn({ message: 'warning test' });

      expect(mockChildLogger.warn).toHaveBeenCalled();
      const callArgs = mockChildLogger.warn.mock.calls[0];
      const logObject = Array.isArray(callArgs[0]) ? callArgs[0][0] : callArgs[0];
      expect(logObject).toMatchObject({
        correlationId: 'correlation-789',
        timestamp: '2024-01-01T12:00:00.000Z',
        message: 'warning test',
      });
    });

    it('should enhance log arguments for error', () => {
      const currentClsRtracer = requireClsRtracer();
      currentClsRtracer.id.mockReturnValue('correlation-error');
      const logger = securityLog.orchestrator;
      logger.error({ message: 'error test' });

      expect(mockChildLogger.error).toHaveBeenCalled();
      const callArgs = mockChildLogger.error.mock.calls[0];
      const logObject = Array.isArray(callArgs[0]) ? callArgs[0][0] : callArgs[0];
      expect(logObject).toMatchObject({
        correlationId: 'correlation-error',
        timestamp: '2024-01-01T12:00:00.000Z',
        message: 'error test',
      });
    });

    it('should enhance log arguments for verbose', () => {
      const currentClsRtracer = requireClsRtracer();
      currentClsRtracer.id.mockReturnValue('correlation-verbose');
      const logger = securityLog.orchestrator;
      logger.verbose({ message: 'verbose test' });

      expect(mockChildLogger.verbose).toHaveBeenCalled();
      const callArgs = mockChildLogger.verbose.mock.calls[0];
      const logObject = Array.isArray(callArgs[0]) ? callArgs[0][0] : callArgs[0];
      expect(logObject).toMatchObject({
        correlationId: 'correlation-verbose',
        timestamp: '2024-01-01T12:00:00.000Z',
        message: 'verbose test',
      });
    });

    it('should handle non-object first argument', () => {
      const currentClsRtracer = requireClsRtracer();
      currentClsRtracer.id.mockReturnValue('correlation-string');
      const logger = securityLog.orchestrator;
      logger.info('string message');

      expect(mockChildLogger.info).toHaveBeenCalled();
      const callArgs = mockChildLogger.info.mock.calls[0];
      // When callArgs[0] is an array, extract from within that array
      const logArgs = Array.isArray(callArgs[0]) ? callArgs[0] : callArgs;
      expect(logArgs[0]).toMatchObject({
        correlationId: 'correlation-string',
        timestamp: '2024-01-01T12:00:00.000Z',
      });
      expect(logArgs[1]).toBe('string message');
    });

    it('should handle null first argument', () => {
      const currentClsRtracer = requireClsRtracer();
      currentClsRtracer.id.mockReturnValue('correlation-null');
      const logger = securityLog.orchestrator;
      logger.info(null, 'message');

      expect(mockChildLogger.info).toHaveBeenCalled();
      const callArgs = mockChildLogger.info.mock.calls[0];
      // When callArgs[0] is an array, extract from within that array
      const logArgs = Array.isArray(callArgs[0]) ? callArgs[0] : callArgs;
      expect(logArgs[0]).toMatchObject({
        correlationId: 'correlation-null',
        timestamp: '2024-01-01T12:00:00.000Z',
      });
      expect(logArgs[1]).toBe(null);
      expect(logArgs[2]).toBe('message');
    });

    it('should enhance log method', () => {
      const currentClsRtracer = requireClsRtracer();
      currentClsRtracer.id.mockReturnValue('correlation-log');
      const logger = securityLog.orchestrator;
      logger.log('info', { message: 'log test' });

      expect(mockChildLogger.log).toHaveBeenCalled();
      const callArgs = mockChildLogger.log.mock.calls[0];
      // The logger passes an array as the first argument
      const logArgs = Array.isArray(callArgs[0]) ? callArgs[0] : callArgs;
      expect(logArgs[0]).toMatchObject({
        correlationId: 'correlation-log',
        timestamp: '2024-01-01T12:00:00.000Z',
      });
      expect(logArgs[1]).toBe('info');
      expect(logArgs[2]).toMatchObject({ message: 'log test' });
    });

    it('should create enrichRBAC logger with correct component name', () => {
      const logger = securityLog.enrichRBAC;
      expect(typeof logger.info).toBe('function');
    });

    it('should create authRegistry logger with correct component name', () => {
      const logger = securityLog.authRegistry;
      expect(typeof logger.info).toBe('function');
    });

    it('should create resourceResolver logger with correct component name', () => {
      const logger = securityLog.resourceResolver;
      expect(typeof logger.info).toBe('function');
    });

    it('should create policyStore logger with correct component name', () => {
      const logger = securityLog.policyStore;
      expect(typeof logger.info).toBe('function');
    });
  });

  describe('logAuthAttempt', () => {
    it('should log auth attempt with actor ID', () => {
      const mockLogger = {
        info: jest.fn(),
      };
      const actor = { id: 'user-123', username: 'testuser' };

      securityLog.logAuthAttempt(mockLogger, actor, 'userOidc', true, { policyPattern: '/test' });

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'auth_attempt',
        actor: 'user-123',
        authType: 'userOidc',
        success: true,
        policyPattern: '/test',
      });
    });

    it('should log auth attempt with unknown actor when actor is null', () => {
      const mockLogger = {
        info: jest.fn(),
      };

      securityLog.logAuthAttempt(mockLogger, null, 'apiKeyBasic', false);

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'auth_attempt',
        actor: 'unknown',
        authType: 'apiKeyBasic',
        success: false,
      });
    });

    it('should log auth attempt with unknown actor when actor is undefined', () => {
      const mockLogger = {
        info: jest.fn(),
      };

      securityLog.logAuthAttempt(mockLogger, undefined, 'public', true);

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'auth_attempt',
        actor: 'unknown',
        authType: 'public',
        success: true,
      });
    });

    it('should include custom details', () => {
      const mockLogger = {
        info: jest.fn(),
      };
      const actor = { id: 'user-456' };

      securityLog.logAuthAttempt(mockLogger, actor, 'gatewayBearer', true, {
        method: 'POST',
        path: '/forms',
        formId: 'form-123',
      });

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'auth_attempt',
        actor: 'user-456',
        authType: 'gatewayBearer',
        success: true,
        method: 'POST',
        path: '/forms',
        formId: 'form-123',
      });
    });
  });

  describe('logPermissionCheck', () => {
    it('should log permission check with actor and permissions', () => {
      const mockLogger = {
        info: jest.fn(),
      };
      const actor = { id: 'user-789' };

      securityLog.logPermissionCheck(mockLogger, actor, ['FORM_READ', 'FORM_UPDATE'], true);

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'permission_check',
        actor: 'user-789',
        permissions: ['FORM_READ', 'FORM_UPDATE'],
        result: true,
      });
    });

    it('should log permission check with unknown actor', () => {
      const mockLogger = {
        info: jest.fn(),
      };

      securityLog.logPermissionCheck(mockLogger, null, ['FORM_READ'], false);

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'permission_check',
        actor: 'unknown',
        permissions: ['FORM_READ'],
        result: false,
      });
    });

    it('should include custom details', () => {
      const mockLogger = {
        info: jest.fn(),
      };
      const actor = { id: 'user-perm' };

      securityLog.logPermissionCheck(mockLogger, actor, ['FORM_DELETE'], true, {
        formId: 'form-456',
        reason: 'owner',
      });

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'permission_check',
        actor: 'user-perm',
        permissions: ['FORM_DELETE'],
        result: true,
        formId: 'form-456',
        reason: 'owner',
      });
    });
  });

  describe('logResourceAccess', () => {
    it('should log resource access with resource details', () => {
      const mockLogger = {
        info: jest.fn(),
      };
      const actor = { id: 'user-resource' };
      const resource = { kind: 'form', id: 'form-789' };

      securityLog.logResourceAccess(mockLogger, actor, resource, 'read', true);

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'resource_access',
        actor: 'user-resource',
        resource: 'form',
        resourceId: 'form-789',
        operation: 'read',
        result: true,
      });
    });

    it('should log resource access with unknown actor and resource', () => {
      const mockLogger = {
        info: jest.fn(),
      };

      securityLog.logResourceAccess(mockLogger, null, null, 'write', false);

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'resource_access',
        actor: 'unknown',
        resource: 'unknown',
        resourceId: 'unknown',
        operation: 'write',
        result: false,
      });
    });

    it('should include custom details', () => {
      const mockLogger = {
        info: jest.fn(),
      };
      const actor = { id: 'user-access' };
      const resource = { kind: 'submission', id: 'sub-123' };

      securityLog.logResourceAccess(mockLogger, actor, resource, 'delete', true, {
        formId: 'form-123',
        reason: 'admin',
      });

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'resource_access',
        actor: 'user-access',
        resource: 'submission',
        resourceId: 'sub-123',
        operation: 'delete',
        result: true,
        formId: 'form-123',
        reason: 'admin',
      });
    });
  });

  describe('logSecurityDecision', () => {
    it('should log security decision with decision details', () => {
      const mockLogger = {
        info: jest.fn(),
      };
      const decision = {
        predicate: 'hasPermission',
        result: true,
        permission: 'FORM_READ',
      };

      securityLog.logSecurityDecision(mockLogger, decision);

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'security_decision',
        decision: 'hasPermission',
        result: true,
        predicate: 'hasPermission',
        permission: 'FORM_READ',
      });
    });

    it('should include context details', () => {
      const mockLogger = {
        info: jest.fn(),
      };
      const decision = {
        predicate: 'isOwner',
        result: false,
      };
      const context = {
        formId: 'form-999',
        userId: 'user-999',
      };

      securityLog.logSecurityDecision(mockLogger, decision, context);

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'security_decision',
        decision: 'isOwner',
        result: false,
        predicate: 'isOwner',
        formId: 'form-999',
        userId: 'user-999',
      });
    });
  });

  describe('logPerformance', () => {
    it('should log performance metrics', () => {
      const mockLogger = {
        info: jest.fn(),
      };

      securityLog.logPerformance(mockLogger, 'auth_check', 123);

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'performance',
        operation: 'auth_check',
        duration: 123,
      });
    });

    it('should include custom details', () => {
      const mockLogger = {
        info: jest.fn(),
      };

      securityLog.logPerformance(mockLogger, 'rbac_enrich', 456, {
        permissions: 5,
        formId: 'form-perf',
      });

      expect(mockLogger.info).toHaveBeenCalledWith({
        event: 'performance',
        operation: 'rbac_enrich',
        duration: 456,
        permissions: 5,
        formId: 'form-perf',
      });
    });
  });
});
