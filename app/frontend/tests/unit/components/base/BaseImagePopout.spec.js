import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';
import i18n from '@/internationalization';
import BaseImagePopout from '@/components/base/BaseImagePopout.vue';

const localVue = createLocalVue();
localVue.use(Vuetify);

describe('BaseImagePopout.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(BaseImagePopout, {
      localVue,
      propsData: { src: 'test' },
      i18n
    });

    expect(wrapper.html()).toMatch('v-hover');
    expect(wrapper.html()).toMatch('v-dialog');
  });
});
