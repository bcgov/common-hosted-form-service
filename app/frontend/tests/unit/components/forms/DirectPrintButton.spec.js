// @vitest-environment happy-dom
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DirectPrintButton from '~/components/forms/DirectPrintButton.vue';
import * as printOptionsComposables from '~/composables/printOptions';
import { formService, utilsService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import * as transformUtils from '~/utils/transformUtils';

const STUBS = {
  VTooltip: {
    template: '<div class="v-tooltip-stub"><slot /></div>',
  },
  VBtn: {
    template: '<div class="v-btn-stub"><slot /></div>',
  },
  VIcon: {
    template: '<div class="v-icon-stub"></div>',
  },
};

function createPrintConfig(overrides = {}) {
  return {
    code: 'direct',
    templateId: 'test-template-id',
    outputFileType: 'pdf',
    reportName: null,
    reportNameOption: 'formName',
    ...overrides,
  };
}

function createMountOptions(piniaInstance, props = {}) {
  return {
    props: {
      submissionId: 'test-submission-id',
      printConfig: createPrintConfig(),
      ...props,
    },
    global: {
      plugins: [piniaInstance],
      stubs: STUBS,
    },
  };
}

function createTemplateResponse() {
  return {
    data: {
      template: {
        data: [65, 66, 67],
      },
      filename: 'test-template.docx',
    },
  };
}

function createDocGenResponse(filename = 'test.pdf') {
  return {
    headers: {
      'content-disposition': `attachment; filename="${filename}"`,
    },
    data: new Blob(['test'], { type: 'application/pdf' }),
  };
}

function setupCommonMocks() {
  const documentTemplateReadSpy = vi
    .spyOn(formService, 'documentTemplateRead')
    .mockResolvedValue(createTemplateResponse());

  const splitFileNameSpy = vi.spyOn(transformUtils, 'splitFileName');
  splitFileNameSpy.mockReturnValue({
    name: 'test-template',
    extension: 'docx',
  });

  const getDispositionSpy = vi.spyOn(transformUtils, 'getDisposition');
  getDispositionSpy.mockReturnValue('test.pdf');

  const createDownloadSpy = vi.spyOn(printOptionsComposables, 'createDownload');
  createDownloadSpy.mockImplementation(() => {});

  return {
    documentTemplateReadSpy,
    splitFileNameSpy,
    getDispositionSpy,
    createDownloadSpy,
  };
}

function createDelayedTemplateResponse(delay = 100) {
  const templateData = {
    data: {
      template: { data: [65] },
      filename: 'test.docx',
    },
  };

  const resolveAfterDelay = (resolve) => {
    setTimeout(() => {
      resolve(templateData);
    }, delay);
  };

  return new Promise(resolveAfterDelay);
}

describe('DirectPrintButton.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
  addNotificationSpy.mockImplementation(() => {});

  beforeEach(() => {
    formStore.$reset();
    notificationStore.$reset();
    addNotificationSpy.mockReset();
    vi.clearAllMocks();
  });

  it('renders', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const mountOptions = createMountOptions(pinia);
    const wrapper = mount(DirectPrintButton, mountOptions);

    await flushPromises();

    expect(wrapper.html()).toMatch('v-tooltip-stub');
  });

  it('generates direct print successfully with submissionId', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const mocks = setupCommonMocks();
    const docGenSpy = vi
      .spyOn(formService, 'docGen')
      .mockResolvedValue(createDocGenResponse());

    const mountOptions = createMountOptions(pinia);
    const wrapper = mount(DirectPrintButton, mountOptions);

    await flushPromises();
    await wrapper.vm.generateDirectPrint();

    expect(mocks.documentTemplateReadSpy).toHaveBeenCalledWith(
      'test-form-id',
      'test-template-id'
    );
    expect(docGenSpy).toHaveBeenCalledTimes(1);
    const docGenCall = docGenSpy.mock.calls[0];
    expect(docGenCall[1].options.reportName).toBe('Test Form');
    expect(mocks.createDownloadSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'trans.printOptions.docGrnSucess',
      })
    );
  });

  it('generates direct print successfully with draft submission', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const mocks = setupCommonMocks();
    const draftDocGenSpy = vi
      .spyOn(utilsService, 'draftDocGen')
      .mockResolvedValue(createDocGenResponse());

    const mountOptions = createMountOptions(pinia, {
      submissionId: '',
      submission: { test: 'data' },
    });
    const wrapper = mount(DirectPrintButton, mountOptions);

    await flushPromises();
    await wrapper.vm.generateDirectPrint();

    expect(mocks.documentTemplateReadSpy).toHaveBeenCalledWith(
      'test-form-id',
      'test-template-id'
    );
    expect(draftDocGenSpy).toHaveBeenCalledTimes(1);
    expect(mocks.createDownloadSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'trans.printOptions.docGrnSucess',
      })
    );
  });

  it('handles error during print generation', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    vi.spyOn(formService, 'documentTemplateRead').mockRejectedValue(
      new Error('Test error')
    );

    const mountOptions = createMountOptions(pinia);
    const wrapper = mount(DirectPrintButton, mountOptions);

    await flushPromises();
    await wrapper.vm.generateDirectPrint();

    expect(addNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'trans.printOptions.failedDocGenErrMsg',
      })
    );
  });

  it('shows loading state during generation', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    vi.spyOn(formService, 'documentTemplateRead').mockImplementation(
      createDelayedTemplateResponse
    );

    const mountOptions = createMountOptions(pinia);
    const wrapper = mount(DirectPrintButton, mountOptions);

    await flushPromises();

    const generatePromise = wrapper.vm.generateDirectPrint();
    expect(wrapper.vm.loading).toBe(true);

    await generatePromise;
    await flushPromises();

    expect(wrapper.vm.loading).toBe(false);
  });

  it('uses custom reportName when reportNameOption is custom', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const mocks = setupCommonMocks();
    mocks.getDispositionSpy.mockReturnValue('custom-name.pdf');

    const docGenSpy = vi
      .spyOn(formService, 'docGen')
      .mockResolvedValue(createDocGenResponse('custom-name.pdf'));

    const printConfig = createPrintConfig({
      reportName: 'Custom Report Name',
      reportNameOption: 'custom',
    });
    const mountOptions = createMountOptions(pinia, { printConfig });
    const wrapper = mount(DirectPrintButton, mountOptions);

    await flushPromises();
    await wrapper.vm.generateDirectPrint();

    const docGenCall = docGenSpy.mock.calls[0];
    expect(docGenCall[1].options.reportName).toBe('Custom Report Name');
  });

  it('uses form name only when reportNameOption is formName', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    setupCommonMocks();
    const docGenSpy = vi
      .spyOn(formService, 'docGen')
      .mockResolvedValue(createDocGenResponse());

    const mountOptions = createMountOptions(pinia);
    const wrapper = mount(DirectPrintButton, mountOptions);

    await flushPromises();
    await wrapper.vm.generateDirectPrint();

    const docGenCall = docGenSpy.mock.calls[0];
    expect(docGenCall[1].options.reportName).toBe('Test Form');
  });

  it('fetches form when form name is missing', async () => {
    formStore.form = {
      id: 'test-form-id',
      // name is missing
    };

    setupCommonMocks();
    const docGenSpy = vi
      .spyOn(formService, 'docGen')
      .mockResolvedValue(createDocGenResponse());

    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    const updateFormAfterFetch = () => {
      formStore.form = {
        id: 'test-form-id',
        name: 'Fetched Form Name',
      };
      return Promise.resolve();
    };
    fetchFormSpy.mockImplementation(updateFormAfterFetch);

    const mountOptions = createMountOptions(pinia);
    const wrapper = mount(DirectPrintButton, mountOptions);

    await flushPromises();
    await wrapper.vm.generateDirectPrint();

    expect(fetchFormSpy).toHaveBeenCalledWith('test-form-id');
    const docGenCall = docGenSpy.mock.calls[0];
    expect(docGenCall[1].options.reportName).toBe('Fetched Form Name');
  });
});
