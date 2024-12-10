// @vitest-environment happy-dom
// happy-dom is required to access window.URL

import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { Formio } from '@formio/vue';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import getRouter from '~/router';
import FormViewerMultiUpload from '~/components/designer/FormViewerMultiUpload.vue';
import { formService } from '~/services';
import { useAppStore } from '~/store/app';
import { useNotificationStore } from '~/store/notification';
import { nextTick } from 'vue';

const ERROR = {
  UPLOAD_MULTIPLE_FILE_ERROR:
    'trans.formViewerMultiUpload.uploadMultipleFileErr',
  DRAG_MULPLE_FILE_ERROR: 'trans.formViewerMultiUpload.dragMultipleFileErr',
  FILE_FORMAT_ERROR: 'trans.formViewerMultiUpload.fileFormatErr',
  FILE_SIZE_ERROR: 'trans.formViewerMultiUpload.fileSizeErr',
  PARSE_JSON_ERROR: 'We can not parse json data from the file',
  JSON_OBJECT_NOT_ARRAY: 'Wrong json file format',
  JSON_ARRAY_EMPTY: 'This json file is empty.',
  ERROR_WHILE_VALIDATE: 'There is something wrong with this file',
  ERROR_WHILE_CHECKVALIDITY: 'There is something wrong with this file',
  ERROR_AFTER_VALIDATE: 'Some errors found, see below for more information.',
};

const SUBMISSION_VERSION = '123';

const PROPS = {
  form: {
    id: '123-456',
    name: 'test form',
  },
  formSchema: {},
  submissionVersion: SUBMISSION_VERSION,
  jsonCsv: {
    data: [],
    file_name: '',
  },
};

const STUBS = {
  BaseInfoCard: {
    name: 'BaseInfoCard',
    template: '<div class="base-info-card-stub"><slot /></div>',
  },
};

vi.mock('@formio/vue', () => ({
  Formio: {
    createForm: vi.fn(),
  },
}));

vi.mock('~/composables/form', () => ({
  delay: vi.fn(),
}));

describe('FormViewerMultiUpload.vue', () => {
  const formId = '123-456';
  const pinia = createPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const appStore = useAppStore();
  const notificationStore = useNotificationStore();
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

  const fileData = (sizeInByte) => {
    // Generate fake file data
    const bytesPerItem = Math.floor(sizeInByte / 100); // adjust as needed
    const numItems = Math.floor(100 / bytesPerItem); // adjust as needed
    const fileData = [];
    for (let i = 0; i < numItems; i++) {
      const item = {};
      for (let j = 0; j < bytesPerItem / 2; j++) {
        item[String.fromCharCode(65 + Math.floor(Math.random() * 26))] =
          Math.floor(Math.random() * 10);
      }
      fileData.push(item);
    }
    return fileData;
  };

  beforeEach(() => {
    appStore.$reset();
    notificationStore.$reset();
    addNotificationSpy.mockReset();
    appStore.config = {
      uploads: {
        fileMaxSizeBytes: 10000,
      },
    };
  });

  it('renders', () => {
    const wrapper = mount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('trans.formViewerMultiUpload.important');
    expect(wrapper.text()).toContain('trans.formViewerMultiUpload.json');
  });

  it('fileSize returns the file size according to the size bytes, KB, MB', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.file = {
      size: 0,
    };

    expect(wrapper.vm.fileSize).toEqual('0.00 bytes');

    wrapper.vm.file = {
      size: 1024,
    };

    expect(wrapper.vm.fileSize).toEqual('1.00 KB');

    wrapper.vm.file = {
      size: 1048576,
    };

    expect(wrapper.vm.fileSize).toEqual('1.00 MB');
  });

  it('txt_colour returns success-text if there is no error in sbdMessage otherwise fail-text', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.txt_colour).toEqual('success-text');

    wrapper.vm.sbdMessage = {
      error: true,
    };

    expect(wrapper.vm.txt_colour).toEqual('fail-text');
  });

  it('download calls createObjectURL and revokeObjectURL', async () => {
    let createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
    createObjectURLSpy.mockImplementation((data) => data);
    let revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL');
    revokeObjectURLSpy.mockImplementation((data) => data);
    let windowConfirmSpy = vi.spyOn(window, 'confirm');
    windowConfirmSpy.mockImplementation(() => true);
    const wrapper = shallowMount(FormViewerMultiUpload, {
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.download('filename.txt', {});

    expect(createObjectURLSpy).toBeCalledTimes(1);
    expect(revokeObjectURLSpy).toBeCalledTimes(1);
  });

  describe('#addFile', () => {
    it('should return undefined when some data is in process', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      // Mock FileReader
      window.FileReader = function () {
        this.readAsText = vi.fn();
        this.onload = null;
        this.onloadend = null;
      };

      wrapper.vm.isProcessing = true;

      // act
      wrapper.vm.addFile(
        {
          dataTransfer: {
            files: [],
          },
        },
        0
      );

      // assert
      expect(addNotificationSpy).not.toHaveBeenCalled();
    });

    it('should return undefined when no file select', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });
      // act
      wrapper.vm.addFile(null, 1);
      // assert
      expect(addNotificationSpy).toHaveBeenCalled();
    });

    it('should return undefined when no file drag', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });
      // act
      wrapper.vm.addFile({ dataTransfer: { files: undefined } }, 0);
      // assert
      expect(addNotificationSpy).not.toHaveBeenCalled();
    });

    it('should return undefined when a file already drag', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });
      const file = new File(['{}'], 'test.json', {
        type: 'application/json',
      });

      wrapper.vm.file = file;

      // act
      wrapper.vm.addFile({}, 0);
      // assert
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: ERROR.UPLOAD_MULTIPLE_FILE_ERROR,
        text: ERROR.UPLOAD_MULTIPLE_FILE_ERROR,
      });
    });

    it('should show notification when submitter drag multiple files', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });
      const file = new File(['{}'], 'test.json', {
        type: 'application/json',
      });

      // act
      wrapper.vm.addFile({ dataTransfer: { files: [file, file] } }, 0);
      // assert
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: ERROR.DRAG_MULPLE_FILE_ERROR,
        text: ERROR.DRAG_MULPLE_FILE_ERROR,
      });
    });

    it('should show notification when file format is not JSON', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });
      const file = new File(['{}'], 'test.csv', {
        type: 'text/json',
      });

      // act
      wrapper.vm.addFile({ target: { files: [file] } }, 1);
      // assert
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: ERROR.FILE_FORMAT_ERROR,
        text: ERROR.FILE_FORMAT_ERROR,
      });
    });

    it('should show notification when file size is over', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });
      // act
      appStore.config.uploads.fileMaxSizeBytes = 0;
      const file = new File([JSON.stringify(fileData(1000))], 'test.json', {
        type: 'application/json',
      });
      wrapper.vm.addFile({ target: { files: [file] } }, 1);
      // assert
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: ERROR.FILE_SIZE_ERROR,
        text: ERROR.FILE_SIZE_ERROR,
      });
    });

    it('should show no notification when file is ok', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      // Mock FileReader
      window.FileReader = function () {
        this.readAsText = vi.fn();
        this.onload = null;
        this.onloadend = null;
      };
      // act
      const file = new File(['{}'], 'test.json', {
        type: 'application/json',
      });
      wrapper.vm.addFile({ target: { files: [file] } }, 1);
      // assert
      expect(addNotificationSpy).not.toHaveBeenCalled();
    });
  });
  // it is not necessary to test if the FileReader functionality or JSON.parse functionality works.

  it('handleFile will call fileRefs click function if file is undefined', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    const clickSpy = vi.fn();

    wrapper.vm.fileRef = {
      click: clickSpy,
    };

    wrapper.vm.handleFile();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('popFormLevelInfo will remove unnecessary information from the json payload of submissions', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(
      wrapper.vm.popFormLevelInfo([
        {
          submit: true,
          lateEntry: true,
          form: {
            confirmationId: '',
            formName: '',
            version: '',
            createdAt: '',
            fullName: '',
            username: '',
            email: '',
            status: '',
            assignee: '',
            assigneeEmail: '',
          },
        },
      ])
    ).toEqual([{ form: {} }]);
  });

  describe('preValidateSubmission', () => {
    it('will addNotification and return if fileReaderData is not an array', async () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.fileReaderData = {};

      await wrapper.vm.preValidateSubmission();

      expect(addNotificationSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledWith({
        text: 'trans.formViewerMultiUpload.jsonObjNotArray',
        consoleError: 'trans.formViewerMultiUpload.jsonObjNotArrayConsErr',
      });
    });
    it('will addNotification and return if fileReaderData is an empty array', async () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      wrapper.vm.fileReaderData = [];

      await wrapper.vm.preValidateSubmission();

      expect(addNotificationSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledWith({
        text: 'trans.formViewerMultiUpload.jsonArrayEmpty',
        consoleError: 'trans.formViewerMultiUpload.fileIsEmpty',
      });
    });
    it('will try to validate a submission', async () => {
      const wrapper = mount(FormViewerMultiUpload, {
        props: {
          form: {},
          formSchema: {
            components: [
              {
                type: 'number',
                key: 'firstname',
                validate: {
                  custom: '',
                },
              },
              {
                type: 'simplenumber',
                validate: {
                  custom: '',
                },
              },
              {
                type: 'simplenumberadvanced',
                validate: {
                  custom: '',
                },
              },
              {
                type: 'simpledatetimeadvanced',
                validate: {
                  custom: '',
                },
                widget: {
                  format: '',
                },
              },
              {
                type: 'simpledatetime',
                validate: {
                  custom: '',
                },
                widget: {
                  format: '',
                },
              },
              {
                type: 'simpletimeadvanced',
                validate: {
                  custom: '',
                },
                widget: {
                  format: '',
                },
              },
            ],
          },
          submissionVersion: SUBMISSION_VERSION,
          jsonCsv: {
            data: [],
            file_name: '',
          },
        },
        global: {
          plugins: [router, pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      addNotificationSpy.mockReset();

      const createMultiSubmissionSpy = vi.spyOn(
        formService,
        'createMultiSubmission'
      );
      createMultiSubmissionSpy.mockImplementationOnce(() => {
        return {
          status: 200,
        };
      });

      wrapper.vm.fileReaderData = [
        {
          firstname: 'john',
        },
      ];

      wrapper.vm.delayTime = 0;

      const createFormSpy = vi.fn();
      const submitSpy = vi.fn();
      createFormSpy.mockImplementation(() => {
        return {
          setSubmission: vi.fn(),
          clearServerErrors: vi.fn(),
          resetValue: vi.fn(),
          clear: vi.fn(),
          submit: submitSpy,
          destroy: vi.fn(),
        };
      });

      Formio.createForm = createFormSpy;

      submitSpy.mockImplementation(() => {
        return Promise.resolve({});
      });

      await wrapper.vm.preValidateSubmission();

      // Multiple nextTicks called
      // calling nextTick in preValidateSubmission
      await nextTick();
      // calling nextTick in validationDispatcher
      await nextTick();

      expect(wrapper.emitted()).toHaveProperty('isProcessingMultiUpload');
    });
  });

  it('convertEmptyArraysToNull will convert all empty arrays to null', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.convertEmptyArraysToNull([{ shouldBeNull: [] }])).toEqual(
      [{ shouldBeNull: null }]
    );
    expect(wrapper.vm.convertEmptyArraysToNull({ shouldBeNull: [] })).toEqual({
      shouldBeNull: null,
    });
    expect(wrapper.vm.convertEmptyArraysToNull('')).toEqual('');
  });

  it('formIOValidation will resolve with an object of error false if it is valid', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    const setSubmissionSpy = vi.fn();
    const submitSpy = vi.fn();

    submitSpy.mockImplementationOnce(() => {
      return Promise.resolve({});
    });

    wrapper.vm.submissionToValidate = {
      setSubmission: setSubmissionSpy,
      submit: submitSpy,
    };

    expect(await wrapper.vm.formIOValidation({})).toEqual({
      error: false,
      data: {},
    });
    expect(setSubmissionSpy).toBeCalledTimes(1);
    expect(submitSpy).toBeCalledTimes(1);

    setSubmissionSpy.mockReset();
    submitSpy.mockReset();

    submitSpy.mockImplementationOnce(() => {
      return Promise.reject({});
    });

    wrapper.vm.submissionToValidate = {
      setSubmission: setSubmissionSpy,
      submit: submitSpy,
    };

    expect(await wrapper.vm.formIOValidation({})).toEqual({
      error: true,
      data: {},
    });
    expect(setSubmissionSpy).toBeCalledTimes(1);
    expect(submitSpy).toBeCalledTimes(1);
  });

  it('percentage will return a percentage based on fileReaderData', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.fileReaderData = [0, 0];
    expect(wrapper.vm.percentage(0)).toEqual(0);
    expect(wrapper.vm.percentage(1)).toEqual(50);
    expect(wrapper.vm.percentage(2)).toEqual(100);
  });

  it('endValidation will sendSubmissionData if there are no errors', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    const createMultiSubmissionSpy = vi.spyOn(
      formService,
      'createMultiSubmission'
    );
    createMultiSubmissionSpy.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 500,
      });
    });

    wrapper.vm.submissionToValidate = {
      destroy: vi.fn(),
    };

    wrapper.vm.file = {
      name: 'filename.txt',
    };

    await wrapper.vm.endValidation([]);

    expect(createMultiSubmissionSpy).toBeCalledTimes(1);
  });

  it('endValidation will emit isProcessingMultiUpload with false if there are errors', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.submissionToValidate = {
      destroy: vi.fn(),
    };

    await wrapper.vm.endValidation([
      {
        message: '123',
      },
    ]);

    expect(wrapper.emitted()).toHaveProperty('isProcessingMultiUpload');
  });

  it('resetUploadState will reset sbdMessage to default values', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.sbdMessage = {
      message: '',
      error: '',
      upload_state: 1,
      response: ['something'],
      file_name: '',
      typeError: 0,
    };
    wrapper.vm.isProcessing = true;

    wrapper.vm.resetUploadState();

    expect(wrapper.vm.sbdMessage).toEqual({
      message: undefined,
      error: false,
      upload_state: 0,
      response: [],
      file_name: undefined,
      typeError: -1,
    });
    expect(wrapper.vm.isProcessing).toBeFalsy();
  });

  describe('saveBulkData and sendMultiSubmissionData', () => {
    it('sendMultiSubmissionData sets success message for sbdMessage and addsNotification on success', async () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      addNotificationSpy.mockReset();

      const createMultiSubmissionSpy = vi.spyOn(
        formService,
        'createMultiSubmission'
      );
      createMultiSubmissionSpy.mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
        });
      });

      wrapper.vm.versionIdToSubmitTo = 1;
      await wrapper.vm.sendMultiSubmissionData({});
      expect(createMultiSubmissionSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledWith({
        text: 'trans.formViewer.multiDraftUploadSuccess',
        color: 'success',
        icon: 'mdi:mdi-check-circle',
        type: 'success',
      });
      expect(addNotificationSpy).toBeCalledTimes(1);
      expect(wrapper.vm.sbdMessage).toEqual({
        file_name: undefined,
        typeError: -1,
        message: 'trans.formViewer.multiDraftUploadSuccess',
        error: false,
        upload_state: 10,
        response: [],
      });
      expect(wrapper.vm.isProcessing).toBeFalsy();
      expect(wrapper.vm.saving).toBeFalsy();
    });
    it('saveBulkData will call sendMultiSubmissionData with the submissions given', async () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      addNotificationSpy.mockReset();

      const createMultiSubmissionSpy = vi.spyOn(
        formService,
        'createMultiSubmission'
      );
      createMultiSubmissionSpy.mockImplementationOnce(() => {
        return Promise.resolve({
          status: 200,
        });
      });

      wrapper.vm.versionIdToSubmitTo = 1;
      await wrapper.vm.saveBulkData([
        {
          id: '123',
        },
        {
          id: '124',
        },
      ]);
      expect(createMultiSubmissionSpy).toBeCalledTimes(1);
      expect(createMultiSubmissionSpy).toBeCalledWith(
        formId,
        SUBMISSION_VERSION,
        {
          draft: true,
          submission: {
            data: [
              {
                id: '123',
              },
              {
                id: '124',
              },
            ],
          },
        }
      );
    });
    it('sendMultiSubmissionData sets failure message for sbdMessage and addsNotification if response status does not contain status 200 or 201', async () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();
      addNotificationSpy.mockReset();
      const createMultiSubmissionSpy = vi.spyOn(
        formService,
        'createMultiSubmission'
      );
      createMultiSubmissionSpy.mockImplementationOnce(async () => {
        return Promise.resolve({
          status: 500,
          response: {
            data: '',
            status: 500,
          },
        });
      });

      wrapper.vm.file = {
        name: 'filename.txt',
      };
      wrapper.vm.versionIdToSubmitTo = 1;
      await wrapper.vm.sendMultiSubmissionData({});
      expect(createMultiSubmissionSpy).toBeCalledTimes(1);
      expect(addNotificationSpy).toBeCalledWith({
        text: 'trans.formViewer.errSubmittingForm',
        consoleError: 'trans.formViewer.errorSavingFile',
      });
      expect(addNotificationSpy).toBeCalledTimes(1);
    });
  });

  describe('setFinalError', () => {
    it('by default it will set sbdMessage message, error, upload_state, response', async () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.setFinalError({
        response: {},
      });

      expect(wrapper.vm.sbdMessage.message).toEqual(
        'trans.formViewer.errSubmittingForm'
      );
      expect(wrapper.vm.sbdMessage.error).toBeTruthy();
      expect(wrapper.vm.sbdMessage.upload_state).toEqual(10);
      expect(wrapper.vm.sbdMessage.response).toEqual([
        {
          error_message: 'trans.formViewer.errSubmittingForm',
        },
      ]);
    });
    it('if error.response.data is not undefined then it will give a default message if response reports is undefined', async () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.setFinalError({
        response: {
          data: {
            title: 'some title',
          },
        },
      });

      expect(wrapper.vm.sbdMessage.message).toEqual('some title');
      expect(wrapper.vm.sbdMessage.error).toBeTruthy();
      expect(wrapper.vm.sbdMessage.upload_state).toEqual(10);
      expect(wrapper.vm.sbdMessage.response).toEqual([
        {
          error_message: 'trans.formViewer.errSubmittingForm',
        },
      ]);
    });
    it('if error.response.data is not undefined then it will format that error message', async () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        props: PROPS,
        global: {
          provide: {
            setWideLayout: vi.fn(),
          },
          plugins: [pinia],
          stubs: STUBS,
        },
      });

      await flushPromises();

      await wrapper.vm.setFinalError({
        error: true,
        file_name: 'error_report_000000',
        message: 'Validation Error',
        response: {
          data: {
            title: 'some title',
            reports: [
              {
                details: [
                  {
                    message: 'an error occurred',
                  },
                  {
                    context: {
                      key: null,
                      label: null,
                      validator: null,
                      message: 'context error',
                    },
                  },
                ],
              },
            ],
          },
        },
        text: 'Some errors found, see below for more information.',
        typeError: 0,
        upload_state: 10,
      });

      expect(wrapper.vm.sbdMessage.message).toEqual('some title');
      expect(wrapper.vm.sbdMessage.error).toBeTruthy();
      expect(wrapper.vm.sbdMessage.upload_state).toEqual(10);
      expect(wrapper.vm.sbdMessage.response).toEqual([
        {
          key: null,
          label: null,
          submission: 0,
          validator: null,
          error_message: 'an error occurred',
        },
        {
          key: null,
          label: null,
          submission: 0,
          validator: null,
          error_message: undefined,
        },
      ]);
    });
  });

  it('buildValidationFromComponent returns unknown if it is not a valid object', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.vm.buildValidationFromComponent({})).toEqual('Unknown');
    expect(
      wrapper.vm.buildValidationFromComponent({
        messages: [
          {
            context: {
              validator: 'validator',
            },
          },
        ],
      })
    ).toEqual('validator');
    expect(
      wrapper.vm.buildValidationFromComponent({
        component: {
          validate: {
            maxSelectedCount: 10,
            minSelectedCount: 1,
            multiple: true,
            onlyAvailableItems: true,
            required: true,
            strictDateValidation: true,
            unique: true,
            custom: 'if(component.validate.required === true){}',
            customMessage: 'custom message',
            customPrivate: '  d',
            json: '{}',
            pattern: '123',
            maxWords: 10,
            minWords: 1,
            maxLength: 10,
            minLength: 1,
            something: '123',
          },
        },
      })
    ).toEqual(
      'maxSelectedCount:10|minSelectedCount:1|multiple:true|onlyAvailableItems:true|required:true|strictDateValidation:true|unique:true|custom:if(component.validate.required === true){}|customMessage:custom message|customPrivate:d|json:{}|pattern:123|maxWords:10|minWords:1|maxLength:10|minLength:1|something:123'
    );
  });

  it('frontendFormatResponse will format the response message', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        plugins: [router, pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(
      await wrapper.vm.frontendFormatResponse([
        {
          submission: 0,
          errors: [
            {
              message: 'Date / Time is required',
              external: false,
              formattedKeyOrPath: 'simpledatetimeadvanced',
              component: {
                key: 'simpledatetime',
                label: 'End Date',
                type: 'simpledatetime',
              },
              messages: [
                {
                  message: 'Date / Time is required',
                  level: 'error',
                },
              ],
            },
            {
              message: 'This is the validation error message',
            },
          ],
        },
      ])
    ).toEqual([
      {
        error_message: 'Date / Time is required',
        key: 'simpledatetime',
        label: 'End Date',
        submission: 0,
        validator: 'Unknown',
      },
      {
        error_message: 'This is the validation error message',
        key: null,
        label: null,
        submission: 0,
        validator: null,
      },
    ]);
  });

  it('setError will give a default error if there is no response data', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.setError({
      response: {},
    });

    expect(wrapper.vm.sbdMessage.message).toEqual(
      'trans.formViewer.errSubmittingForm'
    );
    expect(wrapper.vm.sbdMessage.error).toBeTruthy();
    expect(wrapper.vm.sbdMessage.upload_state).toEqual(10);
    expect(wrapper.vm.sbdMessage.response).toEqual([
      {
        error_message: 'trans.formViewer.errSubmittingForm',
      },
    ]);
  });

  it('setError will format the response if there is response data', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.setError({
      response: {
        data: {
          title: 'some title',
          reports: [
            {
              errors: [
                {
                  message: 'some error',
                },
              ],
            },
          ],
        },
      },
    });

    expect(wrapper.vm.sbdMessage.message).toEqual('some title');
    expect(wrapper.vm.sbdMessage.error).toBeTruthy();
    expect(wrapper.vm.sbdMessage.upload_state).toEqual(10);
    expect(wrapper.vm.sbdMessage.response).toEqual([
      {
        key: null,
        label: null,
        submission: undefined,
        validator: null,
        error_message: 'some error',
      },
    ]);
  });

  it('setError will give a default error if an error occurs', async () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      props: PROPS,
      global: {
        provide: {
          setWideLayout: vi.fn(),
        },
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    await wrapper.vm.setError({
      response: {
        data: {
          title: 'some title',
          reports: {},
        },
      },
    });

    expect(wrapper.vm.sbdMessage.message).toEqual(
      'trans.formViewer.errSubmittingForm'
    );
    expect(wrapper.vm.sbdMessage.error).toBeTruthy();
    expect(wrapper.vm.sbdMessage.upload_state).toEqual(10);
    expect(wrapper.vm.sbdMessage.response).toEqual([
      {
        error_message: 'trans.formViewer.errSubmittingForm',
      },
    ]);
  });
});
