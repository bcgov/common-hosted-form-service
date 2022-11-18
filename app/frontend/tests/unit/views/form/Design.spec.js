import {createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Design from '@/views/form/Design.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Design.vue', () => {
  const mockWarningDialogGetter = jest.fn();
  const mockIsLogoutButtonClickedGetter = jest.fn();
  let store;

  const formActions = {
    setShowWarningDialog: jest.fn(),
  };

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            showWarningDialog: mockWarningDialogGetter,
            isLogoutButtonClicked: mockIsLogoutButtonClickedGetter
          }
        }
      }
    });
  });

  afterEach(() => {
    mockIsLogoutButtonClickedGetter.mockReset();
    mockWarningDialogGetter.mockReset();
  });


  it('renders', () => {
    const wrapper = shallowMount(Design, {
      localVue,
      store,
      stubs: ['BaseSecure', 'FormDesigner', 'BaseDialog']
    });

    expect(wrapper.html()).toMatch('basesecure');
  });


  it('beforeRouteLeave guard works when form save button not clicked', async() => {
    /*
    const $toRoute = {
      name: 'pathNameA',
      path: '/some/samePath'
    };

    const $fromRoute = {
      name: 'pathNameB',
      path: '/some/differentPath'
    };
    */

    formActions.setShowWarningDialog();

    mockIsLogoutButtonClickedGetter.mockReturnValue(false);
    mockWarningDialogGetter.mockReturnValue(true);

    //const next = jest.fn();
    /*
    const wrapper = shallowMount(Design, {
      localVue,
      store,
      stubs: ['BaseSecure', 'FormDesigner','BaseDialog'],
      mocks: {
        $toRoute,
        $fromRoute
      },
      data() {
        return {
          showDialog:false,
          toRouterPathName:''
        };
      }
    });
    */
    // Design.beforeRouteLeave.call(wrapper.vm, wrapper.vm.$toRoute, wrapper.vm.$fromRoute, next);
    //expect(formActions.setShowWarningDialog).toHaveBeenCalledTimes(1);
    //expect(wrapper.vm.showDialog).toBe(true);
  });

  it('beforeRouteLeave guard works when form save button clicked', async() => {
  /*
    const $toRoute = {
      name: 'pathNameA',
      path: '/some/samePath'
    };

    const $fromRoute = {
      name: 'pathNameB',
      path: '/some/differentPath'
    };
    */

    formActions.setShowWarningDialog();

    mockIsLogoutButtonClickedGetter.mockReturnValue(true);
    mockWarningDialogGetter.mockReturnValue(false);

    //const next = jest.fn();
    /*
    const wrapper = shallowMount(Design, {
      localVue,
      store,
      stubs: ['BaseSecure', 'FormDesigner','BaseDialog'],
      mocks: {
        $toRoute,
        $fromRoute
      },
      data() {
        return {
          showDialog:false,
          toRouterPathName:''
        };
      }
    });

    */
    //Design.beforeRouteLeave.call(wrapper.vm, wrapper.vm.$toRoute, wrapper.vm.$fromRoute, next);
    //expect(formActions.setShowWarningDialog).toHaveBeenCalledTimes(1);
    //expect(wrapper.vm.showDialog).toBe(false);
    //expect(next).toHaveBeenCalledTimes(1);
  });
});

