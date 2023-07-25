import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';
import i18n from '@/internationalization';
import BaseDialog from '@/components/base/BaseDialog.vue';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuetify);
localVue.use(Vuex);

describe('BaseDialog.vue', () => {

  const mockisRTLGetter = jest.fn();
  let store;
  beforeEach(() => {

    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            isRTL: mockisRTLGetter,
          },
        },
      },
    });
  });

  it('renders with ok button', async () => {
    const wrapper = shallowMount(BaseDialog, {
      localVue,
      propsData: { show: true, type: 'OK' },
      i18n,
      store
    });
    await wrapper.vm.closeDialog();
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('OK');
  });

  it('renders with continue button', async () => {
    const wrapper = shallowMount(BaseDialog, {
      localVue,
      propsData: { show: true, type: 'CONTINUE' },
      i18n,
      store
    });
    await wrapper.vm.continueDialog();
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('Continue');
  });

  it('renders with the close button', async () => {
    const wrapper = shallowMount(BaseDialog, {
      localVue,
      propsData: { show: true, showCloseButton: true },
      i18n,
      store
    });
    await wrapper.vm.closeDialog();
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('close');
  });

  it('renders without the close button', async () => {
    const wrapper = shallowMount(BaseDialog, {
      localVue,
      propsData: { show: true },
      i18n,
      store
    });
    await wrapper.vm.closeDialog();
    await localVue.nextTick();

    expect(wrapper.text()).not.toMatch('close');
  });
});
