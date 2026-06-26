const Problem = require('api-problem');

const log = require('./log')(module.filename);

// Cap stringified response data so a large payload can't bloat logs/Problem details.
const MAX_DATA_LENGTH = 2000;

/**
 * Try to convert response data to JSON, but failing that just return it as-is.
 *
 * @param {*} data the data to attempt to parse into JSON.
 * @returns an object if data is JSON, otherwise data itself
 */
const _parseResponseData = (data) => {
  let parsedData;

  try {
    parsedData = JSON.parse(data);
  } catch (error) {
    // Syntax Error: It's not valid JSON.
    parsedData = data;
  }

  return parsedData;
};

/**
 * Build a compact, log-safe view of an error. Axios errors carry `config`,
 * `request`, and `response` objects that can be enormous - e.g. binary file
 * contents in the request body (CDOGS templates) or response body - so logging
 * the raw error floods the logs. Keep only the useful scalars.
 *
 * @param {*} error the error to sanitize.
 * @returns {object} a small plain object safe to attach to a log entry.
 */
const _sanitizeError = (error) => {
  const safe = {};
  if (error.message) safe.message = error.message;
  if (error.code) safe.code = error.code;
  if (error.stack) safe.stack = error.stack;
  if (error.config) {
    // method/url only - never config.data (may be a binary request body).
    safe.method = error.config.method;
    safe.url = error.config.url;
  }
  if (error.response) {
    safe.status = error.response.status;
    safe.statusText = error.response.statusText;
  }
  return safe;
};

/**
 * Render response data as a short string without dumping binary or huge payloads.
 * Buffers/ArrayBuffers are summarized by size; everything else is stringified and
 * truncated.
 *
 * @param {*} data the (already parsed) response data.
 * @returns {string} a bounded, log-safe representation.
 */
const _summarizeData = (data) => {
  if (data === undefined || data === null) return '';
  if (Buffer.isBuffer(data)) return `<binary ${data.length} bytes>`;
  if (data instanceof ArrayBuffer) return `<binary ${data.byteLength} bytes>`;

  let str;
  if (typeof data === 'string') {
    str = data;
  } else {
    try {
      str = JSON.stringify(data);
    } catch (error) {
      str = String(data);
    }
  }

  return str.length > MAX_DATA_LENGTH ? `${str.substring(0, MAX_DATA_LENGTH)}… (truncated, ${str.length} chars)` : str;
};

module.exports = function (service, error) {
  if (error.response) {
    const data = _parseResponseData(error.response.data);
    const summary = _summarizeData(data);

    log.error(`Error from ${service}: status = ${error.response.status}, data: ${summary}`, _sanitizeError(error));

    // Validation Error
    if (error.response.status === 422) {
      throw new Problem(error.response.status, {
        detail: data.detail,
        errors: data.errors,
      });
    }

    // Something else happened but there's a response
    throw new Problem(error.response.status, { detail: summary });
  } else {
    log.error(`Unknown error calling ${service}: ${error.message}`, _sanitizeError(error));

    throw new Problem(502, `Unknown ${service} Error`, {
      detail: error.message,
    });
  }
};
