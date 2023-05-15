import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';

import BaseImagePopout from '@/components/base/BaseImagePopout.vue';

const localVue = createLocalVue();
localVue.use(Vuetify);

describe('BaseImagePopout.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(BaseImagePopout, {
      localVue,
      propsData: { src: 'test' },
    });

    expect(wrapper.html()).toMatch('v-hover');
    expect(wrapper.html()).toMatch('v-dialog');
  });
});
