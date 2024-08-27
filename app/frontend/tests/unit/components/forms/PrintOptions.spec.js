// @vitest-environment happy-dom
// happy-dom is required to access window.URL
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, expect, vi } from 'vitest';

import PrintOptions from '~/components/forms/PrintOptions.vue';
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
    const draftDocGenSpy = vi.spyOn(utilsService, 'draftDocGen');
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
    const draftDocGenSpy = vi.spyOn(utilsService, 'draftDocGen');
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
    const draftDocGenSpy = vi.spyOn(utilsService, 'draftDocGen');
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
    const draftDocGenSpy = vi.spyOn(utilsService, 'draftDocGen');
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
