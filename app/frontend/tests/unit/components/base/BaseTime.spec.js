import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';
import i18n from '@/internationalization';
import BaseTime from '@/components/base/BaseTime.vue';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuetify);
localVue.use(Vuex);

describe('BaseTime.vue', () => {

  const mockisRTLGetter = jest.fn();
  const mockLangGetter = jest.fn();

  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            isRTL: mockisRTLGetter,
            lang: mockLangGetter,
          },
        },
      },
    });
  });

  it('timer countdown should start', async () => {
    const wrapper = shallowMount(BaseTime, {
      localVue,
      propsData: { action: 'start' },
      i18n,
      store
    });
    await localVue.nextTick();

    expect(wrapper.text()).toMatch('Minutes');
  });

});
