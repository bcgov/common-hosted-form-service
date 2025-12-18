import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PrintOptionsWrapper from '~/components/forms/PrintOptionsWrapper.vue';
import DirectPrintButton from '~/components/forms/DirectPrintButton.vue';
import PrintOptions from '~/components/forms/PrintOptions.vue';
import { printConfigService } from '~/services';
import { useFormStore } from '~/store/form';

const STUBS = {
  DirectPrintButton: {
    template: '<div class="direct-print-button-stub"></div>',
  },
  PrintOptions: {
    template: '<div class="print-options-stub"></div>',
  },
};

describe('PrintOptionsWrapper.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    vi.clearAllMocks();
  });

  it('renders PrintOptions by default when loading', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: null });
          }, 100);
        })
    );

    const wrapper = mount(PrintOptionsWrapper, {
      props: {
        submissionId: 'test-submission-id',
        f: 'test-form-id',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    // Initially should show PrintOptions while loading
    expect(wrapper.find('.print-options-stub').exists()).toBeTruthy();
    expect(wrapper.find('.direct-print-button-stub').exists()).toBeFalsy();

    await flushPromises();
  });

  it('renders DirectPrintButton when direct print config exists', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({
      data: {
        code: 'direct',
        templateId: 'test-template-id',
        outputFileType: 'pdf',
      },
    });

    const wrapper = mount(PrintOptionsWrapper, {
      props: {
        submissionId: 'test-submission-id',
        f: 'test-form-id',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.find('.direct-print-button-stub').exists()).toBeTruthy();
    expect(wrapper.find('.print-options-stub').exists()).toBeFalsy();
  });

  it('renders PrintOptions when config code is not direct', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({
      data: {
        code: 'default',
        templateId: null,
      },
    });

    const wrapper = mount(PrintOptionsWrapper, {
      props: {
        submissionId: 'test-submission-id',
        f: 'test-form-id',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.find('.print-options-stub').exists()).toBeTruthy();
    expect(wrapper.find('.direct-print-button-stub').exists()).toBeFalsy();
  });

  it('renders PrintOptions when config has no templateId', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({
      data: {
        code: 'direct',
        templateId: null,
      },
    });

    const wrapper = mount(PrintOptionsWrapper, {
      props: {
        submissionId: 'test-submission-id',
        f: 'test-form-id',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.find('.print-options-stub').exists()).toBeTruthy();
    expect(wrapper.find('.direct-print-button-stub').exists()).toBeFalsy();
  });

  it('handles 404 error gracefully and falls back to PrintOptions', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    const error = new Error('Not found');
    error.response = { status: 404 };
    readPrintConfigSpy.mockRejectedValue(error);

    const wrapper = mount(PrintOptionsWrapper, {
      props: {
        submissionId: 'test-submission-id',
        f: 'test-form-id',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.find('.print-options-stub').exists()).toBeTruthy();
    expect(wrapper.find('.direct-print-button-stub').exists()).toBeFalsy();
  });

  it('uses formId from props when provided', async () => {
    formStore.form = {
      id: 'store-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({ data: null });

    const wrapper = mount(PrintOptionsWrapper, {
      props: {
        submissionId: 'test-submission-id',
        f: 'prop-form-id',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(readPrintConfigSpy).toHaveBeenCalledWith('prop-form-id');
  });

  it('uses formId from store when prop f is empty', async () => {
    formStore.form = {
      id: 'store-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({ data: null });

    const wrapper = mount(PrintOptionsWrapper, {
      props: {
        submissionId: 'test-submission-id',
        f: '',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(readPrintConfigSpy).toHaveBeenCalledWith('store-form-id');
  });

  it('only fetches config once when formId becomes available', async () => {
    formStore.form = {
      id: null,
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({ data: null });

    const wrapper = mount(PrintOptionsWrapper, {
      props: {
        submissionId: 'test-submission-id',
        f: '',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // Should not call API when formId is null
    expect(readPrintConfigSpy).not.toHaveBeenCalled();

    // Update formId
    formStore.form.id = 'test-form-id';
    await flushPromises();

    // Should call API once when formId becomes available
    expect(readPrintConfigSpy).toHaveBeenCalledTimes(1);
    expect(readPrintConfigSpy).toHaveBeenCalledWith('test-form-id');
  });
});
