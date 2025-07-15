import { flushPromises, shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { useRoute } from 'vue-router';
import { ref } from 'vue';

import App from '~/App.vue';

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

  it('isWidePage should be main for non FormSubmit, FormView, FormSuccess views', () => {
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

    expect(wrapper.vm.isWidePage).toBe('main');
    expect(wrapper.vm.isValidRoute).toBeFalsy();
  });

  it('isWidePage should be main for non FormSubmit, FormView, FormSuccess views even if isWideLayout is true', async () => {
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

    wrapper.vm.isWideLayout = ref(true);
    await flushPromises();
    expect(wrapper.vm.isWidePage).toBe('main');
    expect(wrapper.vm.isValidRoute).toBeFalsy();
  });

  it('isWidePage should be main-wide for FormSubmit', () => {
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

    wrapper.vm.isWideLayout = true;
    expect(wrapper.vm.isWidePage).toBe('main-wide');
    expect(wrapper.vm.isValidRoute).toBeTruthy();
  });

  it('isWidePage should be main-wide for FormView', () => {
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

    wrapper.vm.isWideLayout = true;
    expect(wrapper.vm.isWidePage).toBe('main-wide');
    expect(wrapper.vm.isValidRoute).toBeTruthy();
  });

  it('isWidePage should be main-wide for FormSuccess', () => {
    const name = 'FormSuccess';

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

    wrapper.vm.isWideLayout = true;
    expect(wrapper.vm.isWidePage).toBe('main-wide');
    expect(wrapper.vm.isValidRoute).toBeTruthy();
  });

  it('setWideLayout should toggle isWideLayout', () => {
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

    expect(wrapper.vm.isWideLayout).toBeFalsy();
    wrapper.vm.setWideLayout(true);
    expect(wrapper.vm.isWideLayout).toBeTruthy();
    expect(wrapper.vm.isValidRoute).toBeTruthy();
  });

  it('isFormSubmitMode should return formSubmitMode from the router if it exists', () => {
    useRoute.mockReturnValue({
      meta: {
        formSubmitMode: true,
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

    expect(wrapper.vm.isFormSubmitMode).toBeTruthy();
  });

  it('appTitle should be retrieved from the route otherwise from the environment variable', () => {
    const TITLE = 'THIS IS AN APP TITLE';
    useRoute.mockReturnValue({
      meta: {
        title: TITLE,
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

    expect(wrapper.vm.appTitle).toEqual(TITLE);
  });
});
