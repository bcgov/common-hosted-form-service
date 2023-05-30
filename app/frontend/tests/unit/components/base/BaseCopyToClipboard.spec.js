import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';
import Vuex from 'vuex';

import BaseCopyToClipboard from '@/components/base/BaseCopyToClipboard.vue';

const localVue = createLocalVue();
localVue.use(Vuetify);
localVue.use(Vuex);

describe('BaseCopyToClipboard.vue', () => {
  let mockAddNotification = jest.fn();
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        notifications: {
          namespaced: true,
          actions: {
            addNotification: mockAddNotification,
          },
        },
      },
    });
  });

  afterEach(() => {
    mockAddNotification.mockClear();
  });

  it('renders', () => {
    const wrapper = shallowMount(BaseCopyToClipboard, {
      localVue,
      propsData: { copyText: 'test' },
      store,
    });

    expect(wrapper.text()).toMatch('Copy to Clipboard');
  });

  it('clipboardSuccessHandler behaves correctly', () => {
    const wrapper = shallowMount(BaseCopyToClipboard, {
      localVue,
      propsData: { copyText: 'test' },
      store,
    });
    wrapper.vm.clipboardSuccessHandler();

    expect(wrapper.emitted().copied).toBeTruthy();
    expect(mockAddNotification).toHaveBeenCalledTimes(1);
  });

  it('clipboardErrorHandler behaves correctly', () => {
    const wrapper = shallowMount(BaseCopyToClipboard, {
      localVue,
      propsData: { copyText: 'test' },
      store,
    });
    wrapper.vm.clipboardErrorHandler();

    expect(mockAddNotification).toHaveBeenCalledTimes(1);
  });
});
