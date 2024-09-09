// @vitest-environment happy-dom
import { mount, RouterLinkStub, shallowMount } from '@vue/test-utils';
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

  it('unmounted should remove the scroll event listener', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const wrapper = shallowMount(FloatButton, {
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

    await wrapper.unmount();

    expect(removeEventListenerSpy).toBeCalledTimes(1);
    expect(removeEventListenerSpy).toBeCalledWith(
      'scroll',
      wrapper.vm.onEventScroll
    );
  });

  it('SCROLL_ICON will be up if we are not at the top of the page and down otherwise', async () => {
    const wrapper = shallowMount(FloatButton, {
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
    expect(wrapper.vm.SCROLL_ICON).toEqual('mdi:mdi-arrow-down');
    wrapper.vm.isAtTopOfPage = false;
    expect(wrapper.vm.SCROLL_ICON).toEqual('mdi:mdi-arrow-up');
  });

  it('SCROLL_TEXT will be the top translation if we are not at the top of the page and bottom otherwise', async () => {
    const wrapper = shallowMount(FloatButton, {
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
    expect(wrapper.vm.SCROLL_TEXT).toEqual('trans.floatButton.bottom');
    wrapper.vm.isAtTopOfPage = false;
    expect(wrapper.vm.SCROLL_TEXT).toEqual('trans.floatButton.top');
  });

  it('COLLAPSE_ICON will be close if we are not at collapsed and menu otherwise', async () => {
    const wrapper = shallowMount(FloatButton, {
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
    expect(wrapper.vm.COLLAPSE_ICON).toEqual('mdi:mdi-close');
    wrapper.vm.isCollapsed = true;
    expect(wrapper.vm.COLLAPSE_ICON).toEqual('mdi:mdi-menu');
  });

  it('COLLAPSE_TEXT will be the collapse translation if we are not collapsed and actions otherwise', async () => {
    const wrapper = shallowMount(FloatButton, {
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
    expect(wrapper.vm.COLLAPSE_TEXT).toEqual('trans.floatButton.collapse');
    wrapper.vm.isCollapsed = true;
    expect(wrapper.vm.COLLAPSE_TEXT).toEqual('trans.floatButton.actions');
  });

  it('SAVE_TEXT will match the savedStatus property otherwise it is just save', async () => {
    let wrapper = shallowMount(FloatButton, {
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
    expect(wrapper.vm.SAVE_TEXT).toEqual('trans.floatButton.save');
    wrapper = shallowMount(FloatButton, {
      props: {
        savedStatus: 'Saved',
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
    expect(wrapper.vm.SAVE_TEXT).toEqual('trans.floatButton.saved');
    wrapper = shallowMount(FloatButton, {
      props: {
        savedStatus: 'Saving',
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
    expect(wrapper.vm.SAVE_TEXT).toEqual('trans.floatButton.saving');
    wrapper = shallowMount(FloatButton, {
      props: {
        savedStatus: 'Not Saved',
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
    expect(wrapper.vm.SAVE_TEXT).toEqual('trans.floatButton.notSaved');
  });

  it('onEventScroll sets isAtTopOfPage to true if window scroll is at 0, false otherwise', async () => {
    const wrapper = shallowMount(FloatButton, {
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
    wrapper.vm.onEventScroll();
    expect(wrapper.vm.isAtTopOfPage).toBe(true);
    window.scrollY = 1;
    wrapper.vm.onEventScroll();
    expect(wrapper.vm.isAtTopOfPage).toBe(false);
  });

  it('onClickCollapse will toggle the value of isCollapsed', async () => {
    const wrapper = shallowMount(FloatButton, {
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
    expect(wrapper.vm.isCollapsed).toBeFalsy();
    wrapper.vm.onClickCollapse();
    expect(wrapper.vm.isCollapsed).toBeTruthy();
  });

  it('onClickSave will emit save', async () => {
    const wrapper = shallowMount(FloatButton, {
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
    wrapper.vm.onClickSave();
    expect(wrapper.emitted()).toHaveProperty('save');
  });

  it('onClickScroll will scroll the window to either the top or bottom depending on if we are at the top of the page or not', async () => {
    const wrapper = shallowMount(FloatButton, {
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
    const scrollToSpy = vi.spyOn(window, 'scrollTo');
    wrapper.vm.onClickScroll();
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy).toBeCalledWith({
      left: 0,
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
    wrapper.vm.isAtTopOfPage = false;
    scrollToSpy.mockReset();
    wrapper.vm.onClickScroll();
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy).toBeCalledWith({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
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
