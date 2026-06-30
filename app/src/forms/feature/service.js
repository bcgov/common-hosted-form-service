const config = require('config');
const falsey = require('falsey');
const Problem = require('api-problem');
const uuid = require('uuid');

const { FeatureFlag, FeatureFlagForm, FeatureFlagTenant } = require('../common/models');

const service = {
  /**
   * Global master switch for a feature, sourced from config/env at
   * `features.<code>.enabled`. A code with no config entry reads as disabled.
   * Env-sourced values arrive as strings; `falsey` coerces them the same way the
   * rest of the codebase reads boolean configs (e.g. eventStreamService.websockets).
   */
  isEnabled: (code) => {
    const path = `features.${code}.enabled`;
    if (!config.has(path)) return false;
    return !falsey(config.get(path));
  },

  _getByCodeOrThrow: async (code) => {
    const feature = await FeatureFlag.query().modify('findByCode', code).first();
    if (!feature) {
      throw new Problem(404, { detail: `Feature flag '${code}' not found.` });
    }
    return feature;
  },

  /**
   * Allowlist gate (independent of the master switch): a feature is allowed for a
   * context when it is universal (allowAll) OR the form OR the tenant is allowlisted.
   */
  isAllowed: async (code, { formId, tenantId } = {}) => {
    const feature = await FeatureFlag.query().modify('findByCode', code).first();
    if (!feature) return false;
    if (feature.allowAll) return true;
    if (formId && uuid.validate(formId)) {
      const match = await FeatureFlagForm.query().modify('filterFeatureFlagId', feature.id).modify('filterFormId', formId).first();
      if (match) return true;
    }
    if (tenantId && uuid.validate(tenantId)) {
      const match = await FeatureFlagTenant.query().modify('filterFeatureFlagId', feature.id).modify('filterTenantId', tenantId).first();
      if (match) return true;
    }
    return false;
  },

  /**
   * Full resolution for a single feature in a context.
   * active = enabled (config) AND allowed (allowAll OR form OR tenant).
   */
  resolve: async (code, ctx = {}) => {
    const feature = await FeatureFlag.query().modify('findByCode', code).first();
    const enabled = service.isEnabled(code);
    if (!feature) {
      return { code, enabled, allowAll: false, allowed: false, active: false };
    }
    const allowed = await service.isAllowed(code, ctx);
    return { code, enabled, allowAll: feature.allowAll, allowed, active: enabled && allowed };
  },

  /**
   * Resolve every registered feature for a context in one pass.
   * Returns a flat map { <code>: active(boolean) } for the frontend.
   * Optionally narrow to a single `code`.
   */
  check: async ({ formId, tenantId, code } = {}) => {
    const query = FeatureFlag.query();
    if (code) query.modify('findByCode', code);
    const features = await query;

    const validForm = formId && uuid.validate(formId) ? formId : null;
    const validTenant = tenantId && uuid.validate(tenantId) ? tenantId : null;
    const formMatches = validForm ? await FeatureFlagForm.query().modify('filterFormId', validForm) : [];
    const tenantMatches = validTenant ? await FeatureFlagTenant.query().modify('filterTenantId', validTenant) : [];
    const formSet = new Set(formMatches.map((r) => r.featureFlagId));
    const tenantSet = new Set(tenantMatches.map((r) => r.featureFlagId));

    const result = {};
    for (const f of features) {
      const enabled = service.isEnabled(f.code);
      const allowed = f.allowAll || formSet.has(f.id) || tenantSet.has(f.id);
      result[f.code] = enabled && allowed;
    }
    return result;
  },

  /**
   * Public catalog: definitions + global enabled only. No allowlist membership and
   * no allowAll/rollout posture is exposed on this read path.
   */
  listFeatures: async () => {
    const features = await FeatureFlag.query().orderBy('code');
    return features.map((f) => ({
      code: f.code,
      name: f.name,
      description: f.description,
      enabled: service.isEnabled(f.code),
    }));
  },

  // ---- Admin management (called from the admin module; admin-protected) ----

  /** Admin list: full definitions + global enabled (no allowlist membership). */
  listAdmin: async () => {
    const features = await FeatureFlag.query().orderBy('code');
    return features.map((f) => ({ ...f, enabled: service.isEnabled(f.code) }));
  },

  /** Admin detail: full definition incl. allowlist membership. */
  readFeature: async (code) => {
    const feature = await service._getByCodeOrThrow(code);
    const forms = await FeatureFlagForm.query().modify('filterFeatureFlagId', feature.id);
    const tenants = await FeatureFlagTenant.query().modify('filterFeatureFlagId', feature.id);
    return {
      ...feature,
      enabled: service.isEnabled(feature.code),
      forms: forms.map((f) => f.formId),
      tenants: tenants.map((t) => t.tenantId),
    };
  },

  setAllowAll: async (code, allowAll, currentUser) => {
    const feature = await service._getByCodeOrThrow(code);
    await FeatureFlag.query().findById(feature.id).patch({ allowAll: !!allowAll, updatedBy: currentUser.usernameIdp });
    return service.readFeature(code);
  },

  addForm: async (code, formId, currentUser) => {
    const feature = await service._getByCodeOrThrow(code);
    const existing = await FeatureFlagForm.query().modify('filterFeatureFlagId', feature.id).modify('filterFormId', formId).first();
    if (existing) return existing;
    return FeatureFlagForm.query().insert({
      id: uuid.v4(),
      featureFlagId: feature.id,
      formId,
      createdBy: currentUser.usernameIdp,
    });
  },

  removeForm: async (code, formId) => {
    const feature = await service._getByCodeOrThrow(code);
    return FeatureFlagForm.query().delete().modify('filterFeatureFlagId', feature.id).modify('filterFormId', formId);
  },

  addTenant: async (code, tenantId, currentUser) => {
    const feature = await service._getByCodeOrThrow(code);
    const existing = await FeatureFlagTenant.query().modify('filterFeatureFlagId', feature.id).modify('filterTenantId', tenantId).first();
    if (existing) return existing;
    return FeatureFlagTenant.query().insert({
      id: uuid.v4(),
      featureFlagId: feature.id,
      tenantId,
      createdBy: currentUser.usernameIdp,
    });
  },

  removeTenant: async (code, tenantId) => {
    const feature = await service._getByCodeOrThrow(code);
    return FeatureFlagTenant.query().delete().modify('filterFeatureFlagId', feature.id).modify('filterTenantId', tenantId);
  },
};

module.exports = service;
