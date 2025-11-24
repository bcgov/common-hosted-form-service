/**
 * HTTP Status Codes
 * Standard HTTP status code constants
 * Import: const { HTTP_STATUS } = require('./httpStatus');
 * Usage: HTTP_STATUS.OK (200), HTTP_STATUS.UNAUTHORIZED (401), HTTP_STATUS.FORBIDDEN (403)
 */

// Export the standard HTTP status constants
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
});

module.exports = { HTTP_STATUS };
