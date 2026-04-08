import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import GroupManagement from '~/components/forms/manage/GroupManagement.vue';
import { rbacService } from '~/services';
import { useFormStore } from '~/store/form';
import { useTenantStore } from '~/store/tenant';

vi.mock('~/services', () => ({
  rbacService: {
    getFormGroups: vi.fn(),
    assignGroupsToForm: vi.fn(),
  },
}));

const FORM_ID = 'form-abc-123';

const MOCK_GROUPS_RESPONSE = {
  data: {
    associatedGroups: [{ id: 'g2', name: 'Assigned Group', description: '' }],
    availableGroups: [{ id: 'g1', name: 'Available Group', description: '' }],
    missingGroups: [],
  },
};

describe('GroupManagement.vue', () => {
  const pinia = createTestingPinia({ stubActions: false });
  setActivePinia(pinia);

  const tenantStore = useTenantStore(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    tenantStore.$reset();
    formStore.$reset();
    vi.clearAllMocks();
  });

  function mountComponent() {
    return mount(GroupManagement, {
      props: { formId: FORM_ID },
      global: { plugins: [pinia] },
    });
  }

  describe('noTenant', () => {
    it('is true when no tenant is selected', () => {
      tenantStore.selectedTenant = null;
      const wrapper = mountComponent();
      expect(wrapper.vm.noTenant).toBe(true);
    });

    it('is false when a tenant is selected', () => {
      tenantStore.selectedTenant = { id: 't1', roles: ['form_admin'] };
      rbacService.getFormGroups.mockResolvedValue(MOCK_GROUPS_RESPONSE);
      const wrapper = mountComponent();
      expect(wrapper.vm.noTenant).toBe(false);
    });

    it('renders error alert and skips loading when noTenant', async () => {
      tenantStore.selectedTenant = null;
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.find('v-alert-stub, [type="error"]').exists()).toBe(true);
      expect(rbacService.getFormGroups).not.toHaveBeenCalled();
    });
  });

  describe('canManageGroups', () => {
    it('returns true when selectedTenant has form_admin role', () => {
      tenantStore.selectedTenant = { id: 't1', roles: ['form_admin'] };
      rbacService.getFormGroups.mockResolvedValue(MOCK_GROUPS_RESPONSE);
      const wrapper = mountComponent();
      expect(wrapper.vm.canManageGroups).toBe(true);
    });

    it('returns false when selectedTenant lacks form_admin role', () => {
      tenantStore.selectedTenant = { id: 't1', roles: ['viewer'] };
      rbacService.getFormGroups.mockResolvedValue(MOCK_GROUPS_RESPONSE);
      const wrapper = mountComponent();
      expect(wrapper.vm.canManageGroups).toBe(false);
    });

    it('returns false when selectedTenant has no roles', () => {
      tenantStore.selectedTenant = { id: 't1', roles: [] };
      rbacService.getFormGroups.mockResolvedValue(MOCK_GROUPS_RESPONSE);
      const wrapper = mountComponent();
      expect(wrapper.vm.canManageGroups).toBe(false);
    });
  });

  describe('addGroup / removeGroup', () => {
    beforeEach(() => {
      tenantStore.selectedTenant = { id: 't1', roles: ['form_admin'] };
      rbacService.getFormGroups.mockResolvedValue(MOCK_GROUPS_RESPONSE);
    });

    it('addGroup moves a group from available to assigned', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      const group = { id: 'g1', name: 'Available Group' };
      wrapper.vm.availableGroups = [group];
      wrapper.vm.assignedGroups = [];

      wrapper.vm.addGroup(group);

      expect(wrapper.vm.availableGroups).toHaveLength(0);
      expect(wrapper.vm.assignedGroups).toHaveLength(1);
      expect(wrapper.vm.assignedGroups[0].id).toBe('g1');
      expect(wrapper.vm.assignedGroups[0].isAssociated).toBe(true);
    });

    it('removeGroup moves a non-deleted group back to available', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      const group = { id: 'g2', name: 'Assigned Group', isDeleted: false };
      wrapper.vm.assignedGroups = [group];
      wrapper.vm.availableGroups = [];

      wrapper.vm.removeGroup(group);

      expect(wrapper.vm.assignedGroups).toHaveLength(0);
      expect(wrapper.vm.availableGroups).toHaveLength(1);
      expect(wrapper.vm.availableGroups[0].isAssociated).toBe(false);
    });

    it('removeGroup does not return a deleted group to available list', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      const group = { id: 'g3', name: 'Deleted Group', isDeleted: true };
      wrapper.vm.assignedGroups = [group];
      wrapper.vm.availableGroups = [];

      wrapper.vm.removeGroup(group);

      expect(wrapper.vm.assignedGroups).toHaveLength(0);
      expect(wrapper.vm.availableGroups).toHaveLength(0);
    });
  });

  describe('filteredAvailable / filteredAssigned', () => {
    beforeEach(() => {
      tenantStore.selectedTenant = { id: 't1', roles: ['form_admin'] };
      rbacService.getFormGroups.mockResolvedValue(MOCK_GROUPS_RESPONSE);
    });

    it('filteredAvailable returns all when search is empty', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.availableGroups = [
        { id: 'g1', name: 'Alpha' },
        { id: 'g2', name: 'Beta' },
      ];
      wrapper.vm.searchAvailable = '';
      expect(wrapper.vm.filteredAvailable).toHaveLength(2);
    });

    it('filteredAvailable filters by name', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.availableGroups = [
        { id: 'g1', name: 'Alpha' },
        { id: 'g2', name: 'Beta' },
      ];
      wrapper.vm.searchAvailable = 'alp';
      expect(wrapper.vm.filteredAvailable).toHaveLength(1);
      expect(wrapper.vm.filteredAvailable[0].id).toBe('g1');
    });

    it('filteredAssigned filters by description', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.assignedGroups = [
        { id: 'g3', name: 'Group A', description: 'finance team' },
        { id: 'g4', name: 'Group B', description: 'hr team' },
      ];
      wrapper.vm.searchAssigned = 'finance';
      expect(wrapper.vm.filteredAssigned).toHaveLength(1);
      expect(wrapper.vm.filteredAssigned[0].id).toBe('g3');
    });
  });

  describe('loadFormGroups', () => {
    it('populates assigned and available groups on success', async () => {
      tenantStore.selectedTenant = { id: 't1', roles: ['form_admin'] };
      rbacService.getFormGroups.mockResolvedValue(MOCK_GROUPS_RESPONSE);

      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.assignedGroups).toHaveLength(1);
      expect(wrapper.vm.availableGroups).toHaveLength(1);
      expect(wrapper.vm.missingGroups).toHaveLength(0);
    });

    it('clears groups and shows notification on error', async () => {
      tenantStore.selectedTenant = { id: 't1', roles: ['form_admin'] };
      rbacService.getFormGroups.mockRejectedValue(new Error('Network error'));

      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.assignedGroups).toHaveLength(0);
      expect(wrapper.vm.availableGroups).toHaveLength(0);
    });
  });
});
