import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PrintConfig from '~/components/forms/manage/PrintConfig.vue';
import { fetchDocumentTemplates } from '~/composables/documentTemplate';
import { printConfigService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { formService } from '~/services';

vi.mock('~/composables/documentTemplate');

const STUBS = {
  VAlert: {
    template: '<div class="v-alert-stub"><slot /></div>',
  },
  VSelect: {
    template: '<div class="v-select-stub"><slot /></div>',
  },
  VRadioGroup: {
    template: '<div class="v-radio-group-stub"><slot /></div>',
  },
  VRadio: {
    template: '<div class="v-radio-stub"><slot /></div>',
  },
  VBtn: {
    template: '<div class="v-btn-stub"><slot /></div>',
  },
  VExpandTransition: {
    template: '<div class="v-expand-transition-stub"><slot /></div>',
  },
};

describe('PrintConfig.vue', () => {
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

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({ data: null });

    vi.mocked(fetchDocumentTemplates).mockResolvedValue([]);

    const wrapper = mount(PrintConfig, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('trans.printConfig.description');
    expect(wrapper.html()).toMatch('v-radio-group-stub');
  });

  it('loads existing print config on mount', async () => {
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

    vi.mocked(fetchDocumentTemplates).mockResolvedValue([
      {
        filename: 'test-template.docx',
        templateId: 'test-template-id',
        createdAt: '2024-01-01',
        actions: '',
      },
    ]);

    const wrapper = mount(PrintConfig, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(readPrintConfigSpy).toHaveBeenCalledWith('test-form-id');
    expect(wrapper.vm.localConfig.code).toBe('direct');
    expect(wrapper.vm.localConfig.templateId).toBe('test-template-id');
  });

  it('handles 404 error when config does not exist', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    const error = new Error('Not found');
    error.response = { status: 404 };
    readPrintConfigSpy.mockRejectedValue(error);

    vi.mocked(fetchDocumentTemplates).mockResolvedValue([]);

    const wrapper = mount(PrintConfig, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.localConfig.code).toBe('default');
    expect(wrapper.vm.localConfig.templateId).toBeNull();
  });

  it('saves print config successfully', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({ data: null });

    const upsertPrintConfigSpy = vi.spyOn(
      printConfigService,
      'upsertPrintConfig'
    );
    upsertPrintConfigSpy.mockResolvedValue({});

    vi.mocked(fetchDocumentTemplates).mockResolvedValue([
      {
        filename: 'test-template.docx',
        templateId: 'test-template-id',
        createdAt: '2024-01-01',
        actions: '',
      },
    ]);

    const wrapper = mount(PrintConfig, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.localConfig.code = 'direct';
    wrapper.vm.localConfig.templateId = 'test-template-id';

    await wrapper.vm.handleSave();

    expect(upsertPrintConfigSpy).toHaveBeenCalledWith('test-form-id', {
      code: 'direct',
      templateId: 'test-template-id',
      outputFileType: 'pdf',
    });
    expect(addNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'trans.printConfig.saveSuccess',
      })
    );
  });

  it('saves default config when code is default', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({ data: null });

    const upsertPrintConfigSpy = vi.spyOn(
      printConfigService,
      'upsertPrintConfig'
    );
    upsertPrintConfigSpy.mockResolvedValue({});

    vi.mocked(fetchDocumentTemplates).mockResolvedValue([]);

    const wrapper = mount(PrintConfig, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.localConfig.code = 'default';

    await wrapper.vm.handleSave();

    expect(upsertPrintConfigSpy).toHaveBeenCalledWith('test-form-id', {
      code: 'default',
      templateId: null,
      outputFileType: null,
    });
  });

  it('shows warning when saved template is deleted', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({
      data: {
        code: 'direct',
        templateId: 'deleted-template-id',
        outputFileType: 'pdf',
      },
    });

    vi.mocked(fetchDocumentTemplates).mockResolvedValue([
      {
        filename: 'other-template.docx',
        templateId: 'other-template-id',
        createdAt: '2024-01-01',
        actions: '',
      },
    ]);

    const wrapper = mount(PrintConfig, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(addNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'trans.printConfig.templateDeleted',
      })
    );
    expect(wrapper.vm.localConfig.templateId).toBeNull();
  });

  it('handles fetch templates error', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({ data: null });

    vi.mocked(fetchDocumentTemplates).mockRejectedValue(
      new Error('Fetch error')
    );

    mount(PrintConfig, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(addNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'trans.documentTemplate.fetchError',
      })
    );
  });

  it('disables direct option when no templates available', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({ data: null });

    vi.mocked(fetchDocumentTemplates).mockResolvedValue([]);

    const wrapper = mount(PrintConfig, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.hasTemplates).toBe(false);
    expect(wrapper.vm.isDirectPrint).toBe(false);
  });

  it('shows template selection when direct is selected', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({ data: null });

    vi.mocked(fetchDocumentTemplates).mockResolvedValue([
      {
        filename: 'test-template.docx',
        templateId: 'test-template-id',
        createdAt: '2024-01-01',
        actions: '',
      },
    ]);

    const wrapper = mount(PrintConfig, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.localConfig.code = 'direct';

    await flushPromises();

    expect(wrapper.vm.isDirectPrint).toBe(true);
  });
});
