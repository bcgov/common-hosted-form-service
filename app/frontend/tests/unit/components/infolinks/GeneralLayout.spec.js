import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import GeneralLayout from '@/components/infolinks/GeneralLayout.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('GeneralLayout.vue', () => {
  it('isComponentPublish()', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      localVue,
      stubs: ['InformationLinkDialog', 'InformationLinkPreviewDialog'],
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
      stubs: ['InformationLinkDialog', 'InformationLinkPreviewDialog'],
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
    });
    await wrapper.setProps({
      componentsList: [
        { componentName: 'content', status: true },
        { componentName: 'textfiled', status: false },
      ],
      layoutList: [{ componentName: 'content' }, { componentName: 'textfiled' }],
    });
    wrapper.vm.onOpenDialog('content');
    expect(getComponentSpy).toHaveBeenCalledTimes(1);
    expect(onDialogSpy).toHaveBeenCalledTimes(1);
  });

  it('onPreviewDialog()', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      localVue,
      stubs: ['InformationLinkDialog', 'InformationLinkPreviewDialog'],
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
    });
    await wrapper.setProps({
      componentsList: [
        { componentName: 'content', status: true },
        { componentName: 'textfiled', status: false },
      ],
      layoutList: [{ componentName: 'content' }, { componentName: 'textfiled' }],
    });
    wrapper.vm.onPreviewDialog();
    expect(wrapper.vm.showPreviewDialog).toBe(true);
  });

  it('onDialog()', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      localVue,
      stubs: ['InformationLinkDialog', 'InformationLinkPreviewDialog'],
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
    });
    await wrapper.setProps({
      componentsList: [
        { componentName: 'content', status: true },
        { componentName: 'textfiled', status: false },
      ],
      layoutList: [{ componentName: 'content' }, { componentName: 'textfiled' }],
    });
    wrapper.vm.onDialog();
    expect(wrapper.vm.showDialog).toBe(true);
  });
});
