import { mount, RouterLinkStub } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { expect, vi } from 'vitest';

import FloatButton from '~/components/designer/FloatButton.vue';

window.scrollTo = vi.fn();

describe('FloatButton.vue', () => {
  const pinia = createPinia();
  setActivePinia(pinia);

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

    expect(wrapper.find({ ref: 'undoButton' }).exists()).toBeTruthy();

    const buttonWrapper = wrapper.find({ ref: 'undoButton' });
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

    expect(wrapper.find({ ref: 'redoButton' }).exists()).toBeTruthy();

    const buttonWrapper = wrapper.find({ ref: 'redoButton' });
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

    expect(wrapper.find({ ref: 'saveButton' }).exists()).toBe(true);

    const buttonWrapper = wrapper.find({ ref: 'saveButton' });
    buttonWrapper.trigger('click');

    wrapper.vm.$emit('save');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().save).toBeTruthy();
    expect(wrapper.emitted().save.length).toBe(1);
  });

  it('test that publish button was click', async () => {
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

  it('test that manage button was click', async () => {
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

  it('test that preview button was click', async () => {
    const mockRouter = {
      resolve: vi.fn(),
    };

    window.open = vi.fn();

    mockRouter.resolve.mockImplementationOnce(() => {
      return {
        href: '',
      };
    });

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
        mocks: {
          $router: mockRouter,
        },
      },
    });

    await wrapper.find({ ref: 'previewRouterLink' }).trigger('click');

    await wrapper.vm.$nextTick();

    // We don't need to test that the router-link worked
    // that is tested by the vue-router team already
    expect(mockRouter.resolve).toHaveBeenCalledTimes(1);
  });
});
