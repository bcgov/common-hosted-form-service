jest.mock('config', () => ({ get: jest.fn(), has: jest.fn() }));
jest.mock('../../../../src/forms/common/models', () => ({
  FeatureFlag: { query: jest.fn() },
  FeatureFlagForm: { query: jest.fn() },
  FeatureFlagTenant: { query: jest.fn() },
}));

const config = require('config');
const { FeatureFlag, FeatureFlagForm, FeatureFlagTenant } = require('../../../../src/forms/common/models');
const service = require('../../../../src/forms/feature/service');

// A chainable, awaitable Objection-query stub that resolves to `value`.
const queryStub = (value) => {
  const q = { then: (resolve) => resolve(value) };
  ['modify', 'first', 'orderBy', 'where', 'findById', 'patch', 'delete', 'insert'].forEach((m) => {
    q[m] = jest.fn(() => q);
  });
  return q;
};

const FORM_ID = '11111111-1111-4111-8111-111111111111';
const TENANT_ID = '22222222-2222-4222-8222-222222222222';

afterEach(() => {
  jest.clearAllMocks();
});

describe('isEnabled', () => {
  it('returns false when the config entry is absent', () => {
    config.has.mockReturnValue(false);
    expect(service.isEnabled('offlineForms')).toBe(false);
    expect(config.get).not.toHaveBeenCalled();
  });

  it('reads the features.<code>.enabled path', () => {
    config.has.mockReturnValue(true);
    config.get.mockReturnValue(true);
    service.isEnabled('offlineForms');
    expect(config.has).toHaveBeenCalledWith('features.offlineForms.enabled');
    expect(config.get).toHaveBeenCalledWith('features.offlineForms.enabled');
  });

  it.each([
    [true, true],
    ['true', true],
    ['1', true],
    [false, false],
    ['false', false],
    ['0', false],
    ['no', false],
    ['', false],
  ])('coerces config value %p to %p (falsey convention)', (value, expected) => {
    config.has.mockReturnValue(true);
    config.get.mockReturnValue(value);
    expect(service.isEnabled('offlineForms')).toBe(expected);
  });
});

describe('check (resolution truth table)', () => {
  const setEnabled = (enabled) => {
    config.has.mockReturnValue(true);
    config.get.mockReturnValue(enabled);
  };

  it('is false when the master switch is off, even if allowlisted via allowAll', async () => {
    setEnabled(false);
    FeatureFlag.query.mockReturnValue(queryStub([{ id: 'f1', code: 'offlineForms', allowAll: true }]));
    const result = await service.check({});
    expect(result).toEqual({ offlineForms: false });
  });

  it('is true when enabled and allowAll', async () => {
    setEnabled(true);
    FeatureFlag.query.mockReturnValue(queryStub([{ id: 'f1', code: 'offlineForms', allowAll: true }]));
    const result = await service.check({});
    expect(result).toEqual({ offlineForms: true });
    // allowAll short-circuits: no allowlist lookups needed
    expect(FeatureFlagForm.query).not.toHaveBeenCalled();
    expect(FeatureFlagTenant.query).not.toHaveBeenCalled();
  });

  it('is true when enabled and the form is allowlisted (OR)', async () => {
    setEnabled(true);
    FeatureFlag.query.mockReturnValue(queryStub([{ id: 'f1', code: 'offlineForms', allowAll: false }]));
    FeatureFlagForm.query.mockReturnValue(queryStub([{ featureFlagId: 'f1', formId: FORM_ID }]));
    FeatureFlagTenant.query.mockReturnValue(queryStub([]));
    const result = await service.check({ formId: FORM_ID });
    expect(result).toEqual({ offlineForms: true });
  });

  it('is true when enabled and the tenant is allowlisted (OR)', async () => {
    setEnabled(true);
    FeatureFlag.query.mockReturnValue(queryStub([{ id: 'f1', code: 'offlineForms', allowAll: false }]));
    FeatureFlagForm.query.mockReturnValue(queryStub([]));
    FeatureFlagTenant.query.mockReturnValue(queryStub([{ featureFlagId: 'f1', tenantId: TENANT_ID }]));
    const result = await service.check({ tenantId: TENANT_ID });
    expect(result).toEqual({ offlineForms: true });
  });

  it('is false when enabled but gated with no matching allowlist entry', async () => {
    setEnabled(true);
    FeatureFlag.query.mockReturnValue(queryStub([{ id: 'f1', code: 'offlineForms', allowAll: false }]));
    FeatureFlagForm.query.mockReturnValue(queryStub([]));
    FeatureFlagTenant.query.mockReturnValue(queryStub([]));
    const result = await service.check({ formId: FORM_ID, tenantId: TENANT_ID });
    expect(result).toEqual({ offlineForms: false });
  });

  it('ignores a non-UUID formId (no allowlist query, resolves false)', async () => {
    setEnabled(true);
    FeatureFlag.query.mockReturnValue(queryStub([{ id: 'f1', code: 'offlineForms', allowAll: false }]));
    const result = await service.check({ formId: 'not-a-uuid' });
    expect(result).toEqual({ offlineForms: false });
    expect(FeatureFlagForm.query).not.toHaveBeenCalled();
  });
});

describe('isAllowed', () => {
  it('returns false for an unknown code', async () => {
    FeatureFlag.query.mockReturnValue(queryStub(undefined));
    expect(await service.isAllowed('nope', { formId: FORM_ID })).toBe(false);
  });

  it('short-circuits to true on allowAll without querying allowlists', async () => {
    FeatureFlag.query.mockReturnValue(queryStub({ id: 'f1', allowAll: true }));
    expect(await service.isAllowed('offlineForms', { formId: FORM_ID })).toBe(true);
    expect(FeatureFlagForm.query).not.toHaveBeenCalled();
  });
});

describe('listFeatures (public catalog)', () => {
  it('returns code/name/description/enabled only — no allowlists or allowAll', async () => {
    config.has.mockReturnValue(true);
    config.get.mockReturnValue('true');
    FeatureFlag.query.mockReturnValue(queryStub([{ id: 'f1', code: 'offlineForms', name: 'Offline Forms', description: 'desc', allowAll: true, createdBy: 'x' }]));
    const result = await service.listFeatures();
    expect(result).toEqual([{ code: 'offlineForms', name: 'Offline Forms', description: 'desc', enabled: true }]);
    expect(result[0]).not.toHaveProperty('allowAll');
  });
});

describe('readFeature (admin detail)', () => {
  it('includes allowlisted formIds and tenantIds', async () => {
    config.has.mockReturnValue(true);
    config.get.mockReturnValue(false);
    FeatureFlag.query.mockReturnValue(queryStub({ id: 'f1', code: 'offlineForms', allowAll: false }));
    FeatureFlagForm.query.mockReturnValue(queryStub([{ formId: FORM_ID }]));
    FeatureFlagTenant.query.mockReturnValue(queryStub([{ tenantId: TENANT_ID }]));
    const result = await service.readFeature('offlineForms');
    expect(result.forms).toEqual([FORM_ID]);
    expect(result.tenants).toEqual([TENANT_ID]);
    expect(result.enabled).toBe(false);
  });

  it('throws a 404 Problem for an unknown code', async () => {
    FeatureFlag.query.mockReturnValue(queryStub(undefined));
    await expect(service.readFeature('nope')).rejects.toMatchObject({ status: 404 });
  });
});

describe('admin mutations', () => {
  const currentUser = { usernameIdp: 'tester@idir' };

  it('setAllowAll patches allowAll with the editor stamp', async () => {
    const ff = queryStub({ id: 'f1', code: 'offlineForms', allowAll: false });
    config.has.mockReturnValue(true);
    config.get.mockReturnValue(false);
    FeatureFlag.query.mockReturnValue(ff);
    FeatureFlagForm.query.mockReturnValue(queryStub([]));
    FeatureFlagTenant.query.mockReturnValue(queryStub([]));
    await service.setAllowAll('offlineForms', true, currentUser);
    expect(ff.patch).toHaveBeenCalledWith({ allowAll: true, updatedBy: 'tester@idir' });
  });

  it('addForm inserts a new allowlist row when none exists', async () => {
    FeatureFlag.query.mockReturnValue(queryStub({ id: 'f1' }));
    const ffForm = queryStub(undefined); // existence check resolves undefined
    FeatureFlagForm.query.mockReturnValue(ffForm);
    await service.addForm('offlineForms', FORM_ID, currentUser);
    expect(ffForm.insert).toHaveBeenCalledWith(expect.objectContaining({ featureFlagId: 'f1', formId: FORM_ID, createdBy: 'tester@idir' }));
  });

  it('addForm is idempotent — returns existing without inserting', async () => {
    FeatureFlag.query.mockReturnValue(queryStub({ id: 'f1' }));
    const existing = { id: 'row1', featureFlagId: 'f1', formId: FORM_ID };
    const ffForm = queryStub(existing);
    FeatureFlagForm.query.mockReturnValue(ffForm);
    const result = await service.addForm('offlineForms', FORM_ID, currentUser);
    expect(result).toBe(existing);
    expect(ffForm.insert).not.toHaveBeenCalled();
  });

  it('removeForm deletes filtered by feature and form', async () => {
    FeatureFlag.query.mockReturnValue(queryStub({ id: 'f1' }));
    const ffForm = queryStub(1);
    FeatureFlagForm.query.mockReturnValue(ffForm);
    await service.removeForm('offlineForms', FORM_ID);
    expect(ffForm.delete).toHaveBeenCalled();
    expect(ffForm.modify).toHaveBeenCalledWith('filterFormId', FORM_ID);
  });

  it('addTenant inserts a new tenant allowlist row', async () => {
    FeatureFlag.query.mockReturnValue(queryStub({ id: 'f1' }));
    const ffTenant = queryStub(undefined);
    FeatureFlagTenant.query.mockReturnValue(ffTenant);
    await service.addTenant('offlineForms', TENANT_ID, currentUser);
    expect(ffTenant.insert).toHaveBeenCalledWith(expect.objectContaining({ featureFlagId: 'f1', tenantId: TENANT_ID, createdBy: 'tester@idir' }));
  });

  it('removeTenant deletes filtered by feature and tenant', async () => {
    FeatureFlag.query.mockReturnValue(queryStub({ id: 'f1' }));
    const ffTenant = queryStub(1);
    FeatureFlagTenant.query.mockReturnValue(ffTenant);
    await service.removeTenant('offlineForms', TENANT_ID);
    expect(ffTenant.delete).toHaveBeenCalled();
    expect(ffTenant.modify).toHaveBeenCalledWith('filterTenantId', TENANT_ID);
  });
});
