import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';

import BaseCopyToClipboard from '@/components/base/BaseCopyToClipboard.vue';

const localVue = createLocalVue();
localVue.use(Vuetify);

describe('BaseCopyToClipboard.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(BaseCopyToClipboard, {
      localVue,
      propsData: { copyText: 'test' }
    });

    expect(wrapper.text()).toMatch('Copy to clipboard');
  });

  it('clipboardSuccessHandler behaves correctly', () => {
    const wrapper = shallowMount(BaseCopyToClipboard, {
      localVue,
      propsData: { copyText: 'test' }
    });
    wrapper.vm.clipboardSuccessHandler();

    expect(wrapper.vm.clipSnackbar.on).toBeTruthy();
    expect(wrapper.vm.clipSnackbar.text).toMatch('Link copied to clipboard');
    expect(wrapper.vm.clipSnackbar.color).toEqual('info');
    expect(wrapper.emitted().copied).toBeTruthy();
  });

  it('clipboardErrorHandler behaves correctly', () => {
    const wrapper = shallowMount(BaseCopyToClipboard, {
      localVue,
      propsData: { copyText: 'test' }
    });
    wrapper.vm.clipboardErrorHandler();

    expect(wrapper.vm.clipSnackbar.on).toBeTruthy();
    expect(wrapper.vm.clipSnackbar.text).toMatch('Error attempting to copy to clipboard');
    expect(wrapper.vm.clipSnackbar.color).toEqual('error');
  });
});
