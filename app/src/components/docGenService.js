const Problem = require('api-problem');

const log = require('./log')(module.filename);
const cdogsService = require('./cdogsService');
const cdogsV3Service = require('./cdogsV3Service');
const featureService = require('../forms/feature/service');
const { FormDocumentGeneration } = require('../forms/common/models');

const FEATURE_V2 = 'documentGenerationV2';
const FEATURE_V3 = 'documentGenerationV3';

const GENERATOR = Object.freeze({ V2: 'v2', V3: 'v3', NONE: 'none' });
const OUTCOME = Object.freeze({ SUCCESS: 'success', FAIL: 'fail', DENIED: 'denied' });

// Cap stored error text so a large/binary upstream body can't bloat the metrics row.
const MAX_ERROR_DETAIL = 1000;

// Useless string coercion of an object (e.g. `String({})`); never worth storing.
const USELESS_DETAIL = '[object Object]';

/**
 * Derive a meaningful, storable error detail string from a thrown error.
 * Prefers `error.detail`: a non-empty, non-`[object Object]` string is used as-is;
 * an object is JSON-stringified (so structured CDOGS/Problem details survive);
 * otherwise falls back to `error.message`. Returns null when nothing useful exists.
 */
const normalizeErrorDetail = (error) => {
  if (!error) return null;

  const { detail, message } = error;

  if (detail !== undefined && detail !== null) {
    if (typeof detail === 'string') {
      if (detail.length > 0 && detail !== USELESS_DETAIL) return detail;
    } else if (typeof detail === 'object') {
      try {
        const json = JSON.stringify(detail);
        if (json && json !== '{}') return json;
      } catch {
        // circular / non-serializable — fall through to message
      }
    } else {
      // number, boolean, etc.
      return String(detail);
    }
  }

  return message || null;
};

const service = {
  /**
   * Persist a single document-generation attempt. Deliberately swallows its own
   * errors: a metrics failure must never break document generation.
   */
  _record: async ({ formId, submissionId, tenantId, generatorVersion, outcome, httpStatus, durationMs, errorDetail, currentUser }) => {
    try {
      await FormDocumentGeneration.query().insert({
        formId,
        submissionId: submissionId || null,
        tenantId: tenantId || null,
        generatorVersion,
        outcome,
        httpStatus: httpStatus ?? null,
        durationMs: durationMs ?? null,
        errorDetail: errorDetail ? String(errorDetail).substring(0, MAX_ERROR_DETAIL) : null,
        createdBy: currentUser?.usernameIdp || undefined,
      });
    } catch (e) {
      log.error(`Failed to record document generation metric: ${e.message}`, { function: '_record' });
    }
  },

  /**
   * Choose the generator for a form: V3 when active, else V2 when active, else
   * null. "active" means the feature is both config-enabled and allowlisted
   * (allowAll, or the form/tenant is on the allowlist). V3 wins when active.
   */
  _resolveGenerator: async ({ formId, tenantId }) => {
    const v3 = await featureService.resolve(FEATURE_V3, { formId, tenantId });
    if (v3.active) return { version: GENERATOR.V3, client: cdogsV3Service };

    const v2 = await featureService.resolve(FEATURE_V2, { formId, tenantId });
    if (v2.active) return { version: GENERATOR.V2, client: cdogsService };

    return null;
  },

  /**
   * Facade over the CDOGS v2/v3 generators: gate by feature flag, route to the
   * appropriate generator, record a metric for every outcome (success, failure,
   * and denial), and return the generator's `{ data, headers, status }` so callers
   * keep their existing response handling.
   *
   * @param {Object} opts
   * @param {string} opts.formId required; the form the render belongs to.
   * @param {string} [opts.tenantId] tenant context for allowlist resolution.
   * @param {string} [opts.submissionId] saved submission id, if any (null for drafts).
   * @param {Object} opts.templateBody the CDOGS template/render payload.
   * @param {Object} [opts.currentUser] the requesting user (for createdBy).
   */
  templateUploadAndRender: async ({ formId, tenantId, submissionId, templateBody, currentUser } = {}) => {
    if (!formId) {
      throw new Problem(400, { detail: 'formId is required for document generation.' });
    }

    const selected = await service._resolveGenerator({ formId, tenantId });

    if (!selected) {
      await service._record({
        formId,
        submissionId,
        tenantId,
        generatorVersion: GENERATOR.NONE,
        outcome: OUTCOME.DENIED,
        currentUser,
      });
      throw new Problem(403, { detail: 'Document generation is not enabled for this form.' });
    }

    const start = Date.now();
    try {
      // The underlying CDOGS services convert their own failures into thrown
      // Problems (via errorToProblem), so reaching here means success.
      const result = await selected.client.templateUploadAndRender(templateBody);
      await service._record({
        formId,
        submissionId,
        tenantId,
        generatorVersion: selected.version,
        outcome: OUTCOME.SUCCESS,
        httpStatus: result?.status,
        durationMs: Date.now() - start,
        currentUser,
      });
      return result;
    } catch (e) {
      await service._record({
        formId,
        submissionId,
        tenantId,
        generatorVersion: selected.version,
        outcome: OUTCOME.FAIL,
        httpStatus: e.status,
        durationMs: Date.now() - start,
        errorDetail: normalizeErrorDetail(e),
        currentUser,
      });
      throw e;
    }
  },
};

module.exports = service;
module.exports.GENERATOR = GENERATOR;
module.exports.OUTCOME = OUTCOME;
module.exports.normalizeErrorDetail = normalizeErrorDetail;
