import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import Design from '@/views/form/Design.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Design.vue', () => {
  const mockWindowConfirm = jest.spyOn(window, 'confirm');
  const mockFormGetter = jest.fn();
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            form: mockFormGetter,
          },
        },
      },
    });
  });

  afterEach(() => {
    mockWindowConfirm.mockReset();
    mockFormGetter.mockReset();
  });

  afterAll(() => {
    mockWindowConfirm.mockRestore();
  });

  it('renders', () => {
    const wrapper = shallowMount(Design, {
      localVue,
      store,
      stubs: ['BaseSecure', 'FormDesigner'],
      i18n
    });

    expect(wrapper.html()).toMatch('basesecure');
  });

  it('beforeRouteLeave guard works when not dirty', () => {
    mockFormGetter.mockReturnValue({ isDirty: false });
    const next = jest.fn();
    const wrapper = shallowMount(Design, {
      localVue,
      store,
      stubs: ['BaseSecure', 'FormDesigner'],
      i18n
    });
    Design.beforeRouteLeave.call(wrapper.vm, undefined, undefined, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockWindowConfirm).toHaveBeenCalledTimes(0);
  });

  it('beforeRouteLeave guard works when not dirty', () => {
    mockFormGetter.mockReturnValue({ isDirty: true });
    const next = jest.fn();
    const wrapper = shallowMount(Design, {
      localVue,
      store,
      stubs: ['BaseSecure', 'FormDesigner'],
      i18n
    });
    Design.beforeRouteLeave.call(wrapper.vm, undefined, undefined, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockWindowConfirm).toHaveBeenCalledTimes(1);
  });
});
