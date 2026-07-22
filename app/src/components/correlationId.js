const clsRtracer = require('cls-rtracer');

/**
 * Correlation ID utilities
 * Provides easy access to the current request's correlation ID
 */

/**
 * Get the current correlation ID from the async context
 * @returns {string|undefined} The current correlation ID, or undefined if not in a request context
 */
function getId() {
  return clsRtracer.id();
}

/**
 * Check if a correlation ID exists in the current context
 * @returns {boolean} True if a correlation ID exists
 */
function exists() {
  return !!clsRtracer.id();
}

module.exports = {
  getId,
  exists,
};
