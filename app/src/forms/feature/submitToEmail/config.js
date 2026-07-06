const config = require('config');

// Operational config for the submitToEmail feature, sourced from node-config
// (features.submitToEmail.*) with safe fallbacks. This is global/operational
// config and is independent of the per-form allowlist (feature/service resolve).
// Extend with new knobs (e.g. attachment / CDOGS output size limits) as siblings
// of batchSize.
const DELIVERY_MODES = ['link', 'attachment'];

const DEFAULTS = {
  // Max number of queued package jobs processed per drain pass.
  batchSize: 25,
  // Default delivery mode:
  //   'attachment' — send inline if within the size limits, else fall back to a
  //                  stored zip + download link (size-based decision).
  //   'link'       — always deliver as a stored zip + download link (handy for
  //                  testing/demos; no CHES size dependency).
  delivery: 'attachment',
  // Delivery is chosen by size: if the rendered report is within reportSizeLimit
  // AND the attachments are within both attachmentsSizeLimit (total bytes) and
  // attachmentsCountLimit (number), the package is sent as inline email
  // attachments; otherwise it falls back to a stored zip + download link.
  // These are pre-encoding byte counts — base64 inflates by ~33%, so keep
  // reportSizeLimit + attachmentsSizeLimit comfortably under the CHES cap.
  reportSizeLimit: 5_000_000, // 5 MB rendered report
  attachmentsSizeLimit: 10_000_000, // 10 MB total attachments
  attachmentsCountLimit: 10, // max number of attachments
  // A PROCESSING job older than this is considered stuck (its worker died) and
  // is reclaimable by the next drain. Must exceed the longest expected job.
  stuckTimeoutMinutes: 30,
  // Max processing attempts before a (transient-failing) job is marked FAILED.
  // Permanent errors fail on the first attempt regardless.
  maxAttempts: 3,
};

// Read a positive-integer setting from node-config, coercing env-string values
// and falling back to a default for absent / invalid / non-positive values.
const positiveInt = (path, defaultValue) => {
  if (!config.has(path)) return defaultValue;
  const parsed = Number(config.get(path));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
};

// Read a setting constrained to a fixed set of values (case-insensitive),
// falling back to a default for absent / unrecognized values.
const oneOf = (path, allowed, defaultValue) => {
  if (!config.has(path)) return defaultValue;
  const value = String(config.get(path)).toLowerCase();
  return allowed.includes(value) ? value : defaultValue;
};

const service = {
  DEFAULTS,

  getConfig: () => ({
    batchSize: positiveInt('features.submitToEmail.batchSize', DEFAULTS.batchSize),
    delivery: oneOf('features.submitToEmail.delivery', DELIVERY_MODES, DEFAULTS.delivery),
    reportSizeLimit: positiveInt('features.submitToEmail.reportSizeLimit', DEFAULTS.reportSizeLimit),
    attachmentsSizeLimit: positiveInt('features.submitToEmail.attachmentsSizeLimit', DEFAULTS.attachmentsSizeLimit),
    attachmentsCountLimit: positiveInt('features.submitToEmail.attachmentsCountLimit', DEFAULTS.attachmentsCountLimit),
    stuckTimeoutMinutes: positiveInt('features.submitToEmail.stuckTimeoutMinutes', DEFAULTS.stuckTimeoutMinutes),
    maxAttempts: positiveInt('features.submitToEmail.maxAttempts', DEFAULTS.maxAttempts),
  }),
};

module.exports = service;
