import { flushPromises, shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import App from '~/App.vue';

import { useRoute } from 'vue-router';

vi.mock('vue-router');

describe('App.vue', () => {
  it('renders', async () => {
    const name = 'NotFormSubmitOrFormView';

    useRoute.mockReturnValue({
      query: {
        name,
      },
    });

    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          VLayout: {
            name: 'VLayout',
            template: '<div class="v-layout-stub"><slot /></div>',
          },
          VMain: {
            name: 'VMain',
            template: '<div class="v-main-stub"><slot /></div>',
          },
          RouterView: {
            name: 'RouterView',
            template: '<div class="v-router-view-stub"><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    expect(
      wrapper.find('base-notification-container-stub').exists()
    ).toBeTruthy();
    expect(wrapper.find('b-c-gov-header-stub').exists()).toBeTruthy();
    expect(wrapper.find('b-c-gov-nav-bar-stub').exists()).toBeTruthy();
    expect(wrapper.find('b-c-gov-footer-stub').exists()).toBeTruthy();
  });

  it('isSubmitPageClass should be main for non FormSubmit and FormView views', () => {
    const name = 'NotFormSubmitOrFormView';

    useRoute.mockReturnValue({
      query: {
        name,
      },
    });
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterView: {
            name: 'RouterView',
            template: '<div class="v-router-view-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.vm.isSubmitPageClass).toBe('main');
  });

  it('isSubmitPageClass should be main-wide for FormSubmit', () => {
    const name = 'FormSubmit';

    useRoute.mockReturnValue({
      name,
    });
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterView: {
            name: 'RouterView',
            template: '<div class="v-router-view-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.vm.isSubmitPageClass).toBe('main-wide');
  });

  it('isSubmitPageClass should be main-wide for FormView', () => {
    const name = 'FormView';

    useRoute.mockReturnValue({
      name,
    });
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          RouterView: {
            name: 'RouterView',
            template: '<div class="v-router-view-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.vm.isSubmitPageClass).toBe('main-wide');
  });
});
