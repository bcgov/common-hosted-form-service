import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { expect } from 'vitest';
import { nextTick } from 'vue';
import AdminAPIsTable from '~/components/admin/AdminAPIsTable.vue';
import { useAdminStore } from '~/store/admin';

describe('AdminAPIsTable.vue', () => {
  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const adminStore = useAdminStore(pinia);

  beforeEach(() => {
    adminStore.$reset();
  });

  it('fetches existing apis by default', async () => {
    adminStore.getExternalAPIs.mockImplementation(() => {
      return [];
    });
    adminStore.getExternalAPIStatusCodes.mockImplementation(() => {
      return [];
    });
    mount(AdminAPIsTable, {
      props: {},
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });
    await nextTick();
    // Assert
    expect(adminStore.getExternalAPIs).toHaveBeenCalledTimes(1);
    expect(adminStore.getExternalAPIStatusCodes).toHaveBeenCalledTimes(1);
  });
});
