import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import i18n from '@/internationalization';
import NotFound from '@/views/NotFound.vue';

const localVue = createLocalVue();

localVue.use(VueRouter);

describe('NotFound.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(NotFound, {
      localVue,
      stubs: ['router-link'],
      i18n
    });

    expect(wrapper.text()).toMatch('404: Page not found. :(');
  });
});
