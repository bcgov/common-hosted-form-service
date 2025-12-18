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

    const wrapper = mount(DirectPrintButton, {
      props: {
        submissionId: 'test-submission-id',
        printConfig: {
          code: 'direct',
          templateId: 'test-template-id',
          outputFileType: 'pdf',
        },
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.html()).toMatch('v-tooltip-stub');
  });

  it('generates direct print successfully with submissionId', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const documentTemplateReadSpy = vi.spyOn(
      formService,
      'documentTemplateRead'
    );
    documentTemplateReadSpy.mockResolvedValue({
      data: {
        template: {
          data: [65, 66, 67], // ABC in char codes
        },
        filename: 'test-template.docx',
      },
    });

    const docGenSpy = vi.spyOn(formService, 'docGen');
    docGenSpy.mockResolvedValue({
      headers: {
        'content-disposition': 'attachment; filename="test.pdf"',
      },
      data: new Blob(['test'], { type: 'application/pdf' }),
    });

    const createDownloadSpy = vi.spyOn(
      printOptionsComposables,
      'createDownload'
    );
    createDownloadSpy.mockImplementation(() => {});

    const splitFileNameSpy = vi.spyOn(transformUtils, 'splitFileName');
    splitFileNameSpy.mockReturnValue({
      name: 'test-template',
      extension: 'docx',
    });

    const getDispositionSpy = vi.spyOn(transformUtils, 'getDisposition');
    getDispositionSpy.mockReturnValue('test.pdf');

    const wrapper = mount(DirectPrintButton, {
      props: {
        submissionId: 'test-submission-id',
        printConfig: {
          code: 'direct',
          templateId: 'test-template-id',
          outputFileType: 'pdf',
        },
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.generateDirectPrint();

    expect(documentTemplateReadSpy).toHaveBeenCalledWith(
      'test-form-id',
      'test-template-id'
    );
    expect(docGenSpy).toHaveBeenCalledTimes(1);
    expect(createDownloadSpy).toHaveBeenCalledTimes(1);
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

    const documentTemplateReadSpy = vi.spyOn(
      formService,
      'documentTemplateRead'
    );
    documentTemplateReadSpy.mockResolvedValue({
      data: {
        template: {
          data: [65, 66, 67],
        },
        filename: 'test-template.docx',
      },
    });

    const draftDocGenSpy = vi.spyOn(utilsService, 'draftDocGen');
    draftDocGenSpy.mockResolvedValue({
      headers: {
        'content-disposition': 'attachment; filename="test.pdf"',
      },
      data: new Blob(['test'], { type: 'application/pdf' }),
    });

    const createDownloadSpy = vi.spyOn(
      printOptionsComposables,
      'createDownload'
    );
    createDownloadSpy.mockImplementation(() => {});

    const splitFileNameSpy = vi.spyOn(transformUtils, 'splitFileName');
    splitFileNameSpy.mockReturnValue({
      name: 'test-template',
      extension: 'docx',
    });

    const getDispositionSpy = vi.spyOn(transformUtils, 'getDisposition');
    getDispositionSpy.mockReturnValue('test.pdf');

    const wrapper = mount(DirectPrintButton, {
      props: {
        submissionId: '',
        submission: { test: 'data' },
        printConfig: {
          code: 'direct',
          templateId: 'test-template-id',
          outputFileType: 'pdf',
        },
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.generateDirectPrint();

    expect(documentTemplateReadSpy).toHaveBeenCalledWith(
      'test-form-id',
      'test-template-id'
    );
    expect(draftDocGenSpy).toHaveBeenCalledTimes(1);
    expect(createDownloadSpy).toHaveBeenCalledTimes(1);
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

    const documentTemplateReadSpy = vi.spyOn(
      formService,
      'documentTemplateRead'
    );
    documentTemplateReadSpy.mockRejectedValue(new Error('Test error'));

    const wrapper = mount(DirectPrintButton, {
      props: {
        submissionId: 'test-submission-id',
        printConfig: {
          code: 'direct',
          templateId: 'test-template-id',
          outputFileType: 'pdf',
        },
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

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

    const documentTemplateReadSpy = vi.spyOn(
      formService,
      'documentTemplateRead'
    );
    documentTemplateReadSpy.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                template: { data: [65] },
                filename: 'test.docx',
              },
            });
          }, 100);
        })
    );

    const wrapper = mount(DirectPrintButton, {
      props: {
        submissionId: 'test-submission-id',
        printConfig: {
          code: 'direct',
          templateId: 'test-template-id',
          outputFileType: 'pdf',
        },
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    const generatePromise = wrapper.vm.generateDirectPrint();
    expect(wrapper.vm.loading).toBe(true);

    await generatePromise;
    await flushPromises();

    expect(wrapper.vm.loading).toBe(false);
  });
});
