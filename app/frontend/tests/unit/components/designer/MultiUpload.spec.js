import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import getRouter from '~/router';
import FormViewerMultiUpload from '~/components/designer/FormViewerMultiUpload.vue';
import { useAppStore } from '~/store/app';
import { useNotificationStore } from '~/store/notification';

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

describe('FormViewerMultiUpload.vue', () => {
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
      props: {
        formElement: undefined,
        form: {},
        formSchema: {},
        formFields: [],
        block: false,
        response: {
          message: '',
          error: false,
          upload_state: 0,
          response: [],
          file_name: '',
        },
        jsonCsv: {
          data: [],
          file_name: '',
        },
      },
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toContain('trans.formViewerMultiUpload.important');
    expect(wrapper.text()).toContain('trans.formViewerMultiUpload.json');
  });

  describe('#addFile', () => {
    it('should return undefined when some data is in process', () => {
      const wrapper = mount(FormViewerMultiUpload, {
        props: {
          formElement: undefined,
          form: {},
          formSchema: {},
          formFields: [],
          block: true,
          response: {
            message: '',
            error: false,
            upload_state: 0,
            response: [],
            file_name: '',
          },
          jsonCsv: {
            data: [],
            file_name: '',
          },
        },
        global: {
          plugins: [router, pinia],
        },
      });
      const parseFileSpy = vi.spyOn(wrapper.vm, 'parseFile');
      // act
      wrapper.vm.addFile(null, 0);
      // assert
      expect(addNotificationSpy).not.toHaveBeenCalled();
      expect(parseFileSpy).not.toHaveBeenCalled();
    });

    it('should return undefined when no file select', () => {
      const wrapper = mount(FormViewerMultiUpload, {
        props: {
          formElement: undefined,
          form: {},
          formSchema: {},
          formFields: [],
          block: false,
          response: {
            message: '',
            error: false,
            upload_state: 0,
            response: [],
            file_name: '',
          },
          jsonCsv: {
            data: [],
            file_name: '',
          },
        },
        global: {
          plugins: [router, pinia],
        },
      });
      // act
      wrapper.vm.addFile(null, 1);
      // assert
      expect(addNotificationSpy).toHaveBeenCalled();
    });

    it('should return undefined when no file drag', () => {
      const wrapper = mount(FormViewerMultiUpload, {
        props: {
          formElement: undefined,
          form: {},
          formSchema: {},
          formFields: [],
          block: false,
          response: {
            message: '',
            error: false,
            upload_state: 0,
            response: [],
            file_name: '',
          },
          jsonCsv: {
            data: [],
            file_name: '',
          },
        },
        global: {
          plugins: [router, pinia],
        },
      });
      // act
      wrapper.vm.addFile({ dataTransfer: { files: undefined } }, 0);
      // assert
      expect(addNotificationSpy).not.toHaveBeenCalled();
    });

    it('should return undefined when a file already drag', () => {
      const wrapper = mount(FormViewerMultiUpload, {
        props: {
          formElement: undefined,
          form: {},
          formSchema: {},
          formFields: [],
          block: false,
          response: {
            message: '',
            error: false,
            upload_state: 0,
            response: [],
            file_name: '',
          },
          jsonCsv: {
            data: [],
            file_name: '',
          },
        },
        global: {
          plugins: [router, pinia],
        },
      });
      const file = new File(['{}'], 'test.json', {
        type: 'application/json',
      });
      wrapper.setData({ file: file });

      // act
      wrapper.vm.addFile({}, 0);
      // assert
      expect(addNotificationSpy).toHaveBeenCalledWith({
        consoleError: ERROR.UPLOAD_MULTIPLE_FILE_ERROR,
        text: ERROR.UPLOAD_MULTIPLE_FILE_ERROR,
      });
    });

    it('should show notification when submitter drag multiple files', () => {
      const wrapper = mount(FormViewerMultiUpload, {
        props: {
          formElement: undefined,
          form: {},
          formSchema: {},
          formFields: [],
          block: false,
          response: {
            message: '',
            error: false,
            upload_state: 0,
            response: [],
            file_name: '',
          },
          jsonCsv: {
            data: [],
            file_name: '',
          },
        },
        global: {
          plugins: [router, pinia],
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
      const wrapper = mount(FormViewerMultiUpload, {
        props: {
          formElement: undefined,
          form: {},
          formSchema: {},
          formFields: [],
          block: false,
          response: {
            message: '',
            error: false,
            upload_state: 0,
            response: [],
            file_name: '',
          },
          jsonCsv: {
            data: [],
            file_name: '',
          },
        },
        global: {
          plugins: [router, pinia],
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
      const wrapper = mount(FormViewerMultiUpload, {
        props: {
          formElement: undefined,
          form: {},
          formSchema: {},
          formFields: [],
          block: false,
          response: {
            message: '',
            error: false,
            upload_state: 0,
            response: [],
            file_name: '',
          },
          jsonCsv: {
            data: [],
            file_name: '',
          },
        },
        global: {
          plugins: [router, pinia],
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
      const wrapper = mount(FormViewerMultiUpload, {
        props: {
          formElement: undefined,
          form: {},
          formSchema: {},
          formFields: [],
          block: false,
          response: {
            message: '',
            error: false,
            upload_state: 0,
            response: [],
            file_name: '',
          },
          jsonCsv: {
            data: [],
            file_name: '',
          },
        },
        global: {
          plugins: [router, pinia],
        },
      });
      // act
      const parseFileSpy = vi.spyOn(wrapper.vm, 'parseFile');
      const file = new File(['{}'], 'test.json', {
        type: 'application/json',
      });
      wrapper.vm.addFile({ target: { files: [file] } }, 1);
      // assert
      expect(addNotificationSpy).not.toHaveBeenCalled();
      expect(parseFileSpy).toHaveBeenCalled();
    });
  });
  // it is not necessary to test if the FileReader functionality or JSON.parse functionality works.
});
