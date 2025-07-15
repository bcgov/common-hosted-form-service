import { mount, shallowMount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, vi } from 'vitest';

import AdminVersions from '~/components/admin/AdminVersions.vue';
import * as formComposables from '~/composables/form';
import { useAdminStore } from '~/store/admin';
import { adminService } from '~/services';
import { useNotificationStore } from '~/store/notification';

const STUBS = {
  AdminFormsTable: true,
  AdminUsersTable: true,
  Developer: true,
  FormComponentsProactiveHelp: true,
  Metrics: true,
};

describe('AdminVersions.vue', () => {
  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const adminStore = useAdminStore(pinia);
  const notificationStore = useNotificationStore(pinia);

  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

  beforeEach(() => {
    adminStore.$reset();
    notificationStore.$reset();

    addNotificationSpy.mockReset();
  });

  it('renders', async () => {
    const wrapper = mount(AdminVersions, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('trans.adminVersions.versions');
    expect(wrapper.text()).toContain('trans.adminVersions.status');
    expect(wrapper.text()).toContain('trans.adminVersions.created');
    expect(wrapper.text()).toContain('trans.adminVersions.lastUpdated');
    expect(wrapper.text()).toContain('trans.adminVersions.actions');
  });

  it('versionList returns the versions of the form or an empty array', async () => {
    const wrapper = shallowMount(AdminVersions, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.versionList).toEqual([]);
    adminStore.form = {
      versions: [
        {
          id: '123',
        },
      ],
    };
    expect(wrapper.vm.versionList).toEqual([
      {
        id: '123',
      },
    ]);
  });

  it('onExportClick calls readVersion then exportFormSchema', async () => {
    const exportFormSchemaSpy = vi.spyOn(formComposables, 'exportFormSchema');
    exportFormSchemaSpy.mockImplementationOnce(() => {});
    const wrapper = shallowMount(AdminVersions, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });
    adminStore.form = {
      id: '123',
    };
    const readVersionSpy = vi.spyOn(adminService, 'readVersion');
    readVersionSpy.mockImplementation((formId, versionId) => {
      return {
        data: {
          id: formId,
          schema: {
            id: versionId,
          },
        },
      };
    });

    await wrapper.vm.onExportClick('123', false);

    expect(readVersionSpy).toBeCalledTimes(1);
    expect(wrapper.vm.formSchema).toEqual({
      components: [],
      display: 'form',
      type: 'form',
      id: '123',
    });
    expect(addNotificationSpy).toBeCalledTimes(0);
    expect(exportFormSchemaSpy).toBeCalledTimes(1);
  });

  it('getFormSchema calls readVersion and then sets formSchema', async () => {
    const wrapper = shallowMount(AdminVersions, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });
    adminStore.form = {
      id: '123',
    };
    const readVersionSpy = vi.spyOn(adminService, 'readVersion');
    readVersionSpy.mockImplementation((formId, versionId) => {
      return {
        data: {
          id: formId,
          schema: {
            id: versionId,
          },
        },
      };
    });

    await wrapper.vm.getFormSchema('123');

    expect(readVersionSpy).toBeCalledTimes(1);
    expect(wrapper.vm.formSchema).toEqual({
      components: [],
      display: 'form',
      type: 'form',
      id: '123',
    });
    expect(addNotificationSpy).toBeCalledTimes(0);
  });

  it('if getFormSchema throws an error it will addNotification', async () => {
    const wrapper = shallowMount(AdminVersions, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });
    adminStore.form = {
      id: '123',
    };
    const readVersionSpy = vi.spyOn(adminService, 'readVersion');
    readVersionSpy.mockImplementation(() => {
      throw new Error();
    });

    await wrapper.vm.getFormSchema('123');

    expect(readVersionSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });
});
