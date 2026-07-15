import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouter } from 'vue-router';

import rbacService from '~/services/rbacService';
import { useTenantStore } from '~/store/tenant';
import Migrate from '~/views/form/Migrate.vue';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    replace: vi.fn(),
    push: vi.fn(),
  })),
}));

vi.mock('~/services/rbacService', () => ({
  default: {
    getMigrationPreview: vi.fn(),
    executeMigration: vi.fn(),
  },
}));

const FORM_ID = 'form-abc-123';

const MOCK_TENANT = {
  id: 'tenant-1',
  name: 'Tenant One',
  roles: ['form_admin'],
};

const MOCK_IMPACT = {
  team: [
    { email: 'user@example.com', fullName: 'User One', idpCode: 'idir', isBceid: false, roles: ['owner'] },
  ],
  submissions: { total: 10, drafts: 3, withShareUsers: 2 },
};

const MOCK_PREPARE_RESPONSE = {
  data: {
    eligibleTenants: [MOCK_TENANT],
    impact: MOCK_IMPACT,
  },
};

const STUBS = {
  BaseSecure: {
    name: 'BaseSecure',
    template: '<div class="base-secure-stub"><slot /></div>',
  },
};

describe('Migrate.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const tenantStore = useTenantStore(pinia);

  beforeEach(() => {
    tenantStore.$reset();
    tenantStore.isTenantFeatureEnabled = true;
    rbacService.getMigrationPreview.mockResolvedValue(MOCK_PREPARE_RESPONSE);
  });

  function mountComponent() {
    return mount(Migrate, {
      props: { f: FORM_ID },
      global: { plugins: [pinia], stubs: STUBS },
    });
  }

  describe('onMounted — tenant feature gate', () => {
    it('redirects to UserForms and skips prepare call when tenant feature is disabled', async () => {
      const replace = vi.fn();
      useRouter.mockImplementationOnce(() => ({ replace, push: vi.fn() }));
      tenantStore.isTenantFeatureEnabled = false;

      mountComponent();
      await flushPromises();

      expect(replace).toHaveBeenCalledWith({ name: 'UserForms' });
      expect(rbacService.getMigrationPreview).not.toHaveBeenCalled();
    });

    it('calls getMigrationPreview when tenant feature is enabled', async () => {
      mountComponent();
      await flushPromises();

      expect(rbacService.getMigrationPreview).toHaveBeenCalledWith(FORM_ID);
    });
  });

  describe('loadPrepareData', () => {
    it('populates eligibleTenants from response', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.eligibleTenants).toEqual(MOCK_PREPARE_RESPONSE.data.eligibleTenants);
    });

    it('populates impact from response', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.impact).toEqual(MOCK_IMPACT);
    });

    it('defaults impact to empty team and zero submission counts when response omits it', async () => {
      rbacService.getMigrationPreview.mockResolvedValueOnce({ data: { eligibleTenants: [] } });

      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.impact.team).toEqual([]);
      expect(wrapper.vm.impact.submissions.total).toBe(0);
      expect(wrapper.vm.impact.submissions.drafts).toBe(0);
      expect(wrapper.vm.impact.submissions.withShareUsers).toBe(0);
    });

    it('sets error and keeps eligibleTenants empty on prepare failure', async () => {
      const errMsg = 'Form is already migrated to a tenant.';
      rbacService.getMigrationPreview.mockRejectedValueOnce({
        response: { data: { detail: errMsg } },
      });

      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.eligibleTenants).toEqual([]);
    });

    it('loading is false after prepare resolves', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.loading).toBe(false);
    });
  });

  describe('computed: canSubmit', () => {
    it('is false when no tenant selected', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.canSubmit).toBe(false);
    });

    it('is true when a tenant is selected', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      expect(wrapper.vm.canSubmit).toBe(true);
    });
  });

  describe('computed: selectedTenant', () => {
    it('returns the matching tenant object from eligibleTenants', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      expect(wrapper.vm.selectedTenant).toEqual(MOCK_TENANT);
    });

    it('returns null when selectedTenantId has no match', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'unknown-id';
      expect(wrapper.vm.selectedTenant).toBeNull();
    });
  });

  describe('confirmMigration', () => {
    beforeEach(() => {
      rbacService.executeMigration.mockResolvedValue({});
    });

    it('calls executeMigration with formId and tenantId only — no groupIds', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await wrapper.vm.confirmMigration();

      expect(rbacService.executeMigration).toHaveBeenCalledWith(FORM_ID, {
        tenantId: 'tenant-1',
      });
    });

    it('switches to the migrated tenant via tenantStore.selectTenant', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await wrapper.vm.confirmMigration();

      expect(tenantStore.selectTenant).toHaveBeenCalledWith(MOCK_TENANT);
    });

    it('redirects to FormGroups on success so user can review auto-assigned groups', async () => {
      const push = vi.fn();
      useRouter.mockImplementationOnce(() => ({ replace: vi.fn(), push }));

      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await wrapper.vm.confirmMigration();

      expect(push).toHaveBeenCalledWith({ name: 'FormGroups', query: { f: FORM_ID } });
    });

    it('sets error and does not redirect on executeMigration failure', async () => {
      const push = vi.fn();
      useRouter.mockImplementationOnce(() => ({ replace: vi.fn(), push }));
      rbacService.executeMigration.mockRejectedValueOnce({
        response: { data: { detail: 'Form is already migrated to a tenant.' } },
      });

      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await wrapper.vm.confirmMigration();

      expect(tenantStore.selectTenant).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    });

    it('sets submitting to false after execution completes', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await wrapper.vm.confirmMigration();

      expect(wrapper.vm.submitting).toBe(false);
    });
  });
});
