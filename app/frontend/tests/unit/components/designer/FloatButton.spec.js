import { shallowMount, createLocalVue, RouterLinkStub } from '@vue/test-utils';
import Vuetify from 'vuetify';
import VueRouter from 'vue-router';
import FloatButton from '@/components/designer/FloatButton.vue';
import Vuex from 'vuex';
import i18n from '@/internationalization';

const localVue = createLocalVue();
localVue.use(Vuetify);
localVue.use(VueRouter);
localVue.use(Vuex);

describe('FloatButton.vue', () => {
  const mockMultiLanguageGetter = jest.fn();
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            multiLanguage: mockMultiLanguageGetter
          },
        }
      }
    });
  });

  it('test that undo event was triggered', async() => {
    const wrapper = shallowMount(FloatButton, {
      localVue,
      store,
      i18n
    });

    expect(wrapper.find({ ref: 'undoButton' }).exists()).toBe(true);

    const undoButtonWrapper = wrapper.findComponent({ ref: 'undoButton' });
    undoButtonWrapper.trigger('click');

    wrapper.vm.$emit('undo');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().undo).toBeTruthy();
    expect(wrapper.emitted().undo.length).toBe(1);
  });

  it('test that undo event was triggered', async () => {
    const wrapper = shallowMount(FloatButton, {
      localVue,
      store,
      i18n
    });

    expect(wrapper.find({ ref: 'redoButton' }).exists()).toBe(true);

    const undoButtonWrapper = wrapper.findComponent({ ref: 'redoButton' });
    undoButtonWrapper.trigger('click');

    wrapper.vm.$emit('redo');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().redo).toBeTruthy();
    expect(wrapper.emitted().redo.length).toBe(1);
  });

  it('test that save event was triggered', async () => {
    const wrapper = shallowMount(FloatButton, {
      localVue,
      store,
      i18n
    });

    expect(wrapper.find({ ref: 'saveButton' }).exists()).toBe(true);

    const undoButtonWrapper = wrapper.findComponent({ ref: 'saveButton' });
    undoButtonWrapper.trigger('click');

    wrapper.vm.$emit('save');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().save).toBeTruthy();
    expect(wrapper.emitted().save.length).toBe(1);
  });

  it('test that publish button was click', async () => {
    const mockRoute = {
      name: 'FormManage',
      query: { d: '0014dfe4-321f-4bc1-9280-e7a1fdeb5dc6', f: '01fa4a32-ff4a-4304-8277-e69e0bb2d229', fd: 'formDesigner' },
    };

    const wrapper = shallowMount(FloatButton, {
      localVue,
      RouterLink: RouterLinkStub,
      propsData: { formId:'01fa4a32-ff4a-4304-8277-e69e0bb2d229', draftId:'0014dfe4-321f-4bc1-9280-e7a1fdeb5dc6' },
      store,
      i18n,
      mocks: {
        $route: mockRoute,
      },
    });

    await wrapper.findComponent({ ref: 'publishRouterLink' }).trigger('click');

    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ ref: 'publishRouterLink' }).props().to).toStrictEqual(mockRoute);
  });

  it('test that manage button was click', async () => {
    const mockRoute = {
      name: 'FormManage',
      query: { f: '01fa4a32-ff4a-4304-8277-e69e0bb2d229' },
    };

    const wrapper = shallowMount(FloatButton, {
      localVue,
      RouterLink: RouterLinkStub,
      propsData: { formId:'01fa4a32-ff4a-4304-8277-e69e0bb2d229' },
      store,
      i18n,
      mocks: {
        $route: mockRoute,
      },
    });

    await wrapper.findComponent({ ref: 'settingsRouterLink' }).trigger('click');

    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ ref: 'settingsRouterLink' }).props().to).toStrictEqual(mockRoute);
  });

  it('test that preview button was click', async () => {
    const mockRoute = {
      name: 'FormPreview',
      query: { d: '0014dfe4-321f-4bc1-9280-e7a1fdeb5dc6', f: '01fa4a32-ff4a-4304-8277-e69e0bb2d229' },
    };

    const mockRouter = {
      resolve: jest.fn(),
    };

    const mockGoToPreview = jest.spyOn(FloatButton.methods, 'gotoPreview');

    const wrapper = shallowMount(FloatButton, {
      localVue,
      RouterLink: RouterLinkStub,
      propsData: { formId:'01fa4a32-ff4a-4304-8277-e69e0bb2d229', draftId:'0014dfe4-321f-4bc1-9280-e7a1fdeb5dc6' },
      store,
      i18n,
      mocks: {
        $route: mockRoute,
        $router: mockRouter,
      },
    });

    await wrapper.findComponent({ ref: 'previewRouterLink' }).trigger('click');

    expect(mockGoToPreview).toHaveBeenCalledTimes(1);
  });
});
