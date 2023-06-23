import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import i18n from '@/internationalization';

import FormViewerMultiUpload from '@/components/designer/FormViewerMultiUpload.vue';

const localVue = createLocalVue();
localVue.use(Vuetify);
localVue.use(Vuex);
const ERROR = {
  UPLOAD_MULTIPLE_FILE_ERROR: 'Sorry, you can upload only one file',
  DRAG_MULPLE_FILE_ERROR: 'Sorry, you can drag only one file',
  FILE_FORMAT_ERROR: 'Sorry, we only accept json files',
  FILE_SIZE_ERROR: 'Max file size allowed is 5MB',
  PARSE_JSON_ERROR: 'We can not parse json data from the file',
  JSON_OBJECT_NOT_ARRAY: 'Wrong json file format',
  JSON_ARRAY_EMPTY: 'This json file is empty.',
  ERROR_WHILE_VALIDATE: 'There is something wrong with this file',
  ERROR_WHILE_CHECKVALIDITY: 'There is something wrong with this file',
  ERROR_AFTER_VALIDATE: 'Some errors found, see below for more information.',
};

describe('FormViewerMultiUpload.vue', () => {
  let store;
  let stubs;
  let notificationData;
  let notifactionActions;
  let methods;
  let props;
  const fileData = (sizeInByte) => {
    // Generate fake file data
    const bytesPerItem = Math.floor(sizeInByte / 100); // adjust as needed
    const numItems = Math.floor(100 / bytesPerItem); // adjust as needed
    const fileData = [];
    for (let i = 0; i < numItems; i++) {
      const item = {};
      for (let j = 0; j < bytesPerItem / 2; j++) {
        item[String.fromCharCode(65 + Math.floor(Math.random() * 26))] = Math.floor(Math.random() * 10);
      }
      fileData.push(item);
    }
    return fileData;
  };

  let data;

  beforeEach(() => {
    stubs = ['BaseInfoCard', 'vue-blob-json-csv'];
    data = {
      file: {},
      Json: [],
    };
    notificationData = Object({
      message: '',
      consoleError: '',
    });
    notifactionActions = {
      addNotification: jest.fn(),
    };
    methods = {
      parseFile: jest.fn(),
    };

    props = {
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
      json_csv: {
        data: [],
        file_name: '',
      },
    };
    store = new Vuex.Store({
      modules: {
        notifications: {
          namespaced: true,
          actions: notifactionActions,
        },
      },
    });
  });

  afterEach(() => {
    notifactionActions.addNotification.mockReset();
  });

  it('renders', () => {
    const wrapper = shallowMount(FormViewerMultiUpload, {
      localVue,
      i18n,
      propsData: {
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
        json_csv: {
          data: [],
          file_name: '',
        },
      },
      store,
      stubs: ['BaseDialog', 'BaseInfoCard'],
    });
    expect(wrapper.text()).toContain('infoIMPORTANT!');
    expect(wrapper.text()).toContain('JSON');
  });

  describe('#addFile', () => {
    it('should return undefined when some data is in process', () => {
      props.block = true;
      const wrapper = shallowMount(FormViewerMultiUpload, {
        localVue,
        propsData: props,
        store,
        i18n,
        methods: methods,
        stubs: stubs,
      });
      // act
      wrapper.vm.addFile(null, 0);
      // assert
      expect(notifactionActions.addNotification).not.toHaveBeenCalled();
      expect(methods.parseFile).not.toHaveBeenCalled();
    });

    it('should return undefined when no file select', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        localVue,
        propsData: props,
        methods: methods,
        store,
        i18n,
        stubs: stubs,
      });
      // act
      wrapper.vm.addFile(null, 1);
      // assert
      expect(notifactionActions.addNotification).toHaveBeenCalled();
    });

    it('should return undefined when no file drag', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        localVue,
        propsData: props,
        methods: methods,
        store,
        i18n,
        stubs: stubs,
      });
      // act
      wrapper.vm.addFile({ dataTransfer: { files: undefined } }, 0);
      // assert
      expect(notifactionActions.addNotification).not.toHaveBeenCalled();
    });

    it('should show a notification when a file already drag', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        localVue,
        propsData: props,
        methods: methods,
        store,
        i18n,
        stubs: stubs,
      });
      const file = new File(['{}'], 'test.json', { type: 'application/json' });

      wrapper.setData({ file: file });
      wrapper.vm.addFile({}, 0);
      // assert
      notificationData.message = ERROR.UPLOAD_MULTIPLE_FILE_ERROR;
      notificationData.consoleError = ERROR.UPLOAD_MULTIPLE_FILE_ERROR;
      expect(notifactionActions.addNotification).toHaveBeenCalledWith(expect.anything(), notificationData);
    });

    it('should show notification when submitter drag multiple files', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        localVue,
        propsData: props,
        methods: methods,
        store,
        i18n,
        stubs: stubs,
      });
      // act
      const file = new File(['{}'], 'test.json', { type: 'application/json' });

      wrapper.vm.addFile({ dataTransfer: { files: [file, file] } }, 0);
      // assert
      notificationData.message = ERROR.DRAG_MULPLE_FILE_ERROR;
      notificationData.consoleError = ERROR.DRAG_MULPLE_FILE_ERROR;
      expect(notifactionActions.addNotification).toHaveBeenCalledWith(expect.anything(), notificationData);
    });

    it('should show notification when file format is not JSON', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        localVue,
        propsData: props,
        methods: methods,
        store,
        i18n,
        stubs: stubs,
      });
      // act
      const file = new File(['{}'], 'test.csv', { type: 'text/json' });
      wrapper.vm.addFile({ target: { files: [file] } }, 1);
      // assert
      notificationData.message = ERROR.FILE_FORMAT_ERROR;
      notificationData.consoleError = ERROR.FILE_FORMAT_ERROR;
      expect(notifactionActions.addNotification).toHaveBeenCalledWith(expect.anything(), notificationData);
    });

    it('should show notification when file size is over', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        localVue,
        propsData: props,
        methods: methods,
        store,
        i18n,
        stubs: stubs,
      });
      // act
      wrapper.setData({ max_file_size: 100 / (1024 * 1024) });
      // generate a file 1 mb
      const file = new File([JSON.stringify(fileData(1000))], 'test.json', { type: 'application/json' });
      wrapper.vm.addFile(file, 1);
      // assert
      notificationData.message = ERROR.FILE_SIZE_ERROR;
      notificationData.consoleError = ERROR.FILE_SIZE_ERROR;
      expect(notifactionActions.addNotification).toHaveBeenCalledWith(expect.anything(), notificationData);
    });

    it('should show no notification when file is ok', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        localVue,
        propsData: props,
        methods: methods,
        store,
        i18n,
        stubs: stubs,
      });
      // act
      // generate a file 5 mb
      const file = new File(['{}'], 'test.json', { type: 'application/json' });
      wrapper.vm.addFile(file, 1);
      expect(notifactionActions.addNotification).not.toHaveBeenCalled();
      expect(methods.parseFile).toHaveBeenCalled();
    });
  });

  describe('#parseFile', () => {
    it('should fail when json file is ok but data format is wrong', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        localVue,
        propsData: props,
        data() {
          return data;
        },
        methods: methods,
        store,
        i18n,
        stubs: stubs,
      });
      // act
      // generate a file 5 mb
      const file = new File(['}]d$77&:['], 'test.json', { type: 'application/json' });
      wrapper.setData({ file: file });
      wrapper.vm.parseFile();
      expect(wrapper.vm.Json.length).toBe(0);
    });

    it('should pass when json file is ok but data format is wrong', () => {
      const wrapper = shallowMount(FormViewerMultiUpload, {
        localVue,
        propsData: props,
        methods: methods,
        store,
        i18n,
        stubs: stubs,
      });
      // act
      // generate a file 5 mb
      const file = new File(["[{name:'name'}]"], 'test.json', { type: 'application/json' });
      wrapper.setData({ file: file });
      wrapper.vm.parseFile();
      expect(notifactionActions.addNotification).not.toHaveBeenCalled();
    });
  });
});
