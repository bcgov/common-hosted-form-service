import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PrintConfig from '~/components/forms/manage/PrintConfig.vue';
import { fetchDocumentTemplates } from '~/composables/documentTemplate';
import { printConfigService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

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
        reportName: null,
        reportNameOption: 'formName',
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
    expect(wrapper.vm.localConfig.reportNameOption).toBe('formName');
    expect(wrapper.vm.localConfig.reportName).toBeNull();
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
      reportName: null,
      reportNameOption: 'formName',
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
      reportName: null,
      reportNameOption: null,
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

  it('loads reportName and reportNameOption from API', async () => {
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
        reportName: 'Custom Report Name',
        reportNameOption: 'custom',
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

    expect(wrapper.vm.localConfig.reportNameOption).toBe('custom');
    expect(wrapper.vm.localConfig.reportName).toBe('Custom Report Name');
  });

  it('defaults reportNameOption to formName when not provided', async () => {
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
        reportName: null,
        reportNameOption: null,
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

    expect(wrapper.vm.localConfig.reportNameOption).toBe('formName');
    expect(wrapper.vm.localConfig.reportName).toBeNull();
  });

  it('saves reportName and reportNameOption when custom option is selected', async () => {
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
    upsertPrintConfigSpy.mockResolvedValue({
      data: {
        code: 'direct',
        templateId: 'test-template-id',
        outputFileType: 'pdf',
        reportName: 'My Custom Name',
        reportNameOption: 'custom',
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

    wrapper.vm.localConfig.code = 'direct';
    wrapper.vm.localConfig.templateId = 'test-template-id';
    wrapper.vm.localConfig.reportNameOption = 'custom';
    wrapper.vm.localConfig.reportName = 'My Custom Name';

    await wrapper.vm.handleSave();

    expect(upsertPrintConfigSpy).toHaveBeenCalledWith('test-form-id', {
      code: 'direct',
      templateId: 'test-template-id',
      outputFileType: 'pdf',
      reportNameOption: 'custom',
      reportName: 'My Custom Name',
    });
  });

  it('saves null reportName when formName option is selected', async () => {
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
    upsertPrintConfigSpy.mockResolvedValue({
      data: {
        code: 'direct',
        templateId: 'test-template-id',
        outputFileType: 'pdf',
        reportName: null,
        reportNameOption: 'formName',
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

    wrapper.vm.localConfig.code = 'direct';
    wrapper.vm.localConfig.templateId = 'test-template-id';
    wrapper.vm.localConfig.reportNameOption = 'formName';
    wrapper.vm.localConfig.reportName = null;

    await wrapper.vm.handleSave();

    expect(upsertPrintConfigSpy).toHaveBeenCalledWith('test-form-id', {
      code: 'direct',
      templateId: 'test-template-id',
      outputFileType: 'pdf',
      reportNameOption: 'formName',
      reportName: null,
    });
  });

  it('dispatches print-config-updated event after successful save', async () => {
    const dispatchEventSpy = vi.spyOn(globalThis, 'dispatchEvent');
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

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'print-config-updated',
        detail: expect.objectContaining({
          formId: 'test-form-id',
        }),
      })
    );
  });

  it('listens for document-templates-updated event and refreshes templates', async () => {
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

    // Reset mock to count only after mount
    vi.mocked(fetchDocumentTemplates).mockClear();
    vi.mocked(fetchDocumentTemplates).mockResolvedValue([
      {
        filename: 'new-template.docx',
        templateId: 'new-template-id',
        createdAt: '2024-01-01',
        actions: '',
      },
    ]);

    // Dispatch event
    globalThis.dispatchEvent(
      new CustomEvent('document-templates-updated', {
        detail: { formId: 'test-form-id' },
      })
    );

    await flushPromises();

    expect(fetchDocumentTemplates).toHaveBeenCalledWith('test-form-id');
    expect(wrapper.vm.documentTemplates).toHaveLength(1);
  });

  it('ignores document-templates-updated event from other forms', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const readPrintConfigSpy = vi.spyOn(printConfigService, 'readPrintConfig');
    readPrintConfigSpy.mockResolvedValue({ data: null });

    vi.mocked(fetchDocumentTemplates).mockResolvedValue([]);

    mount(PrintConfig, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // Reset mock to count only after mount
    vi.mocked(fetchDocumentTemplates).mockClear();

    // Dispatch event for different form
    globalThis.dispatchEvent(
      new CustomEvent('document-templates-updated', {
        detail: { formId: 'other-form-id' },
      })
    );

    await flushPromises();

    // Should not have been called for different form
    expect(fetchDocumentTemplates).not.toHaveBeenCalled();
  });

  it('removes event listener on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener');
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

    wrapper.unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'document-templates-updated',
      expect.any(Function)
    );
  });
});
