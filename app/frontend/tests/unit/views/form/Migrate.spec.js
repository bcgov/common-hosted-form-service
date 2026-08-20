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
    getMigrationTenantGroups: vi.fn(),
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

  const MOCK_GROUPS_RESPONSE = {
    data: { groups: [], preSelectedGroupIds: [], teamMemberGroups: [] },
  };

  beforeEach(() => {
    tenantStore.$reset();
    tenantStore.isTenantFeatureEnabled = true;
    rbacService.getMigrationPreview.mockResolvedValue(MOCK_PREPARE_RESPONSE);
    rbacService.getMigrationTenantGroups.mockResolvedValue(MOCK_GROUPS_RESPONSE);
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

    it('is false when tenant selected but confirm checkbox unchecked', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      expect(wrapper.vm.canSubmit).toBe(false);
    });

    it('is false when confirmed but no assigned group has the Form Admin role', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.confirmed = true;
      wrapper.vm.assignedGroups = [{ id: 'g1', name: 'Group 1', isFormAdmin: false }];

      expect(wrapper.vm.canSubmit).toBe(false);
    });

    it('is true when a tenant is selected, confirmed, and a Form Admin group is assigned', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.confirmed = true;
      wrapper.vm.assignedGroups = [{ id: 'g1', name: 'Group 1', isFormAdmin: true }];

      expect(wrapper.vm.canSubmit).toBe(true);
    });
  });

  describe('computed: showNoGroupsWarning', () => {
    it('is false when no tenant is selected', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.showNoGroupsWarning).toBe(false);
    });

    it('is true when a tenant is selected and no assigned group has the Form Admin role', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      expect(wrapper.vm.assignedGroups).toEqual([]);
      expect(wrapper.vm.showNoGroupsWarning).toBe(true);
    });

    it('is false once a Form Admin group is assigned', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.assignedGroups = [{ id: 'g1', name: 'Group 1', isFormAdmin: true }];

      expect(wrapper.vm.showNoGroupsWarning).toBe(false);
    });
  });

  describe('BCeID Basic vs Business — access impact', () => {
    const TEAM_WITH_MIXED_IDPS = [
      { email: 'basic@example.com', fullName: 'Basic User', idpCode: 'bceid-basic', isBceid: true, isBceidBasic: true, roles: ['form_submitter'] },
      { email: 'biz@example.com', fullName: 'Business User', idpCode: 'bceid-business', isBceid: true, isBceidBasic: false, roles: ['form_submitter'] },
      { email: 'idir@example.com', fullName: 'IDIR User', idpCode: 'idir', isBceid: false, isBceidBasic: false, roles: ['owner'] },
    ];

    function mockPrepareWithTeam(team) {
      rbacService.getMigrationPreview.mockResolvedValue({
        data: {
          eligibleTenants: [MOCK_TENANT],
          impact: { team, submissions: { total: 0, drafts: 0, withShareUsers: 0 } },
        },
      });
    }

    it('only BCeID Basic members are unconditionally flagged as losing access', async () => {
      mockPrepareWithTeam(TEAM_WITH_MIXED_IDPS);
      const wrapper = mountComponent();
      await flushPromises();

      const statuses = Object.fromEntries(
        wrapper.vm.teamRowsWithStatus.map((m) => [m.email, m.transferStatus])
      );
      expect(statuses['basic@example.com']).toBe('loses_access');
      expect(statuses['biz@example.com']).not.toBe('loses_access');
      expect(statuses['idir@example.com']).not.toBe('loses_access');
    });

    it('BCeID Business follows the same group-membership logic as IDIR once a tenant is selected', async () => {
      mockPrepareWithTeam(TEAM_WITH_MIXED_IDPS);
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [{ id: 'g1', name: 'Admins', isFormAdmin: true }],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [
            { email: 'biz@example.com', groupIds: ['g1'] },
            { email: 'idir@example.com', groupIds: ['g1'] },
          ],
        },
      });
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      const statuses = Object.fromEntries(
        wrapper.vm.teamRowsWithStatus.map((m) => [m.email, m.transferStatus])
      );
      expect(statuses['biz@example.com']).toBe('retained');
      expect(statuses['idir@example.com']).toBe('retained');
      expect(statuses['basic@example.com']).toBe('loses_access');
    });

    it('hasBceidBasicUsers / bceidBasicCount only count BCeID Basic, not Business', async () => {
      mockPrepareWithTeam(TEAM_WITH_MIXED_IDPS);
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.hasBceidBasicUsers).toBe(true);
      expect(wrapper.vm.bceidBasicCount).toBe(1);
    });

    it('hasBceidBasicUsers is false when the team has BCeID Business but no BCeID Basic members', async () => {
      mockPrepareWithTeam(TEAM_WITH_MIXED_IDPS.filter((m) => m.email !== 'basic@example.com'));
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.hasBceidBasicUsers).toBe(false);
      expect(wrapper.vm.bceidBasicCount).toBe(0);
    });
  });

  describe('Form Admin group check — via real GroupPicker UI', () => {
    const GROUPS_WITH_FORM_ADMIN = {
      data: {
        groups: [
          { id: 'g1', name: 'Admins', roles: ['form_admin'], isFormAdmin: true, isUserMember: true },
          { id: 'g2', name: 'Reviewers', roles: ['reviewer'], isFormAdmin: false, isUserMember: true },
        ],
        preSelectedGroupIds: ['g1'],
        teamMemberGroups: [],
      },
    };

    function arrowButtons(wrapper) {
      return wrapper.find('.arrows-col').findAll('button');
    }

    it('pre-selects the Form Admin group on initial load and allows submission', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(GROUPS_WITH_FORM_ADMIN);

      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
      expect(wrapper.vm.hasFormAdminGroupAssigned).toBe(true);
      expect(wrapper.vm.showNoGroupsWarning).toBe(false);
    });

    it('shows the warning and disables submit after removing the Form Admin group', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(GROUPS_WITH_FORM_ADMIN);

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.confirmed = true;

      // Select the assigned Form Admin group row, then click "remove selected".
      await wrapper.find('.form-admin-row input[type="checkbox"]').trigger('click');
      await flushPromises();
      await arrowButtons(wrapper)[2].trigger('click'); // removeSelected
      await flushPromises();

      expect(wrapper.vm.assignedGroups).toEqual([]);
      expect(wrapper.vm.hasFormAdminGroupAssigned).toBe(false);
      expect(wrapper.vm.showNoGroupsWarning).toBe(true);
      expect(wrapper.vm.canSubmit).toBe(false);
    });

    it('clears the warning and re-enables submit after re-adding the Form Admin group', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(GROUPS_WITH_FORM_ADMIN);

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.confirmed = true;

      // Remove it first.
      await wrapper.find('.form-admin-row input[type="checkbox"]').trigger('click');
      await flushPromises();
      await arrowButtons(wrapper)[2].trigger('click'); // removeSelected
      await flushPromises();
      expect(wrapper.vm.hasFormAdminGroupAssigned).toBe(false);

      // Now it's in the "Available" panel — select and add it back.
      await wrapper.find('.form-admin-row input[type="checkbox"]').trigger('click');
      await flushPromises();
      await arrowButtons(wrapper)[0].trigger('click'); // addSelected
      await flushPromises();

      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
      expect(wrapper.vm.hasFormAdminGroupAssigned).toBe(true);
      expect(wrapper.vm.showNoGroupsWarning).toBe(false);
      expect(wrapper.vm.canSubmit).toBe(true);
    });
  });

  describe('refreshTenantGroups', () => {
    it('does nothing when no tenant is selected', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      rbacService.getMigrationTenantGroups.mockClear();
      await wrapper.vm.refreshTenantGroups();

      expect(rbacService.getMigrationTenantGroups).not.toHaveBeenCalled();
    });

    it('re-fetches groups for the currently selected tenant without clearing it', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [{ id: 'g1', name: 'Admins', isFormAdmin: true }],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      rbacService.getMigrationTenantGroups.mockClear();
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [
            { id: 'g1', name: 'Admins', isFormAdmin: true },
            { id: 'g3', name: 'New Group', isFormAdmin: false },
          ],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });
      await wrapper.vm.refreshTenantGroups();

      expect(rbacService.getMigrationTenantGroups).toHaveBeenCalledWith(FORM_ID, 'tenant-1');
      expect(wrapper.vm.selectedTenantId).toBe('tenant-1');
      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
    });

    it('drops assigned groups no longer present and sets staleGroupsRemoved', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [
            { id: 'g1', name: 'Admins', isFormAdmin: true },
            { id: 'g2', name: 'Reviewers', isFormAdmin: false },
          ],
          preSelectedGroupIds: ['g1', 'g2'],
          teamMemberGroups: [],
        },
      });
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.confirmed = true;

      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1', 'g2']);
      expect(wrapper.vm.staleGroupsRemoved).toBe(false);

      // g2 has since been deleted from the tenant.
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [{ id: 'g1', name: 'Admins', isFormAdmin: true }],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });
      await wrapper.vm.refreshTenantGroups();

      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
      expect(wrapper.vm.staleGroupsRemoved).toBe(true);
      expect(wrapper.vm.confirmed).toBe(false);
    });

    it('does not flag staleGroupsRemoved when nothing was dropped', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [{ id: 'g1', name: 'Admins', isFormAdmin: true }],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      await wrapper.vm.refreshTenantGroups();

      expect(wrapper.vm.staleGroupsRemoved).toBe(false);
      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
    });

    it('sets error and leaves current data intact when the refresh call fails', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [{ id: 'g1', name: 'Admins', isFormAdmin: true }],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      rbacService.getMigrationTenantGroups.mockRejectedValueOnce({
        response: { data: { detail: 'CSTAR unavailable' } },
      });
      await wrapper.vm.refreshTenantGroups();

      expect(wrapper.vm.error).toBe('CSTAR unavailable');
      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
      expect(wrapper.vm.refreshingGroups).toBe(false);
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

  describe('submitMigration', () => {
    beforeEach(() => {
      rbacService.executeMigration.mockResolvedValue({});
    });

    it('calls executeMigration with formId and tenantId only when no groups assigned', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises(); // let the watcher fire
      await wrapper.vm.submitMigration();

      expect(rbacService.executeMigration).toHaveBeenCalledWith(FORM_ID, {
        tenantId: 'tenant-1',
      });
    });

    it('switches to the migrated tenant via tenantStore.selectTenant', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      await wrapper.vm.submitMigration();

      expect(tenantStore.selectTenant).toHaveBeenCalledWith(MOCK_TENANT);
    });

    it('redirects to UserForms on success', async () => {
      const push = vi.fn();
      useRouter.mockImplementationOnce(() => ({ replace: vi.fn(), push }));

      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      await wrapper.vm.submitMigration();

      expect(push).toHaveBeenCalledWith({ name: 'UserForms' });
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
      await flushPromises();
      await wrapper.vm.submitMigration();

      expect(tenantStore.selectTenant).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    });

    it('sets submitting to false after execution completes', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      await wrapper.vm.submitMigration();

      expect(wrapper.vm.submitting).toBe(false);
    });
  });
});
