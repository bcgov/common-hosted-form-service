// @vitest-environment happy-dom
// happy-dom is required to access window.URL
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, onTestFinished, vi } from 'vitest';

import PrintOptions from '~/components/forms/PrintOptions.vue';
import * as printOptionsComposables from '~/composables/printOptions';
import { formService } from '~/services';
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
  VDialog: {
    template: '<div class="v-dialog-stub"><slot /></div>',
  },
  VCard: {
    template: '<div class="v-card-stub"><slot /></div>',
  },
  VCardTitle: {
    template: '<div class="v-card-title-stub"><slot /></div>',
  },
  VCardText: {
    template: '<div class="v-card-text-stub"><slot /></div>',
  },
  VTabs: {
    template: '<div class="v-tabs-stub"><slot /></div>',
  },
  VTab: {
    template: '<div class="v-tab-stub"><slot /></div>',
  },
  VWindow: {
    template: '<div class="v-window-stub"><slot /></div>',
  },
  VWindowItem: {
    template: '<div class="v-window-item-stub"><slot /></div>',
  },
  VCheckbox: {
    template: '<div class="v-checkbox-stub"><slot /></div>',
  },
  VIcon: {
    template: '<div class="v-icon-stub"><slot /></div>',
  },
  VRadioGroup: {
    template: '<div class="v-radio-group-stub"><slot /></div>',
  },
  VSkeletonLoader: {
    template: '<div class="v-skeleton-loader-stub"><slot /></div>',
  },
  VRadio: {
    template: '<div class="v-radio-stub"><slot /></div>',
  },
  VTable: {
    template: '<div class="v-table-stub"><slot /></div>',
  },
  VSelect: {
    template: '<div class="v-select-stub"><slot /></div>',
  },
  VFileInput: {
    template: '<div class="v-file-input-stub"><slot /></div>',
  },
  VCardActions: {
    template: '<div class="v-card-actions-stub"><slot /></div>',
  },
};

describe('PrintOptions.vue', () => {
  const submissionId = '123-456';

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
  });

  it('renders', async () => {
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: submissionId,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('trans.printOptions.printOptions');
    expect(wrapper.text()).toContain('trans.printOptions.browserPrint');
    expect(wrapper.text()).toContain('trans.printOptions.templatePrint');
    expect(wrapper.text()).toContain('trans.printOptions.moreInfo');
    expect(wrapper.text()).toContain('trans.printOptions.submitButtonTxt');
  });

  it('clears timeout before destroy', async () => {
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: submissionId,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();
    wrapper.unmount();
    expect(wrapper.vm.timeout).not.toBeNull();
  });

  describe('printBrowser', () => {
    let formRoot;
    let wrapper;

    async function mountPrintOptions() {
      formStore.form = { id: 0, name: 'This is a form title' };
      wrapper = mount(PrintOptions, {
        props: { submissionId, submission: undefined, f: '0' },
        global: { plugins: [pinia], stubs: STUBS },
      });
      await flushPromises();
    }

    function addField(tag, { type, className, value, parent } = {}) {
      const el = document.createElement(tag);
      if (type) el.type = type;
      if (className) el.className = className;
      if (value !== undefined) el.value = value;
      (parent || formRoot).appendChild(el);
      return el;
    }

    function divWithText(text) {
      return [...document.body.querySelectorAll('div')].find(
        (div) => div.textContent === text
      );
    }

    function afterPrint() {
      window.dispatchEvent(new Event('afterprint'));
    }

    // Browsers fire beforeprint inside print() when the print goes ahead.
    function printGoesAhead() {
      window.dispatchEvent(new Event('beforeprint'));
    }

    async function clickBrowserPrint() {
      await wrapper.vm.printBrowser();
      vi.advanceTimersByTime(500);
    }

    beforeEach(async () => {
      vi.spyOn(window, 'print').mockImplementation(printGoesAhead);
      formRoot = document.createElement('div');
      formRoot.className = 'formio-form';
      document.body.appendChild(formRoot);
      await mountPrintOptions();
      vi.useFakeTimers();
    });

    afterEach(() => {
      wrapper?.unmount();
      wrapper = undefined;
      formRoot.remove();
      vi.useRealTimers();
    });

    it('defaults "Expand text fields" to checked', () => {
      expect(wrapper.vm.expandedText).toBe(true);
    });

    it('swaps rendered fields for divs during print and restores them after', async () => {
      const textarea = addField('textarea', { value: 'line one\nline two' });
      Object.defineProperty(textarea, 'offsetHeight', { value: 80 });
      const textInput = addField('input', { type: 'text', value: 'plain' });

      await wrapper.vm.printBrowser();
      expect(formRoot.contains(textarea)).toBe(true);
      vi.advanceTimersByTime(500);

      expect(window.print).toHaveBeenCalledTimes(1);
      expect(formRoot.contains(textarea)).toBe(false);
      expect(formRoot.contains(textInput)).toBe(false);
      const textareaDiv = divWithText('line one\nline two');
      expect(textareaDiv.style.width).toBe('100%');
      expect(textareaDiv.style.whiteSpace).toBe('pre-wrap');
      expect(textareaDiv.style.overflowWrap).toBe('anywhere');
      expect(textareaDiv.style.minHeight).toBe('80px');
      expect(divWithText('plain')).toBeTruthy();

      afterPrint();

      expect(formRoot.firstElementChild).toBe(textarea);
      expect(textarea.nextElementSibling).toBe(textInput);
      expect(formRoot.querySelectorAll('div')).toHaveLength(0);
      expect(wrapper.vm.dialog).toBe(true);
    });

    it('skips hidden fields, select helpers and fields outside the form', async () => {
      const notDisplayed = addField('textarea', { value: 'source html' });
      // happy-dom has no layout; display:none yields no client rects
      notDisplayed.getClientRects = () => [];
      const invisible = addField('textarea', { value: 'sizer' });
      invisible.style.visibility = 'hidden';
      const transparent = addField('input', {
        type: 'text',
        className: 'formio-select-autocomplete-input',
      });
      transparent.style.opacity = '0';
      addField('input', { type: 'text', className: 'choices__input' });
      const outside = addField('input', {
        type: 'text',
        value: 'outside',
        parent: document.body,
      });
      onTestFinished(() => outside.remove());

      await clickBrowserPrint();

      expect(formRoot.querySelectorAll('div')).toHaveLength(0);
      expect(document.body.contains(outside)).toBe(true);
    });

    it('sizes the div like a form-control inside a flex row', async () => {
      const row = addField('div');
      row.style.display = 'flex';
      addField('input', { type: 'text', value: 'row', parent: row });
      const column = addField('div');
      column.style.display = 'flex';
      column.style.flexDirection = 'column';
      addField('input', { type: 'text', value: 'column', parent: column });

      await clickBrowserPrint();

      const rowDiv = row.querySelector('div');
      expect(rowDiv.style.flex).toBe('1 1 auto');
      expect(rowDiv.style.width).toBe('1%');
      expect(rowDiv.style.minWidth).toBe('0');
      expect(column.querySelector('div').style.width).toBe('100%');
    });

    it('handles afterprint only once per print', async () => {
      const textInput = addField('input', { type: 'text', value: 'once' });

      await clickBrowserPrint();
      afterPrint();
      wrapper.vm.dialog = false;
      afterPrint();

      expect(formRoot.contains(textInput)).toBe(true);
      expect(wrapper.vm.dialog).toBe(false);
    });

    it('leaves fields in place when the print is ignored', async () => {
      window.print.mockImplementation(() => {});
      const textInput = addField('input', { type: 'text', value: 'kept' });

      await clickBrowserPrint();
      printGoesAhead();

      expect(window.print).toHaveBeenCalledTimes(1);
      expect(formRoot.contains(textInput)).toBe(true);
    });

    it('leaves fields in place when print throws', async () => {
      window.print.mockImplementation(() => {
        throw new Error('print failed');
      });
      const textInput = addField('input', { type: 'text', value: 'kept' });

      await wrapper.vm.printBrowser();
      expect(() => vi.advanceTimersByTime(500)).toThrow('print failed');
      printGoesAhead();

      expect(formRoot.contains(textInput)).toBe(true);
    });

    it('restores fields when unmounted before afterprint', async () => {
      const textInput = addField('input', { type: 'text', value: 'kept' });

      await clickBrowserPrint();
      expect(formRoot.contains(textInput)).toBe(false);
      const { vm } = wrapper;
      wrapper.unmount();
      wrapper = undefined;
      afterPrint();

      expect(formRoot.contains(textInput)).toBe(true);
      expect(formRoot.querySelectorAll('div')).toHaveLength(0);
      expect(vm.dialog).toBe(false);
    });

    it('restores a swap that missed afterprint before swapping again', async () => {
      const textInput = addField('input', { type: 'text', value: 'kept' });

      await clickBrowserPrint();
      await clickBrowserPrint();
      afterPrint();

      expect(formRoot.contains(textInput)).toBe(true);
      expect(formRoot.querySelectorAll('div')).toHaveLength(0);
    });

    it('prints once when Browser Print is clicked twice', async () => {
      await wrapper.vm.printBrowser();
      await clickBrowserPrint();

      expect(window.print).toHaveBeenCalledTimes(1);
    });

    it('prints without swapping when "Expand text fields" is unchecked', async () => {
      const textInput = addField('input', { type: 'text', value: 'kept' });
      wrapper.vm.expandedText = false;

      await clickBrowserPrint();
      afterPrint();

      expect(window.print).toHaveBeenCalledTimes(1);
      expect(formRoot.contains(textInput)).toBe(true);
      expect(wrapper.vm.dialog).toBe(false);
    });
  });

  it('createBody should generate a valid object given some data', async () => {
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: submissionId,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    const body = wrapper.vm.createBody(
      'content',
      'contentFileType',
      'outputFileName',
      'outputFileType'
    );
    expect(body).toEqual({
      options: {
        reportName: 'outputFileName',
        convertTo: 'outputFileType',
        overwrite: true,
      },
      template: {
        content: 'content',
        encodingType: 'base64',
        fileType: 'contentFileType',
      },
    });
  });

  it('fetchDefaultTemplate should run successfully', async () => {
    const documentTemplateListSpy = vi.spyOn(
      formService,
      'documentTemplateList'
    );
    documentTemplateListSpy.mockImplementationOnce(() => {
      return {
        data: [
          {
            id: '0',
            filename: 'filename.txt',
          },
        ],
      };
    });
    const documentTemplateReadSpy = vi.spyOn(
      formService,
      'documentTemplateRead'
    );
    documentTemplateReadSpy.mockImplementationOnce(() => {
      return {
        data: {
          template: {
            data: [],
          },
          filename: 'filename.txt',
          createdAt: 'LeftTRight',
        },
      };
    });
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: submissionId,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.fetchDefaultTemplate();

    expect(documentTemplateListSpy).toHaveBeenCalledTimes(1);
    expect(documentTemplateReadSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledTimes(0);
  });

  it('fetchDefaultTemplate should addNotification if an error is thrown', async () => {
    const documentTemplateListSpy = vi.spyOn(
      formService,
      'documentTemplateList'
    );
    documentTemplateListSpy.mockImplementationOnce(() => {
      throw new Error();
    });
    const documentTemplateReadSpy = vi.spyOn(
      formService,
      'documentTemplateRead'
    );
    documentTemplateReadSpy.mockImplementationOnce(() => {});
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: submissionId,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.fetchDefaultTemplate();

    expect(documentTemplateListSpy).toHaveBeenCalledTimes(1);
    expect(documentTemplateReadSpy).toHaveBeenCalledTimes(0);
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
  });

  it('validateFile should remove the file extension from uploadExportFileTypes when the file input is cleared', async () => {
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: submissionId,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // If this was a text file
    wrapper.vm.templateForm = {
      contentFileType: 'txt',
      files: [],
    };
    // Since this isn't in uploadExportFileTypes then it should be removed from uploadExportFileTypes
    wrapper.vm.uploadExportFileTypes = ['pdf', 'txt'];
    wrapper.vm.validateFile([]);
    expect(wrapper.vm.uploadExportFileTypes).toEqual(['pdf']);
  });

  it('validateFile should set the output filename and set isValidFile to true if the file extension is valid', async () => {
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: submissionId,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // If this was a text file
    wrapper.vm.templateForm = {
      contentFileType: 'txt',
      files: [],
    };
    wrapper.vm.uploadExportFileTypes = ['pdf'];
    wrapper.vm.validateFile([
      {
        name: 'filename.txt',
      },
    ]);
    expect(wrapper.vm.templateForm.outputFileName).toEqual('filename');
    expect(wrapper.vm.isValidFile).toBeTruthy();
  });

  it('validateFile should set the output filename and set isValidFile to false if the file extension is invalid', async () => {
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: submissionId,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // If this was a text file
    wrapper.vm.templateForm = {
      contentFileType: 'zip',
      files: [],
    };
    wrapper.vm.uploadExportFileTypes = ['pdf'];
    wrapper.vm.validateFile([
      {
        name: 'filename.zip',
      },
    ]);
    expect(wrapper.vm.templateForm.outputFileName).toEqual('filename');
    expect(wrapper.vm.isValidFile).toBeFalsy();
  });

  it('generate should run successfully, default selected option, submit it as a cdogs document', async () => {
    const fileToBase64Spy = vi.spyOn(transformUtils, 'fileToBase64');
    fileToBase64Spy.mockImplementation(() => {});
    const createDownloadSpy = vi.spyOn(
      printOptionsComposables,
      'createDownload'
    );
    createDownloadSpy.mockImplementation(() => {});
    const docGenSpy = vi.spyOn(formService, 'docGen');
    docGenSpy.mockImplementation(() => {
      return {
        headers: {
          'content-disposition': 'filename.txt',
        },
      };
    });
    const draftDocGenSpy = vi.spyOn(formService, 'draftDocGen');
    draftDocGenSpy.mockImplementation(() => {});
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: submissionId,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.selectedOption = 'default';

    await flushPromises();

    await wrapper.vm.generate();

    expect(fileToBase64Spy).toBeCalledTimes(0);
    expect(docGenSpy).toBeCalledTimes(1);
    expect(draftDocGenSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledWith({
      color: 'success',
      icon: 'mdi:mdi-check-circle',
      text: 'trans.printOptions.docGrnSucess',
      type: 'success',
    });
  });

  it('generate should run successfully, upload selected option should call fileToBase64, submit it as a cdogs document', async () => {
    const fileToBase64Spy = vi.spyOn(transformUtils, 'fileToBase64');
    fileToBase64Spy.mockImplementation(() => {});
    const createDownloadSpy = vi.spyOn(
      printOptionsComposables,
      'createDownload'
    );
    createDownloadSpy.mockImplementation(() => {});
    const docGenSpy = vi.spyOn(formService, 'docGen');
    docGenSpy.mockImplementation(() => {
      return {
        headers: {
          'content-disposition': 'filename.txt',
        },
      };
    });
    const draftDocGenSpy = vi.spyOn(formService, 'draftDocGen');
    draftDocGenSpy.mockImplementation(() => {});
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: submissionId,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.selectedOption = 'upload';

    await flushPromises();

    await wrapper.vm.generate();

    expect(fileToBase64Spy).toBeCalledTimes(1);
    expect(docGenSpy).toBeCalledTimes(1);
    expect(draftDocGenSpy).toBeCalledTimes(0);
    expect(addNotificationSpy).toBeCalledWith({
      color: 'success',
      icon: 'mdi:mdi-check-circle',
      text: 'trans.printOptions.docGrnSucess',
      type: 'success',
    });
  });

  it('generate should run successfully, default selected option, submit it as a cdogs draft document if there is no submission id', async () => {
    const fileToBase64Spy = vi.spyOn(transformUtils, 'fileToBase64');
    fileToBase64Spy.mockImplementation(() => {});
    const createDownloadSpy = vi.spyOn(
      printOptionsComposables,
      'createDownload'
    );
    createDownloadSpy.mockImplementation(() => {});
    const docGenSpy = vi.spyOn(formService, 'docGen');
    docGenSpy.mockImplementation(() => {});
    const draftDocGenSpy = vi.spyOn(formService, 'draftDocGen');
    draftDocGenSpy.mockImplementation(() => {
      return {
        headers: {
          'content-disposition': 'filename.txt',
        },
      };
    });
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: null,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.selectedOption = 'default';

    await flushPromises();

    await wrapper.vm.generate();

    expect(fileToBase64Spy).toBeCalledTimes(0);
    expect(docGenSpy).toBeCalledTimes(0);
    expect(draftDocGenSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      color: 'success',
      icon: 'mdi:mdi-check-circle',
      text: 'trans.printOptions.docGrnSucess',
      type: 'success',
    });
  });

  it('generate should add error notification if an error is thrown', async () => {
    const fileToBase64Spy = vi.spyOn(transformUtils, 'fileToBase64');
    fileToBase64Spy.mockImplementation(() => {});
    const createDownloadSpy = vi.spyOn(
      printOptionsComposables,
      'createDownload'
    );
    createDownloadSpy.mockImplementation(() => {});
    const docGenSpy = vi.spyOn(formService, 'docGen');
    docGenSpy.mockImplementation(() => {});
    const draftDocGenSpy = vi.spyOn(formService, 'draftDocGen');
    draftDocGenSpy.mockImplementation(() => {
      throw new Error();
    });
    let submission = undefined;
    formStore.form = {
      id: 0,
      name: 'This is a form title',
    };
    const wrapper = mount(PrintOptions, {
      props: {
        submissionId: null,
        submission: submission,
        f: '0',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.selectedOption = 'default';

    await flushPromises();

    await wrapper.vm.generate();

    expect(fileToBase64Spy).toBeCalledTimes(0);
    expect(docGenSpy).toBeCalledTimes(0);
    expect(draftDocGenSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      consoleError: 'trans.printOptions.failedDocGenErrMsg',
      text: 'trans.printOptions.failedDocGenErrMsg',
    });
  });
});
