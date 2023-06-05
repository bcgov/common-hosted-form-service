import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import GeneralLayout from '@/components/infolinks/GeneralLayout.vue';
import i18n from '@/internationalization';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('GeneralLayout.vue', () => {
  it('isComponentPublish()', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      localVue,
      stubs: ['ProactiveHelpDialog','ProactiveHelpPreviewDialog'],
      propsData: {
        componentsList: {
          type: Array,
          default: [],
        },
      },
      data() {
        return {
          publish: [false, false],
        };
      },
      i18n
    });
    await wrapper.setProps({
      componentsList: [
        { componentName: 'content', status: true },
        { componentName: 'textfiled', status: false },
      ],
      layoutList: [{ componentName: 'content' }, { componentName: 'textfiled' }],
    });
    await wrapper.setData({ publish: [false, false], listLength: 2 });
    wrapper.vm.isComponentPublish('content', 0);
    expect(wrapper.vm.publish[0]).toBe(true);
  });

  it('onOpenDialog()', async () => {
    const getComponentSpy = jest.spyOn(GeneralLayout.methods, 'getComponent');
    const onDialogSpy = jest.spyOn(GeneralLayout.methods, 'onDialog');

    const wrapper = shallowMount(GeneralLayout, {
      localVue,
      stubs: ['ProactiveHelpDialog','ProactiveHelpPreviewDialog'],
      propsData: {
        componentsList: {
          type: Array,
          default: [],
        },
      },
      data() {
        return {
          publish: [false, false],
        };
      },
      i18n
    });
    //wrapper.vm.onOpenDialog('Text Field');
    //expect(getComponentSpy).toHaveBeenCalledTimes(1);
    //expect(onDialogSpy).toHaveBeenCalledTimes(1);
  });

  it('onPreviewDialog()', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      localVue,
      stubs: ['ProactiveHelpDialog','ProactiveHelpPreviewDialog'],
      propsData: {
        componentsList: {
          type: Array,
          default: [],
        },
      },
      data() {
        return {
          showPreviewDialog: false,
        };
      },
      i18n
    });
    //wrapper.vm.onPreviewDialog();
    //expect(wrapper.vm.showPreviewDialog).toBe(true);
  });

  it('onDialog()', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      localVue,
      stubs: ['ProactiveHelpDialog','ProactiveHelpPreviewDialog'],
      propsData: {
        componentsList: {
          type: Array,
          default: [],
        },
      },
      data() {
        return {
          showDialog: false,
        };
      },
      i18n
    });
    //wrapper.vm.onDialog();
    //expect(wrapper.vm.showDialog).toBe(true);
  });
});
