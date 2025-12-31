import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, vi } from 'vitest';

import ExternalAPIs from '~/components/forms/manage/ExternalAPIs.vue';
import { formService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const STUBS = {
  VTooltip: {
    name: 'VTooltip',
    template: '<div class="v-tooltip-stub"><slot /></div>',
  },
  VBtn: {
    template: '<div class="v-btn-stub"><slot /></div>',
  },
  VIcon: {
    template: '<div class="v-icon-stub"><slot /></div>',
  },
  VDataTableServer: {
    template: '<div class="v-data-table-server"><slot /></div>',
    props: ['items', 'options', 'serverItemsLength', 'loading', 'pagination'],
  },
  VForm: {
    template: '<div class="v-form-stub"><slot /></div>',
  },
  VRow: {
    template: '<div class="v-row-stub"><slot /></div>',
  },
  VCol: {
    template: '<div class="v-col-stub"><slot /></div>',
  },
  VTextField: {
    template: '<div class="v-text-field-stub"><slot /></div>',
  },
  VCheckbox: {
    template: '<div class="v-checkbox-stub"><slot /></div>',
  },
  VSelect: {
    template: '<div class="v-select-stub"><slot /></div>',
  },
};

const formId = '123';

describe('ExternalAPIs.vue', () => {
  let pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
  const externalAPIListSpy = vi.spyOn(formService, 'externalAPIList');
  const externalAPIStatusCodesSpy = vi.spyOn(
    formService,
    'externalAPIStatusCodes'
  );

  beforeEach(() => {
    formStore.$reset();
    notificationStore.$reset();
    addNotificationSpy.mockReset();
    externalAPIListSpy.mockReset();
    externalAPIStatusCodesSpy.mockReset();
  });

  it('renders', async () => {
    externalAPIListSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = mount(ExternalAPIs, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('trans.externalAPI.info');
  });

  it('fetchExternalAPIs should call externalAPIList successfully then put the results in items', async () => {
    externalAPIListSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = mount(ExternalAPIs, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();
    externalAPIListSpy.mockReset();
    externalAPIListSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            id: '662c0f7f-aed8-4499-92c2-b6d5d886b624',
            formId: '91ccadc1-246e-42fe-a10b-1af2bd48d925',
            name: 'TEST ENDPOINT',
            endpointUrl: 'http://test.com',
            code: 'SUBMITTED',
            sendApiKey: true,
            apiKeyHeader: 'HEADER',
            apiKey: 'KEY VALUE',
            allowSendUserToken: false,
            sendUserToken: false,
            userTokenHeader: null,
            userTokenBearer: false,
            sendUserInfo: true,
            createdBy: 'JACHUNG@idir',
            createdAt: '2024-11-21T18:51:13.897Z',
            updatedBy: null,
            updatedAt: '2024-11-21T18:51:13.898Z',
          },
        ],
      };
    });

    await wrapper.vm.fetchExternalAPIs(formId);

    expect(externalAPIListSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
    expect(wrapper.vm.items).toEqual([
      {
        id: '662c0f7f-aed8-4499-92c2-b6d5d886b624',
        formId: '91ccadc1-246e-42fe-a10b-1af2bd48d925',
        name: 'TEST ENDPOINT',
        endpointUrl: 'http://test.com',
        code: 'SUBMITTED',
        sendApiKey: true,
        apiKeyHeader: 'HEADER',
        apiKey: 'KEY VALUE',
        allowSendUserToken: false,
        sendUserToken: false,
        userTokenHeader: null,
        userTokenBearer: false,
        sendUserInfo: true,
        createdBy: 'JACHUNG@idir',
        createdAt: '2024-11-21T18:51:13.897Z',
        updatedBy: null,
        updatedAt: '2024-11-21T18:51:13.898Z',
      },
    ]);
  });

  it('fetchExternalAPIs should addNotification if an error occurs', async () => {
    externalAPIListSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = mount(ExternalAPIs, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();
    externalAPIListSpy.mockReset();
    externalAPIListSpy.mockImplementationOnce(() => {
      throw new Error('Error fetching external APIs');
    });

    await wrapper.vm.fetchExternalAPIs(formId);

    expect(externalAPIListSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('getExternalAPIStatusCodes should call externalAPIStatusCodes successfully then put the results in externalAPIStatusCodes', async () => {
    externalAPIListSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = mount(ExternalAPIs, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();
    externalAPIStatusCodesSpy.mockReset();
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [
          {
            code: 'SUBMITTED',
            display: 'Submitted',
            createdBy: 'migration-046',
            createdAt: '2024-09-09T21:06:32.334Z',
            updatedBy: null,
            updatedAt: '2024-09-09T21:06:32.334Z',
          },
          {
            code: 'PENDING',
            display: 'Pending',
            createdBy: 'migration-046',
            createdAt: '2024-09-09T21:06:32.334Z',
            updatedBy: null,
            updatedAt: '2024-09-09T21:06:32.334Z',
          },
          {
            code: 'APPROVED',
            display: 'Approved',
            createdBy: 'migration-046',
            createdAt: '2024-09-09T21:06:32.334Z',
            updatedBy: null,
            updatedAt: '2024-09-09T21:06:32.334Z',
          },
          {
            code: 'DENIED',
            display: 'Denied',
            createdBy: 'migration-046',
            createdAt: '2024-09-09T21:06:32.334Z',
            updatedBy: null,
            updatedAt: '2024-09-09T21:06:32.334Z',
          },
        ],
      };
    });

    await wrapper.vm.getExternalAPIStatusCodes();

    expect(externalAPIListSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(0);
    expect(wrapper.vm.externalAPIStatusCodes).toEqual([
      {
        code: 'SUBMITTED',
        display: 'Submitted',
        createdBy: 'migration-046',
        createdAt: '2024-09-09T21:06:32.334Z',
        updatedBy: null,
        updatedAt: '2024-09-09T21:06:32.334Z',
      },
      {
        code: 'PENDING',
        display: 'Pending',
        createdBy: 'migration-046',
        createdAt: '2024-09-09T21:06:32.334Z',
        updatedBy: null,
        updatedAt: '2024-09-09T21:06:32.334Z',
      },
      {
        code: 'APPROVED',
        display: 'Approved',
        createdBy: 'migration-046',
        createdAt: '2024-09-09T21:06:32.334Z',
        updatedBy: null,
        updatedAt: '2024-09-09T21:06:32.334Z',
      },
      {
        code: 'DENIED',
        display: 'Denied',
        createdBy: 'migration-046',
        createdAt: '2024-09-09T21:06:32.334Z',
        updatedBy: null,
        updatedAt: '2024-09-09T21:06:32.334Z',
      },
    ]);
  });

  it('getExternalAPIStatusCodes should addNotification if an error occurs', async () => {
    externalAPIListSpy.mockImplementationOnce(() => {
      return {
        data: [],
      };
    });
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = mount(ExternalAPIs, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();
    externalAPIStatusCodesSpy.mockReset();
    externalAPIStatusCodesSpy.mockImplementationOnce(() => {
      throw new Error('Error fetching external API status codes');
    });

    await wrapper.vm.getExternalAPIStatusCodes();

    expect(externalAPIListSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
  });

  it('handleDelete should call externalAPIDelete and addNotification with a success message', async () => {
    const externalAPIDeleteSpy = vi.spyOn(formService, 'externalAPIDelete');

    addNotificationSpy.mockImplementation(() => {});
    externalAPIDeleteSpy.mockImplementation(() => {
      return {};
    });
    externalAPIListSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(ExternalAPIs, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.handleDelete({});

    expect(externalAPIDeleteSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      color: 'success',
      icon: 'mdi:mdi-check-circle',
      text: 'trans.externalAPI.deleteSuccess',
      type: 'success',
    });
  });

  it('handleDelete should call externalAPIDelete and addNotification with a success message', async () => {
    const externalAPIDeleteSpy = vi.spyOn(formService, 'externalAPIDelete');

    addNotificationSpy.mockImplementation(() => {});
    externalAPIDeleteSpy.mockImplementation(() => {
      throw new Error('Error deleting external API');
    });
    externalAPIListSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(ExternalAPIs, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.handleDelete({});

    expect(externalAPIDeleteSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      consoleError: 'trans.externalAPI.deleteError',
      text: 'trans.externalAPI.deleteError',
    });
  });

  it('saveItem should call externalAPIUpdate if the user is editing', async () => {
    const externalAPIUpdateSpy = vi.spyOn(formService, 'externalAPIUpdate');

    addNotificationSpy.mockImplementation(() => {});
    externalAPIUpdateSpy.mockImplementation(() => {
      return {};
    });
    externalAPIListSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(ExternalAPIs, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    const validate = vi.fn();

    wrapper.vm.externalApisForm = {
      validate: validate,
    };

    validate.mockImplementationOnce(() => {
      return {
        valid: true,
      };
    });

    wrapper.vm.editDialog = {
      item: {
        id: 123,
      },
    };

    await wrapper.vm.saveItem();

    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      color: 'success',
      icon: 'mdi:mdi-check-circle',
      text: 'trans.externalAPI.editSuccess',
      type: 'success',
    });
    expect(externalAPIUpdateSpy).toBeCalledTimes(1);
  });

  it('saveItem should call externalAPICreate when not editing', async () => {
    const externalAPICreateSpy = vi.spyOn(formService, 'externalAPICreate');

    addNotificationSpy.mockImplementation(() => {});
    externalAPICreateSpy.mockImplementation(() => {
      return {};
    });
    externalAPIListSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(ExternalAPIs, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    const validate = vi.fn();

    wrapper.vm.externalApisForm = {
      validate: validate,
    };

    validate.mockImplementationOnce(() => {
      return {
        valid: true,
      };
    });

    wrapper.vm.editDialog = {
      item: {
        id: 0,
      },
    };

    await wrapper.vm.saveItem();

    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      color: 'success',
      icon: 'mdi:mdi-check-circle',
      text: 'trans.externalAPI.createSuccess',
      type: 'success',
    });
    expect(externalAPICreateSpy).toBeCalledTimes(1);
  });

  it('saveItem should call addNotification with createError if not editing', async () => {
    const externalAPIUpdateSpy = vi.spyOn(formService, 'externalAPIUpdate');

    addNotificationSpy.mockImplementation(() => {});
    externalAPIUpdateSpy.mockImplementation(() => {
      throw new Error('Error updating external API');
    });
    externalAPIListSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(ExternalAPIs, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    const validate = vi.fn();

    wrapper.vm.externalApisForm = {
      validate: validate,
    };

    validate.mockImplementationOnce(() => {
      return {
        valid: true,
      };
    });

    wrapper.vm.editDialog = {
      item: {
        id: 123,
      },
    };

    await wrapper.vm.saveItem();

    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      consoleError: 'trans.externalAPI.editError',
      text: 'trans.externalAPI.editError',
    });
  });

  it('saveItem should give the editError notification if editing', async () => {
    const externalAPICreateSpy = vi.spyOn(formService, 'externalAPICreate');

    addNotificationSpy.mockImplementation(() => {});
    externalAPICreateSpy.mockImplementation(() => {
      throw new Error(' Error creating external API');
    });
    externalAPIListSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    externalAPIStatusCodesSpy.mockImplementation(() => {
      return {
        data: [],
      };
    });
    const wrapper = shallowMount(ExternalAPIs, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    addNotificationSpy.mockReset();

    const validate = vi.fn();

    wrapper.vm.externalApisForm = {
      validate: validate,
    };

    validate.mockImplementationOnce(() => {
      return {
        valid: true,
      };
    });

    wrapper.vm.editDialog = {
      item: {
        id: 0,
      },
    };

    await wrapper.vm.saveItem();

    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      consoleError: 'trans.externalAPI.createError',
      text: 'trans.externalAPI.createError',
    });
  });
});
