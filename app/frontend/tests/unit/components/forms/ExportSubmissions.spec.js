// @vitest-environment happy-dom
// happy-dom is required to access window.URL
import { createTestingPinia } from '@pinia/testing';
import moment from 'moment';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import getRouter from '~/router';
import ExportSubmissions from '~/components/forms/ExportSubmissions.vue';
import { formService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

import { useAppStore } from '~/store/app';
import { useNotificationStore } from '~/store/notification';
import { ExportLargeData } from '~/utils/constants';


describe('ExportSubmissions.vue', () => {
  const formId = '123-456';

  const pinia = createTestingPinia();

  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const authStore = useAuthStore(pinia);
  const formStore = useFormStore(pinia);

  const appStore = useAppStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
  addNotificationSpy.mockImplementation(() => {});

  beforeEach(() => {
    authStore.$reset();
    formStore.$reset();
    appStore.$reset();
    addNotificationSpy.mockReset();
  });

  it('renders', async () => {
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    formStore.form = {
      name: 'This is a form title',
    };
    fetchFormSpy.mockImplementation(() => {});
    const wrapper = mount(ExportSubmissions, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain(
      'trans.exportSubmissions.exportSubmissionsToFile'
    );
    expect(wrapper.html()).toContain(formStore.form.name);
  });

  it('onMounted, given form versions, if the form is unpublished it should sort formVersions from least to greatest', async () => {
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    formStore.form = {
      name: 'This is a form title',
      versions: [
        {
          version: 1,
        },
        {
          version: 0,
        },
      ],
    };
    fetchFormSpy.mockImplementation(() => {});
    const wrapper = mount(ExportSubmissions, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    await flushPromises();

    expect(wrapper.vm.formVersions).toEqual(['', 0, 1]);
  });

  it('onMounted, given form versions, if the form is published it should sort formVersions from greatest to least', async () => {
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    formStore.form = {
      name: 'This is a form title',
      versions: [
        {
          version: 0,
          published: false,
        },
        {
          version: 1,
          published: true,
        },
      ],
    };
    fetchFormSpy.mockImplementation(() => {});
    const wrapper = mount(ExportSubmissions, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    await flushPromises();

    expect(wrapper.vm.formVersions).toEqual([1, 0]);
  });

  it('callExport should addNotification if an error occurs when calling exportSubmissions', async () => {
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    formStore.form = {
      id: 0,
      name: 'This is a form title',
      versions: [
        {
          version: 0,
          published: true,
        },
      ],
    };
    fetchFormSpy.mockImplementation(() => {});
    const wrapper = mount(ExportSubmissions, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    const exportSubmissionsSpy = vi.spyOn(formService, 'exportSubmissions');
    exportSubmissionsSpy.mockImplementationOnce(() => {
      throw new Error();
    });

    await wrapper.vm.callExport();

    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
  });

  it('callExport should run throw an error if there is no response data', async () => {
    let createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
    createObjectURLSpy.mockImplementation((data) => data);
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    formStore.form = {
      id: 0,
      name: 'This is a form title',
      versions: [
        {
          version: 0,
          published: true,
        },
      ],
      snake: 'filename',
    };
    fetchFormSpy.mockImplementation(() => {});
    const wrapper = mount(ExportSubmissions, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    wrapper.vm.exportFormat = 'csv';
    wrapper.vm.selectedFormFields = [
      { name: 'simpletextfield', value: 'simpletextfield' },
    ];

    await flushPromises();

    const exportSubmissionsSpy = vi.spyOn(formService, 'exportSubmissions');
    exportSubmissionsSpy.mockImplementationOnce(() => {
      return {};
    });

    await wrapper.vm.callExport();

    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
  });

  it('callExport should run successfully', async () => {
    let createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
    createObjectURLSpy.mockImplementation((data) => data);
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    formStore.form = {
      id: 0,
      name: 'This is a form title',
      versions: [
        {
          version: 0,
          published: true,
        },
      ],
      snake: 'filename',
    };
    fetchFormSpy.mockImplementation(() => {});
    const wrapper = mount(ExportSubmissions, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    wrapper.vm.exportFormat = 'csv';
    wrapper.vm.selectedFormFields = [
      { name: 'simpletextfield', value: 'simpletextfield' },
    ];

    await flushPromises();

    const exportSubmissionsSpy = vi.spyOn(formService, 'exportSubmissions');
    exportSubmissionsSpy.mockImplementationOnce(() => {
      return {
        data: {
          simpletextfield: 'some data',
        },
        headers: {
          'content-type': 'text/plain',
        },
      };
    });

    await wrapper.vm.callExport();

    expect(addNotificationSpy).toHaveBeenCalledTimes(0);

    expect(exportSubmissionsSpy).toBeCalledWith(
      0,
      'csv',
      'multiRowEmptySpacesCSVExport',
      0,
      {
        minDate: undefined,
        maxDate: undefined,
      },
      ['simpletextfield'],
      false,
      {
        deleted: false,
        drafts: false,
      }
    );
  });

  it('callExport should run successfully if start and end date are provided, it should choose the start of the start day and the end of the end day', async () => {
    let createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
    createObjectURLSpy.mockImplementation((data) => data);
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    formStore.form = {
      id: 0,
      name: 'This is a form title',
      versions: [
        {
          version: 0,
          published: true,
        },
      ],
      snake: 'filename',
    };
    fetchFormSpy.mockImplementation(() => {});
    const wrapper = mount(ExportSubmissions, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    wrapper.vm.exportFormat = 'csv';
    wrapper.vm.selectedFormFields = [
      { name: 'simpletextfield', value: 'simpletextfield' },
    ];

    await flushPromises();

    const exportSubmissionsSpy = vi.spyOn(formService, 'exportSubmissions');
    exportSubmissionsSpy.mockImplementationOnce(() => {
      return {
        data: {
          simpletextfield: 'some data',
        },
        headers: {
          'content-type': 'text/plain',
        },
      };
    });

    wrapper.vm.dateRange = true;
    wrapper.vm.startDate = moment(new Date('2024-07-25')).format('YYYY-MM-DD');
    // needed because the watch value will reset endDate if startDate is set
    await flushPromises();
    wrapper.vm.endDate = moment(new Date('2024-07-26')).format('YYYY-MM-DD');

    await wrapper.vm.callExport();

    expect(exportSubmissionsSpy).toBeCalledWith(
      0,
      'csv',
      'multiRowEmptySpacesCSVExport',
      0,
      {
        minDate: moment(wrapper.vm.startDate, 'YYYY-MM-DD hh:mm:ss')
          .utc()
          .format(),
        maxDate: moment(`${wrapper.vm.endDate} 23:59:59`, 'YYYY-MM-DD hh:mm:ss')
          .utc()
          .format(),
      },
      ['simpletextfield'],
      false,
      {
        deleted: false,
        drafts: false,
      }
    );
  });

  it('callExport should addNotification that an email has been sent that export is in progress if the submissions exceed the max number of records or formFields exceed the max number of fields', async () => {
    authStore.keycloak = {
      tokenParsed: {
        email: 'email@email.com',
        name: 'lucy',
      },
      userName: 'userName',
      token: 'token',
      fullName: 'fullName',
    };
    let createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
    createObjectURLSpy.mockImplementation((data) => data);
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    formStore.form = {
      id: 0,
      name: 'This is a form title',
      versions: [
        {
          version: 0,
          published: true,
        },
      ],
      snake: 'filename',
    };
    fetchFormSpy.mockImplementation(() => {});
    const wrapper = mount(ExportSubmissions, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    wrapper.vm.exportFormat = 'csv';
    wrapper.vm.selectedFormFields = [
      { name: 'simpletextfield', value: 'simpletextfield' },
    ];

    await flushPromises();

    const exportSubmissionsSpy = vi.spyOn(formService, 'exportSubmissions');
    exportSubmissionsSpy.mockImplementationOnce(() => {
      return {
        data: {
          simpletextfield: 'some data',
        },
        headers: {
          'content-type': 'text/plain',
        },
      };
    });

    for (let i = 0; i < ExportLargeData.MAX_RECORDS + 1; i++) {
      formStore.submissionList.push({ id: i });
    }
    await wrapper.vm.callExport();
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      color: 'success',
      icon: 'mdi:mdi-check-circle',
      text: 'trans.exportSubmissions.emailSentMsg',
      timeout: 20,
      title: 'trans.exportSubmissions.exportInProgress',
      type: 'success',
    });
    addNotificationSpy.mockReset();
    formStore.submissionList = [];
    formStore.formFields = [];

    for (let i = 0; i < ExportLargeData.MAX_FIELDS + 1; i++) {
      formStore.formFields.push(`simpletextfield_${1}`);
    }
    await wrapper.vm.callExport();
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      color: 'success',
      icon: 'mdi:mdi-check-circle',
      text: 'trans.exportSubmissions.emailSentMsg',
      timeout: 20,
      title: 'trans.exportSubmissions.exportInProgress',
      type: 'success',
    });
    addNotificationSpy.mockReset();
    formStore.submissionList = [];
    formStore.formFields = [];
  });

  it('changeVersions should call fetchFormFields.. or fetchFormCSVExportFields', async () => {
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    formStore.form = {
      id: 0,
      name: 'This is a form title',
      versions: [
        {
          version: 0,
          published: true,
        },
      ],
      snake: 'filename',
    };
    fetchFormSpy.mockImplementation(() => {});
    const wrapper = mount(ExportSubmissions, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    await flushPromises();

    const fetchFormCSVExportFieldsSpy = vi.spyOn(
      formStore,
      'fetchFormCSVExportFields'
    );
    fetchFormCSVExportFieldsSpy.mockImplementationOnce(() => {
      return {};
    });

    await wrapper.vm.changeVersions(0);

    expect(fetchFormCSVExportFieldsSpy).toBeCalledTimes(1);
  });
});
