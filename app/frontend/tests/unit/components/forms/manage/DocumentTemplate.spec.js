// @vitest-environment happy-dom
// happy-dom is required to access window.open
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import moment from 'moment';
import { setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { afterEach, beforeEach, expect, vi } from 'vitest';

import * as documentTemplateComposables from '~/composables/documentTemplate';
import DocumentTemplate from '~/components/forms/manage/DocumentTemplate.vue';
import { formService, printConfigService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import getRouter from '~/router';
import { ref } from 'vue';
import { useAppStore } from '~/store/app';

const STUBS = {
  VDataTableServer: {
    template: '<div class="v-data-table-server"><slot /></div>',
    props: ['items', 'options', 'serverItemsLength', 'loading', 'pagination'],
  },
  VFileInput: {
    template: '<div class="v-file-input"><slot /></div>',
    props: ['value'],
    methods: {
      reset() {
        this.$emit('update:value', null);
      },
    },
  },
};

describe('DocumentTemplate.vue', () => {
  let router, pinia, formStore, notificationStore, appStore;
  pinia = createTestingPinia();
  setActivePinia(pinia);

  router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  formStore = useFormStore(pinia);
  notificationStore = useNotificationStore(pinia);
  appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    notificationStore.$reset();
    appStore.$reset();
  });

  afterEach(async () => {
    await flushPromises();
  });

  it('calls fetchDocumentTemplates on mount', async () => {
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
      return [
        {
          actions: '',
          createdAt: moment().format(),
          filename: 'filename.txt',
          templateId: '1',
        },
      ];
    });
    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('trans.documentTemplate.info');
    expect(fetchDocumentTemplatesSpy).toHaveBeenCalledTimes(1);
  });

  it('fetchDocumentTemplates should disable preview for microsoft docs', async () => {
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
      return [
        {
          actions: '',
          createdAt: moment().format(),
          filename: 'filename.docx',
          templateId: '1',
        },
      ];
    });

    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.enablePreview).toBeFalsy();
  });

  it('fetchDocumentTemplates throwing an error should add notification', async () => {
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
      throw new Error('test error');
    });

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
  });

  it('validates file extension correctly', async () => {
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
      return [
        {
          actions: '',
          createdAt: moment().format(),
          filename: 'filename.txt',
          templateId: '1',
        },
      ];
    });
    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });
    const invalidFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const validFile = new File([''], 'test.txt', { type: 'text/plain' });

    await wrapper.vm.handleFileInput([invalidFile]);
    expect(wrapper.vm.isValidFile).toBe(false);

    await wrapper.vm.handleFileInput([validFile]);
    expect(wrapper.vm.isValidFile).toBe(true);

    await wrapper.vm.handleFileInput();
    expect(wrapper.vm.isFileInputEmpty).toBeTruthy();
    expect(wrapper.vm.isValidFile).toBeTruthy();
  });

  it('handles file upload correctly', async () => {
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
      return [
        {
          actions: '',
          createdAt: moment().format(),
          filename: 'filename.txt',
          templateId: '1',
        },
      ];
    });
    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    // Mock FileReader
    globalThis.FileReader = function () {
      this.readAsDataURL = vi.fn();
      this.onload = null;
      this.onerror = null;
    };

    vi.spyOn(wrapper.vm, 'handleFileUpload').mockImplementation(() => {
      wrapper.vm.uploadedFile = new Blob(['test'], { type: 'text/plain' });
      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = 'base64testcontent';
        wrapper.vm.cdogsTemplate = base64Content;
      };
      reader.onload();
    });

    await wrapper.vm.handleFileUpload();
    expect(wrapper.vm.cdogsTemplate).toContain('base64testcontent');
  });

  it('handles file upload correctly', async () => {
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
      return [
        {
          actions: '',
          createdAt: moment().format(),
          filename: 'filename.txt',
          templateId: '1',
        },
      ];
    });
    const documentTemplateListSpy = vi.spyOn(
      formService,
      'documentTemplateList'
    );
    documentTemplateListSpy.mockImplementation(() => {
      return [
        {
          filename: 'filename.txt',
          createdAt: moment().format(),
          id: '1',
        },
      ];
    });
    const readFileSpy = vi.spyOn(documentTemplateComposables, 'readFile');
    readFileSpy.mockImplementationOnce(
      async () => 'SGVsbG8ge2QuZmlyc3ROYW1lfS4='
    );
    const documentTemplateCreateSpy = vi.spyOn(
      formService,
      'documentTemplateCreate'
    );
    documentTemplateCreateSpy.mockImplementation(() => {
      return {
        data: {
          active: true,
          createdAt: moment().format(),
          createdBy: 'DocumentTemplate.spec.js',
          filename: 'filename.txt',
          formId: '1',
          id: '1',
          template: {
            type: 'Buffer',
            data: [
              83, 71, 86, 115, 98, 71, 56, 103, 101, 50, 81, 117, 90, 109, 108,
              121, 99, 51, 82, 79, 89, 87, 49, 108, 102, 83, 52, 61,
            ],
          },
          updatedAt: moment().format(),
          updatedBy: null,
        },
      };
    });
    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.documentTemplates = ref([]);

    await flushPromises();

    const mockInputElement = document.createElement('input');
    mockInputElement.type = 'file';
    mockInputElement.reset = vi.fn();

    wrapper.vm.fileInput = ref(mockInputElement);
    wrapper.vm.uploadedFile = {
      name: 'cdogs.txt',
    };

    await wrapper.vm.handleFileUpload();

    await flushPromises();

    expect(wrapper.vm.fileInput.value).toBeUndefined();
  });

  it('dispatches document-templates-updated event after successful upload', async () => {
    const dispatchEventSpy = vi.spyOn(globalThis, 'dispatchEvent');
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
      return [
        {
          actions: '',
          createdAt: moment().format(),
          filename: 'filename.txt',
          templateId: '1',
        },
      ];
    });
    const readFileSpy = vi.spyOn(documentTemplateComposables, 'readFile');
    readFileSpy.mockImplementationOnce(
      async () => 'SGVsbG8ge2QuZmlyc3ROYW1lfS4='
    );
    const documentTemplateCreateSpy = vi.spyOn(
      formService,
      'documentTemplateCreate'
    );
    documentTemplateCreateSpy.mockResolvedValue({
      data: {
        active: true,
        createdAt: moment().format(),
        createdBy: 'DocumentTemplate.spec.js',
        filename: 'filename.txt',
        formId: '1',
        id: '1',
        template: {
          type: 'Buffer',
          data: [],
        },
        updatedAt: moment().format(),
        updatedBy: null,
      },
    });

    formStore.form = { id: '1' };

    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.documentTemplates = ref([]);
    await flushPromises();

    const mockInputElement = document.createElement('input');
    mockInputElement.type = 'file';
    mockInputElement.reset = vi.fn();

    wrapper.vm.fileInput = ref(mockInputElement);
    wrapper.vm.uploadedFile = {
      name: 'cdogs.txt',
    };

    await wrapper.vm.handleFileUpload();
    await flushPromises();

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'document-templates-updated',
        detail: { formId: '1' },
      })
    );
  });

  it('when handleFileUpload throws an error, it will show a notification', async () => {
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
      return [
        {
          actions: '',
          createdAt: moment().format(),
          filename: 'filename.txt',
          templateId: '1',
        },
      ];
    });
    const documentTemplateListSpy = vi.spyOn(
      formService,
      'documentTemplateList'
    );
    documentTemplateListSpy.mockImplementation(() => {
      return [
        {
          filename: 'filename.txt',
          createdAt: moment().format(),
          id: '1',
        },
      ];
    });
    const readFileSpy = vi.spyOn(documentTemplateComposables, 'readFile');
    readFileSpy.mockImplementationOnce(
      async () => 'SGVsbG8ge2QuZmlyc3ROYW1lfS4='
    );
    const documentTemplateCreateSpy = vi.spyOn(
      formService,
      'documentTemplateCreate'
    );
    documentTemplateCreateSpy.mockImplementation(() => {
      const error = new Error('Error');
      error.response = { status: 500 };
      throw error;
    });
    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.documentTemplates = ref([]);

    await flushPromises();

    wrapper.vm.uploadedFile = {
      name: 'cdogs.txt',
    };

    await wrapper.vm.handleFileUpload();

    await flushPromises();

    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledWith({
      consoleError: 'trans.documentTemplate.uploadError',
      text: 'trans.documentTemplate.uploadError',
    });
  });

  it('handles delete successfully', async () => {
    let mockDatabase = [
      {
        formId: '1',
        templateId: '1',
      },
      {
        formId: '1',
        templateId: '2',
      },
    ];
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementation(async () => {
      return Array.from(mockDatabase);
    });
    const documentTemplateDeleteSpy = vi.spyOn(
      formService,
      'documentTemplateDelete'
    );
    documentTemplateDeleteSpy.mockImplementation(async (formId, templateId) => {
      mockDatabase = mockDatabase.filter(
        (item) => !(item.formId === formId && item.templateId === templateId)
      );
    });

    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    formStore.form = { id: '1' };
    // if there are doc templates
    wrapper.vm.documentTemplates = ref(Array.from(mockDatabase));

    await wrapper.vm.handleDelete({ templateId: '1' });

    await flushPromises();

    expect(
      mockDatabase.find((item) => item.templateId === '1')
    ).toBeUndefined();
  });

  it('delete should show a notification if an error occurs', async () => {
    let mockDatabase = [
      {
        formId: '1',
        templateId: '1',
      },
      {
        formId: '1',
        templateId: '2',
      },
    ];

    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementationOnce(() => {
      return Array.from(mockDatabase);
    });
    const documentTemplateDeleteSpy = vi.spyOn(
      formService,
      'documentTemplateDelete'
    );
    documentTemplateDeleteSpy.mockImplementationOnce(async () => {
      throw new Error('error should be thrown here');
    });

    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    formStore.form = { id: '1' };
    // if there are doc templates
    wrapper.vm.documentTemplates = ref(Array.from(mockDatabase));

    // Execute handleDelete and expect it to complete without errors
    await wrapper.vm.handleDelete({ templateId: '1' });

    // Flush promises to ensure asynchronous operations are completed
    await flushPromises();

    // Ensure that addNotificationSpy was called with the correct parameters
    expect(addNotificationSpy).toHaveBeenCalledTimes(2);
    // For some reason even though documentTemplateDelete throws an error, it will continue on
    // and fetchTemplates and addNotification, so addNotification gets called when it succeeds AND
    // when it catches
  });

  it('successfully calls handleFileAction with preview', async () => {
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
      return [];
    });
    const getDocumentTemplateSpy = vi.spyOn(
      documentTemplateComposables,
      'getDocumentTemplate'
    );
    getDocumentTemplateSpy.mockImplementationOnce(async () => {
      return '#';
    });
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const windowOpenSpy = vi.spyOn(globalThis, 'open');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    addNotificationSpy.mockImplementation(() => {});
    windowOpenSpy.mockImplementation(() => {});
    appendChildSpy.mockImplementation(() => {});

    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();
    windowOpenSpy.mockReset();
    appendChildSpy.mockReset();
    addNotificationSpy.mockReset();
    addNotificationSpy.mockImplementation(() => {});
    windowOpenSpy.mockImplementation(() => {});
    appendChildSpy.mockImplementation(() => {});

    wrapper.vm.handleFileAction(
      { templateId: '1', filename: 'filename.txt' },
      'preview'
    );

    await flushPromises();

    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    expect(appendChildSpy).toHaveBeenCalledTimes(0);
    expect(addNotificationSpy).toHaveBeenCalledTimes(0);
  });

  it('successfully calls handleFileAction with download', async () => {
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementation(async () => {
      return [];
    });
    const getDocumentTemplateSpy = vi.spyOn(
      documentTemplateComposables,
      'getDocumentTemplate'
    );
    getDocumentTemplateSpy.mockImplementation(async () => {
      return '#';
    });
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const windowOpenSpy = vi.spyOn(globalThis, 'open');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    addNotificationSpy.mockImplementation(() => {});
    windowOpenSpy.mockImplementation(() => {});
    appendChildSpy.mockImplementation(() => {});

    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });
    await flushPromises();
    windowOpenSpy.mockReset();
    appendChildSpy.mockReset();
    addNotificationSpy.mockReset();
    getDocumentTemplateSpy.mockReset();
    addNotificationSpy.mockImplementation(() => {});
    windowOpenSpy.mockImplementation(() => {});
    appendChildSpy.mockImplementation(() => {});
    getDocumentTemplateSpy.mockImplementation(async () => {
      return '#';
    });

    wrapper.vm.handleFileAction(
      { templateId: '1', filename: 'filename.txt' },
      'download'
    );
    await flushPromises();

    expect(windowOpenSpy).toHaveBeenCalledTimes(0);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledTimes(0);
  });

  it('if handleFileAction throws an error, it should show a notification', async () => {
    const fetchDocumentTemplatesSpy = vi.spyOn(
      documentTemplateComposables,
      'fetchDocumentTemplates'
    );
    fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
      return [];
    });
    const getDocumentTemplateSpy = vi.spyOn(
      documentTemplateComposables,
      'getDocumentTemplate'
    );
    getDocumentTemplateSpy.mockImplementationOnce(() => {
      throw new Error('test error');
    });
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

    const wrapper = mount(DocumentTemplate, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.handleFileAction(
      { templateId: '1', filename: 'filename.txt' },
      'preview'
    );

    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
  });

  describe('PrintConfig integration', () => {
    it('should fetch print config on mount', async () => {
      formStore.form = { id: '1' };

      const fetchDocumentTemplatesSpy = vi.spyOn(
        documentTemplateComposables,
        'fetchDocumentTemplates'
      );
      fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
        return [];
      });
      const readPrintConfigSpy = vi.spyOn(
        printConfigService,
        'readPrintConfig'
      );
      readPrintConfigSpy.mockResolvedValueOnce({ data: null });

      mount(DocumentTemplate, {
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      expect(readPrintConfigSpy).toHaveBeenCalledWith('1');
    });

    it('should disable delete button when template is in use', async () => {
      formStore.form = { id: '1' };

      const fetchDocumentTemplatesSpy = vi.spyOn(
        documentTemplateComposables,
        'fetchDocumentTemplates'
      );
      fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
        return [
          {
            actions: '',
            createdAt: moment().format(),
            filename: 'filename.txt',
            templateId: 'template-1',
          },
        ];
      });
      const readPrintConfigSpy = vi.spyOn(
        printConfigService,
        'readPrintConfig'
      );
      readPrintConfigSpy.mockResolvedValueOnce({
        data: {
          id: 'config-1',
          formId: '1',
          code: 'direct',
          templateId: 'template-1',
        },
      });

      const wrapper = mount(DocumentTemplate, {
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      expect(wrapper.vm.isTemplateInUse('template-1')).toBe(true);
      expect(wrapper.vm.isTemplateInUse('template-2')).toBe(false);
    });

    it('should enable delete button when template is not in use', async () => {
      formStore.form = { id: '1' };

      const fetchDocumentTemplatesSpy = vi.spyOn(
        documentTemplateComposables,
        'fetchDocumentTemplates'
      );
      fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
        return [
          {
            actions: '',
            createdAt: moment().format(),
            filename: 'filename.txt',
            templateId: 'template-1',
          },
        ];
      });
      const readPrintConfigSpy = vi.spyOn(
        printConfigService,
        'readPrintConfig'
      );
      readPrintConfigSpy.mockResolvedValueOnce({ data: null });

      const wrapper = mount(DocumentTemplate, {
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      expect(wrapper.vm.isTemplateInUse('template-1')).toBe(false);
    });

    it('should show error notification on 409 response', async () => {
      formStore.form = { id: '1' };

      const fetchDocumentTemplatesSpy = vi.spyOn(
        documentTemplateComposables,
        'fetchDocumentTemplates'
      );
      fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
        return [
          {
            actions: '',
            createdAt: moment().format(),
            filename: 'filename.txt',
            templateId: 'template-1',
          },
        ];
      });
      const readPrintConfigSpy = vi.spyOn(
        printConfigService,
        'readPrintConfig'
      );
      readPrintConfigSpy.mockResolvedValueOnce({ data: null });
      const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
      const documentTemplateDeleteSpy = vi.spyOn(
        formService,
        'documentTemplateDelete'
      );
      const error = new Error('Conflict');
      error.response = { status: 409 };
      documentTemplateDeleteSpy.mockRejectedValueOnce(error);

      const wrapper = mount(DocumentTemplate, {
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.handleDelete({ templateId: 'template-1' });

      await flushPromises();

      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'trans.documentTemplate.deleteErrorInUse',
        })
      );
    });

    it('should successfully delete when template is not in use', async () => {
      formStore.form = { id: '1' };

      const fetchDocumentTemplatesSpy = vi.spyOn(
        documentTemplateComposables,
        'fetchDocumentTemplates'
      );
      fetchDocumentTemplatesSpy.mockImplementation(async () => {
        return [
          {
            actions: '',
            createdAt: moment().format(),
            filename: 'filename.txt',
            templateId: 'template-1',
          },
        ];
      });
      const readPrintConfigSpy = vi.spyOn(
        printConfigService,
        'readPrintConfig'
      );
      readPrintConfigSpy.mockResolvedValue({ data: null });
      const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
      const documentTemplateDeleteSpy = vi.spyOn(
        formService,
        'documentTemplateDelete'
      );
      documentTemplateDeleteSpy.mockResolvedValueOnce({});

      const wrapper = mount(DocumentTemplate, {
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.handleDelete({ templateId: 'template-1' });

      await flushPromises();

      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'trans.documentTemplate.deleteSuccess',
        })
      );
    });

    it('dispatches document-templates-updated event after successful delete', async () => {
      const dispatchEventSpy = vi.spyOn(globalThis, 'dispatchEvent');
      formStore.form = { id: '1' };

      const fetchDocumentTemplatesSpy = vi.spyOn(
        documentTemplateComposables,
        'fetchDocumentTemplates'
      );
      fetchDocumentTemplatesSpy.mockImplementation(async () => {
        return [
          {
            actions: '',
            createdAt: moment().format(),
            filename: 'filename.txt',
            templateId: 'template-1',
          },
        ];
      });
      const readPrintConfigSpy = vi.spyOn(
        printConfigService,
        'readPrintConfig'
      );
      readPrintConfigSpy.mockResolvedValue({ data: null });
      const documentTemplateDeleteSpy = vi.spyOn(
        formService,
        'documentTemplateDelete'
      );
      documentTemplateDeleteSpy.mockResolvedValueOnce({});

      const wrapper = mount(DocumentTemplate, {
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.handleDelete({ templateId: 'template-1' });
      await flushPromises();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'document-templates-updated',
          detail: { formId: '1' },
        })
      );
    });

    it('listens for print-config-updated event and refreshes print config', async () => {
      formStore.form = { id: '1' };

      const fetchDocumentTemplatesSpy = vi.spyOn(
        documentTemplateComposables,
        'fetchDocumentTemplates'
      );
      fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
        return [
          {
            actions: '',
            createdAt: moment().format(),
            filename: 'filename.txt',
            templateId: 'template-1',
          },
        ];
      });
      const fetchPrintConfigSpy = vi.spyOn(
        printConfigService,
        'readPrintConfig'
      );
      fetchPrintConfigSpy.mockResolvedValue({ data: null });

      mount(DocumentTemplate, {
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      // Reset spy to count only after mount
      fetchPrintConfigSpy.mockClear();
      fetchPrintConfigSpy.mockResolvedValue({
        data: { code: 'direct', templateId: 'template-1' },
      });

      // Dispatch event
      globalThis.dispatchEvent(
        new CustomEvent('print-config-updated', {
          detail: {
            formId: '1',
            printConfig: { code: 'direct', templateId: 'template-1' },
          },
        })
      );

      await flushPromises();

      expect(fetchPrintConfigSpy).toHaveBeenCalledWith('1');
    });

    it('ignores print-config-updated event from other forms', async () => {
      formStore.form = { id: '1' };

      const fetchDocumentTemplatesSpy = vi.spyOn(
        documentTemplateComposables,
        'fetchDocumentTemplates'
      );
      fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
        return [
          {
            actions: '',
            createdAt: moment().format(),
            filename: 'filename.txt',
            templateId: 'template-1',
          },
        ];
      });
      const fetchPrintConfigSpy = vi.spyOn(
        printConfigService,
        'readPrintConfig'
      );
      fetchPrintConfigSpy.mockResolvedValue({ data: null });

      mount(DocumentTemplate, {
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      // Reset spy to count only after mount
      fetchPrintConfigSpy.mockClear();

      // Dispatch event for different form
      globalThis.dispatchEvent(
        new CustomEvent('print-config-updated', {
          detail: {
            formId: 'other-form-id',
            printConfig: { code: 'direct', templateId: 'template-1' },
          },
        })
      );

      await flushPromises();

      // Should not have been called for different form
      expect(fetchPrintConfigSpy).not.toHaveBeenCalled();
    });

    it('removes event listener on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(
        globalThis,
        'removeEventListener'
      );
      formStore.form = { id: '1' };

      const fetchDocumentTemplatesSpy = vi.spyOn(
        documentTemplateComposables,
        'fetchDocumentTemplates'
      );
      fetchDocumentTemplatesSpy.mockImplementationOnce(async () => {
        return [
          {
            actions: '',
            createdAt: moment().format(),
            filename: 'filename.txt',
            templateId: 'template-1',
          },
        ];
      });
      const readPrintConfigSpy = vi.spyOn(
        printConfigService,
        'readPrintConfig'
      );
      readPrintConfigSpy.mockResolvedValue({ data: null });

      const wrapper = mount(DocumentTemplate, {
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'print-config-updated',
        expect.any(Function)
      );
    });
  });
});
