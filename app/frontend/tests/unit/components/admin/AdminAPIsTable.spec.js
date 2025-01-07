import { createTestingPinia } from '@pinia/testing';
import { mount, shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { expect, vi } from 'vitest';
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

  it('items should map out ministry names', async () => {
    adminStore.getExternalAPIs.mockImplementation(() => {
      return [];
    });
    adminStore.getExternalAPIStatusCodes.mockImplementation(() => {
      return [];
    });
    const wrapper = shallowMount(AdminAPIsTable, {
      props: {},
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });
    await nextTick();

    wrapper.vm.externalAPIList = [
      {
        id: '3dc311e1-a1bc-4f8c-9cd3-6f03062a561e',
        formId: '00329319-f1da-45c7-a956-9c765dcf36d1',
        ministry: 'AF',
        formName: 'Test Form',
        name: 'test',
        endpointUrl: 'google.com',
        code: 'APPROVED',
        display: 'Approved',
        allowSendUserToken: true,
        sendApiKey: true,
      },
    ];

    expect(wrapper.vm.items).toEqual([
      {
        id: '3dc311e1-a1bc-4f8c-9cd3-6f03062a561e',
        formId: '00329319-f1da-45c7-a956-9c765dcf36d1',
        ministry: 'AF',
        ministryName: 'trans.ministries.AF',
        formName: 'Test Form',
        name: 'test',
        endpointUrl: 'google.com',
        code: 'APPROVED',
        display: 'Approved',
        allowSendUserToken: true,
        sendApiKey: true,
      },
    ]);
  });

  it('resetEditDialog should reset the values of editDialog', async () => {
    adminStore.getExternalAPIs.mockImplementation(() => {
      return [];
    });
    adminStore.getExternalAPIStatusCodes.mockImplementation(() => {
      return [];
    });
    const wrapper = shallowMount(AdminAPIsTable, {
      props: {},
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });
    await nextTick();

    wrapper.vm.editDialog = {
      title: 'test',
      item: {
        id: 1,
        formName: 'null',
        ministry: 'null',
        name: 'null',
        endpointUrl: 'null',
        code: 'null',
        allowSendUserToken: true,
        sendApiKey: true,
      },
      show: true,
    };

    wrapper.vm.resetEditDialog();

    expect(wrapper.vm.editDialog).toEqual({
      title: '',
      item: {
        id: null,
        formName: null,
        ministry: null,
        name: null,
        endpointUrl: null,
        code: null,
        allowSendUserToken: false,
        sendApiKey: false,
      },
      show: false,
    });
  });

  it('handleEdit calls resetEditDialog and then sets the values to what was passed in', async () => {
    adminStore.getExternalAPIs.mockImplementation(() => {
      return [];
    });
    adminStore.getExternalAPIStatusCodes.mockImplementation(() => {
      return [];
    });
    const wrapper = shallowMount(AdminAPIsTable, {
      props: {},
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });
    await nextTick();

    wrapper.vm.editDialog = {
      title: 'test',
      item: {
        id: 1,
        formName: 'null',
        ministry: 'null',
        name: 'null',
        endpointUrl: 'null',
        code: 'null',
        allowSendUserToken: true,
        sendApiKey: true,
      },
      show: true,
    };

    wrapper.vm.handleEdit({
      ministry: 'AF',
    });

    expect(wrapper.vm.editDialog).toEqual({
      title: 'trans.adminAPIsTable.editTitle',
      item: {
        ministry: 'AF',
        ministryText: 'trans.ministries.AF',
      },
      show: true,
    });
  });

  it('handleEdit calls resetEditDialog and then sets the values to what was passed in', async () => {
    adminStore.getExternalAPIs.mockImplementation(() => {
      return [];
    });
    adminStore.getExternalAPIStatusCodes.mockImplementation(() => {
      return [];
    });
    const wrapper = shallowMount(AdminAPIsTable, {
      props: {},
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });
    await nextTick();

    wrapper.vm.editDialog = {
      title: 'test',
      item: {
        id: 1,
        formName: 'null',
        ministry: 'null',
        name: 'null',
        endpointUrl: 'null',
        code: 'null',
        allowSendUserToken: true,
        sendApiKey: true,
      },
      show: true,
    };

    wrapper.vm.handleEdit({
      ministry: 'AF',
    });

    expect(wrapper.vm.editDialog).toEqual({
      title: 'trans.adminAPIsTable.editTitle',
      item: {
        ministry: 'AF',
        ministryText: 'trans.ministries.AF',
      },
      show: true,
    });
  });

  it('getMinistryName should return the translation for the ministry in the item or an empty string', async () => {
    adminStore.getExternalAPIs.mockImplementation(() => {});
    adminStore.updateExternalAPI.mockImplementation(() => {});

    const wrapper = shallowMount(AdminAPIsTable, {
      props: {},
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });
    await nextTick();

    expect(wrapper.vm.getMinistryName({ ministry: 'CITZ' })).toEqual(
      'trans.ministries.CITZ'
    );
    expect(wrapper.vm.getMinistryName()).toEqual('');
  });

  it('saveItem should call updateExternalAPI and getExternalAPIs', async () => {
    adminStore.getExternalAPIs.mockImplementation(() => {});
    adminStore.updateExternalAPI.mockImplementation(() => {});

    const wrapper = shallowMount(AdminAPIsTable, {
      props: {},
      global: {
        plugins: [pinia],
        stubs: {},
      },
    });
    await nextTick();

    const updateExternalAPISpy = vi.spyOn(adminStore, 'updateExternalAPI');
    updateExternalAPISpy.mockImplementation(() => {});
    const getExternalAPIsSpy = vi.spyOn(adminStore, 'getExternalAPIs');
    getExternalAPIsSpy.mockImplementation(() => {});

    await wrapper.vm.saveItem();
    expect(updateExternalAPISpy).toBeCalledTimes(1);
    expect(getExternalAPIsSpy).toBeCalledTimes(1);
  });
});
