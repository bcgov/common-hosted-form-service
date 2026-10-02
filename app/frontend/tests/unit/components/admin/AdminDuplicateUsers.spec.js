import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, vi } from 'vitest';

import AdminDuplicateUsers from '~/components/admin/AdminDuplicateUsers.vue';
import { useAdminStore } from '~/store/admin';

const duplicateUsers = [
  {
    canonicalIdp: 'idir',
    matchType: 'email',
    matchKey: 'duplicate@gov.bc.ca',
    groupSize: 2,
    activeInGroup: 2,
    isResolved: false,
    groupsForThisUser: 1,
    userId: 'user-one',
    username: 'duplicate.one',
    fullName: 'Duplicate One',
    email: 'duplicate@gov.bc.ca',
    idpCode: 'idir',
    stale: false,
    lastActivityAt: '2026-05-01T00:00:00.000Z',
  },
  {
    canonicalIdp: 'idir',
    matchType: 'email',
    matchKey: 'duplicate@gov.bc.ca',
    groupSize: 2,
    activeInGroup: 2,
    isResolved: false,
    groupsForThisUser: 1,
    userId: 'user-two',
    username: 'duplicate.two',
    fullName: 'Duplicate Two',
    email: 'duplicate@gov.bc.ca',
    idpCode: 'azureidir',
    stale: false,
    lastActivityAt: '2025-05-01T00:00:00.000Z',
  },
];

describe('AdminDuplicateUsers.vue', () => {
  let pinia;
  let adminStore;

  beforeEach(() => {
    pinia = createTestingPinia();
    setActivePinia(pinia);
    adminStore = useAdminStore(pinia);
    adminStore.duplicateUserList = duplicateUsers;
    adminStore.getDuplicateUsers.mockResolvedValue();
    adminStore.updateUser.mockResolvedValue();
  });

  it('groups duplicate records and loads them on mount', async () => {
    const wrapper = mount(AdminDuplicateUsers, {
      global: {
        plugins: [pinia],
        mocks: { $filters: { formatDate: (value) => value } },
      },
    });

    await flushPromises();

    expect(adminStore.getDuplicateUsers).toHaveBeenCalledOnce();
    expect(wrapper.vm.duplicateGroups).toHaveLength(1);
    expect(wrapper.vm.duplicateGroups[0].users).toHaveLength(2);
    expect(wrapper.text()).toContain('duplicate@gov.bc.ca');
  });

  it('marks the selected user stale and refreshes the review list', async () => {
    const wrapper = mount(AdminDuplicateUsers, {
      global: {
        plugins: [pinia],
        mocks: { $filters: { formatDate: (value) => value } },
      },
    });
    await flushPromises();
    adminStore.getDuplicateUsers.mockClear();
    wrapper.vm.selectedUser = duplicateUsers[1];

    await wrapper.vm.confirmMarkStale();

    expect(adminStore.updateUser).toHaveBeenCalledWith('user-two', {
      stale: true,
    });
    expect(adminStore.getDuplicateUsers).toHaveBeenCalledOnce();
    expect(wrapper.vm.selectedUser).toBeNull();
  });

  it('paginates duplicate groups without splitting their users', async () => {
    adminStore.duplicateUserList = Array.from({ length: 6 }, (_, index) => ({
      ...duplicateUsers[0],
      matchKey: `duplicate-${index}@gov.bc.ca`,
      userId: `user-${index}`,
    }));
    const wrapper = mount(AdminDuplicateUsers, {
      global: {
        plugins: [pinia],
        mocks: { $filters: { formatDate: (value) => value } },
      },
    });
    await flushPromises();

    expect(wrapper.vm.pageCount).toBe(2);
    expect(wrapper.vm.paginatedGroups).toHaveLength(5);

    wrapper.vm.currentPage = 2;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.paginatedGroups).toHaveLength(1);
    expect(wrapper.vm.paginatedGroups[0].matchKey).toBe(
      'duplicate-5@gov.bc.ca'
    );
  });

  it('resets pagination and open groups when the page size changes', async () => {
    const wrapper = mount(AdminDuplicateUsers, {
      global: {
        plugins: [pinia],
        mocks: { $filters: { formatDate: (value) => value } },
      },
    });
    wrapper.vm.currentPage = 2;
    wrapper.vm.openGroups = ['group'];

    wrapper.vm.updateGroupsPerPage(10);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.groupsPerPage).toBe(10);
    expect(wrapper.vm.currentPage).toBe(1);
    expect(wrapper.vm.openGroups).toEqual([]);
  });
});
