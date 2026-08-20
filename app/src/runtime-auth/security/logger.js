/**
 * Security-specific logger for runtime-auth
 * Leverages the main log.js component with security-specific metadata
 */

const getLogger = require('../../components/log');
const clsRtracer = require('cls-rtracer');

// Create security logger with component metadata
const securityLogger = getLogger(__filename);

/**
 * Gets correlation ID and timestamp for log entries
 * @returns {Object} { correlationId, timestamp }
 */
function getLogContext() {
  return {
    correlationId: clsRtracer.id() || 'no-cid',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a child logger for specific security components with correlation ID/timestamp injection
 * @param {string} component - Component name (e.g., 'orchestrator', 'enrichRBAC', 'authRegistry')
 * @returns {object} Wrapped Winston logger that automatically adds correlation ID and timestamp
 */
function createComponentLogger(component) {
  const childLogger = securityLogger.child({
    securityComponent: component,
    securityStack: 'runtime-auth',
  });

  // Wrap the logger methods to inject correlation ID and timestamp
  const wrappedLogger = {
    info: (...args) => childLogger.info(enhanceLogArgs(...args)),
    debug: (...args) => childLogger.debug(enhanceLogArgs(...args)),
    warn: (...args) => childLogger.warn(enhanceLogArgs(...args)),
    error: (...args) => childLogger.error(enhanceLogArgs(...args)),
    verbose: (...args) => childLogger.verbose(enhanceLogArgs(...args)),
    // Pass through other properties
    child: (...args) => childLogger.child(...args),
    log: (...args) => childLogger.log(enhanceLogArgs(...args)),
  };

  return wrappedLogger;
}

/**
 * Enhances log arguments by adding correlation ID and timestamp as first attributes
 * @param {...any} args - Original log arguments
 * @returns {Array} Modified log arguments
 */
function enhanceLogArgs(...args) {
  const logContext = getLogContext();

  // If first arg is an object, prepend correlation ID and timestamp
  if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
    return [{ correlationId: logContext.correlationId, timestamp: logContext.timestamp, ...args[0] }, ...args.slice(1)];
  }

  // Otherwise, add as new first arg
  return [{ correlationId: logContext.correlationId, timestamp: logContext.timestamp }, ...args];
}

/**
 * Security-specific logging utilities
 */
const securityLog = {
  // Component loggers
  orchestrator: createComponentLogger('orchestrator'),
  enrichRBAC: createComponentLogger('enrichRBAC'),
  authRegistry: createComponentLogger('authRegistry'),
  resourceResolver: createComponentLogger('resourceResolver'),
  policyStore: createComponentLogger('policyStore'),
  filePermissions: createComponentLogger('filePermissions'),
  requirePermissions: createComponentLogger('requirePermissions'),

  // Utility methods
  logAuthAttempt: (logger, actor, authType, success, details = {}) => {
    logger.info({
      event: 'auth_attempt',
      actor: actor?.id || 'unknown',
      authType,
      success,
      ...details,
    });
  },

  logPermissionCheck: (logger, actor, permissions, result, details = {}) => {
    logger.info({
      event: 'permission_check',
      actor: actor?.id || 'unknown',
      permissions,
      result,
      ...details,
    });
  },

  logResourceAccess: (logger, actor, resource, operation, result, details = {}) => {
    logger.info({
      event: 'resource_access',
      actor: actor?.id || 'unknown',
      resource: resource?.kind || 'unknown',
      resourceId: resource?.id || 'unknown',
      operation,
      result,
      ...details,
    });
  },

  logSecurityDecision: (logger, decision, context = {}) => {
    logger.info({
      event: 'security_decision',
      decision: decision.predicate,
      result: decision.result,
      ...decision,
      ...context,
    });
  },

  logPerformance: (logger, operation, duration, details = {}) => {
    logger.info({
      event: 'performance',
      operation,
      duration,
      ...details,
    });
  },
};

module.exports = securityLog;
module.exports.getLogContext = getLogContext;
