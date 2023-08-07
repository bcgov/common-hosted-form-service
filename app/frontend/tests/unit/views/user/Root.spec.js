import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import Root from '@/views/user/Root.vue';


const localVue = createLocalVue();
localVue.use(Vuex);


describe('Root.vue', () => {

  const mockLangGetter = jest.fn();
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            lang: mockLangGetter,
          },
        },
      },
    });
  });

  it('renders without error', async () => {
    const wrapper = shallowMount(Root, {
      localVue,
      stubs: ['BaseSecure', 'router-link'],
      i18n,
      store
    });
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('User');
  });
});
