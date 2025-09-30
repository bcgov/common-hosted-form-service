// Placeholder middleware: currently allows all origins.

/**
 * Origin allowlist middleware for Web Components endpoints.
 *
 * Stub behavior: always allow.
 *
 * Future behavior: placed AFTER apiAccess so the request has a resolved formId.
 * Use that formId to look up a per-form allowlist (origins/referrers) from the
 * database and enforce it here by comparing the request's Origin/Referer.
 */
module.exports = function originAccess(req, res, next) {
  next();
};
