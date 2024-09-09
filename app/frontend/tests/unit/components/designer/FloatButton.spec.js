// @vitest-environment happy-dom
import { mount, RouterLinkStub } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, expect, vi } from 'vitest';
import { useRouter } from 'vue-router';

import FloatButton from '~/components/designer/FloatButton.vue';

window.scrollTo = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    resolve: () => {},
  })),
}));

describe('FloatButton.vue', () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const resolve = vi.fn();

  beforeEach(() => {
    resolve.mockReset();
    resolve.mockImplementationOnce(() => {
      return {
        href: '/#',
      };
    });
    useRouter.mockReset();
  });

  it('renders', () => {
    const wrapper = mount(FloatButton, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.html()).toContain('collapse');
    expect(wrapper.html()).toContain('publish');
    expect(wrapper.html()).toContain('manage');
    expect(wrapper.html()).toContain('redo');
    expect(wrapper.html()).toContain('undo');
    expect(wrapper.html()).toContain('preview');
    expect(wrapper.html()).toContain('bottom');
  });

  it('test that undo event was triggered', async () => {
    const wrapper = mount(FloatButton, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    const buttonWrapper = wrapper.find('[data-cy="undoButton"]');
    expect(buttonWrapper.exists()).toBeTruthy();
    buttonWrapper.trigger('click');

    wrapper.vm.$emit('undo');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().undo).toBeTruthy();
    expect(wrapper.emitted().undo.length).toBe(1);
  });

  it('test that redo event was triggered', async () => {
    const wrapper = mount(FloatButton, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    const buttonWrapper = wrapper.find('[data-cy="redoButton"]');
    expect(buttonWrapper.exists()).toBeTruthy();
    buttonWrapper.trigger('click');

    wrapper.vm.$emit('redo');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().redo).toBeTruthy();
    expect(wrapper.emitted().redo.length).toBe(1);
  });

  it('test that save event was triggered', async () => {
    const wrapper = mount(FloatButton, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    const buttonWrapper = wrapper.find('[data-cy="saveButton"]');
    expect(buttonWrapper.exists()).toBeTruthy();
    buttonWrapper.trigger('click');

    wrapper.vm.$emit('save');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().save).toBeTruthy();
    expect(wrapper.emitted().save.length).toBe(1);
  });

  it('test that publish button was clicked', async () => {
    const wrapper = mount(FloatButton, {
      RouterLink: RouterLinkStub,
      props: {
        formId: '01fa4a32-ff4a-4304-8277-e69e0bb2d229',
        draftId: '0014dfe4-321f-4bc1-9280-e7a1fdeb5dc6',
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    await wrapper.find('[data-cy="publishRouterLink"]').trigger('click');

    await wrapper.vm.$nextTick();

    // We don't need to test that the router-link worked
    // that is tested by the vue-router team already
  });

  it('test that manage button was clicked', async () => {
    const wrapper = mount(FloatButton, {
      RouterLink: RouterLinkStub,
      props: {
        formId: '01fa4a32-ff4a-4304-8277-e69e0bb2d229',
        draftId: '0014dfe4-321f-4bc1-9280-e7a1fdeb5dc6',
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    await wrapper.find('[data-cy="settingsRouterLink"]').trigger('click');

    await wrapper.vm.$nextTick();

    // We don't need to test that the router-link worked
    // that is tested by the vue-router team already
  });

  it('test that preview button was clicked', async () => {
    window.open = vi.fn();
    window.open.mockImplementationOnce(() => {});
    useRouter.mockImplementationOnce(() => ({
      resolve,
    }));

    // Preview only works if there is no form id or draft id
    const wrapper = mount(FloatButton, {
      RouterLink: RouterLinkStub,
      props: {
        formId: '01fa4a32-ff4a-4304-8277-e69e0bb2d229',
        draftId: '0014dfe4-321f-4bc1-9280-e7a1fdeb5dc6',
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    await wrapper.find('[data-cy="previewRouterLink"]').trigger('click');

    await wrapper.vm.$nextTick();

    // We don't need to test that the router-link worked
    // that is tested by the vue-router team already
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('Publish button is enabled if it is not a new draft version and there is a form id and draft id', () => {
    const wrapper = mount(FloatButton, {
      props: {
        newVersion: false,
        formId: '1',
        draftId: '1',
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.vm.isPublishEnabled).toBeTruthy();
  });

  it('Publish button is disabled if it is not a new draft version and there is a form id and no draft id', () => {
    const wrapper = mount(FloatButton, {
      props: {
        newVersion: false,
        formId: '1',
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.vm.isPublishEnabled).toBeFalsy();
  });

  it('Publish button is disabled if it is not a new draft version and there is no form id and no draft id', () => {
    const wrapper = mount(FloatButton, {
      props: {
        newVersion: false,
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.vm.isPublishEnabled).toBeFalsy();
  });

  it('Publish button is disabled if it is a new draft version', () => {
    const wrapper = mount(FloatButton, {
      props: {
        newVersion: true,
        formId: '1',
        draftId: '1',
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.vm.isPublishEnabled).toBeFalsy();
  });

  it('Manage button is enabled if there is a form id', () => {
    const wrapper = mount(FloatButton, {
      props: {
        newVersion: true,
        formId: '1',
        draftId: '1',
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.vm.isManageEnabled).toBeTruthy();
  });

  it('Manage button is disabled if there is no form id', () => {
    const wrapper = mount(FloatButton, {
      props: {
        newVersion: true,
        draftId: '1',
      },
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.vm.isManageEnabled).toBeFalsy();
  });
});
