import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { expect } from 'vitest';
import { nextTick } from 'vue';

import AdministerFormsTable from '~/components/admin/AdminFormsTable.vue';
import { useAdminStore } from '~/store/admin';

describe('AdministerFormsTable.vue', () => {
  const CHECKBOX_SHOW_DELETED = '[data-test="checkbox-show-deleted"]';
  const ROUTER_LINK = {
    name: 'RouterLink',
    template: '<div class="router-link-stub"><slot /></div>',
  };

  const pinia = createTestingPinia();
  setActivePinia(pinia);

  it('shows active forms by default', async () => {
    // Arrange
    const store = useAdminStore();
    mount(AdministerFormsTable, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: ROUTER_LINK,
        },
      },
    });

    // Assert
    expect(store.getForms).toHaveBeenCalledTimes(1);
    expect(store.getForms).toHaveBeenLastCalledWith(true);
  });

  it('loads deleted forms after click', async () => {
    // Arrange
    const store = useAdminStore();
    const wrapper = mount(AdministerFormsTable, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: ROUTER_LINK,
        },
      },
    });

    // Act
    const showDeleted = wrapper.findComponent(CHECKBOX_SHOW_DELETED);
    showDeleted.setValue(true);
    await nextTick();

    // Assert
    expect(store.getForms).toHaveBeenCalledTimes(2);
    expect(store.getForms).toHaveBeenLastCalledWith(false);
  });

  it('loads active forms after two clicks', async () => {
    // Arrange
    const store = useAdminStore();
    const wrapper = mount(AdministerFormsTable, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: ROUTER_LINK,
        },
      },
    });

    // Act
    const showDeleted = wrapper.findComponent(CHECKBOX_SHOW_DELETED);
    showDeleted.setValue(true);
    await nextTick();
    showDeleted.setValue(false);
    await nextTick();

    // Assert
    expect(store.getForms).toHaveBeenCalledTimes(3);
    expect(store.getForms).toHaveBeenLastCalledWith(true);
  });
});
