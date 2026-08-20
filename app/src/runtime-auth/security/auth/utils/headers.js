/**
 * HTTP Header Constants and Utilities
 * Shared header names and helper functions for authentication strategies
 */

/**
 * Gateway token header name used for webcomponent authentication
 * Allows host applications to use Authorization Bearer header for their own authentication
 */
const GATEWAY_TOKEN_HEADER = 'X-Chefs-Gateway-Token';

/**
 * Case-insensitive header lookup helper
 * HTTP headers are case-insensitive per RFC 7230, but Node.js/Express may preserve case
 * @param {Object} headers - Request headers object
 * @param {string} headerName - Header name to find (case-insensitive)
 * @returns {string|undefined} Header value or undefined if not found
 */
function getHeaderCaseInsensitive(headers, headerName) {
  if (!headers || !headerName) return undefined;
  const lowerName = headerName.toLowerCase();
  for (const key in headers) {
    if (key.toLowerCase() === lowerName) {
      return headers[key];
    }
  }
  return undefined;
}

module.exports = {
  GATEWAY_TOKEN_HEADER,
  getHeaderCaseInsensitive,
};
