import { NotificationTypes } from '@/utils/constants';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import i18n from '@/internationalization';
import BCGovAlertBanner from '@/components/bcgov/BCGovAlertBanner.vue';

const localVue = createLocalVue();

localVue.use(Vuex);

describe('BCGovAlertBanner.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store();
    store.registerModule('auth', {
      namespaced: true,
      getters: {
        authenticated: () => true,
        keycloakReady: () => true,
      },
      actions: {
        logout: () => jest.fn(),
      },
    });
  });

  it('renders without error', async () => {
    const wrapper = shallowMount(BCGovAlertBanner, {
      localVue,
      store,
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.class);
    expect(wrapper.html()).toContain(NotificationTypes.ERROR.icon);
    expect(wrapper.text()).toContain('Error');
  });

  it('renders with a custom error message', async () => {
    const message = 'This is a custom error message for testing.';
    const wrapper = shallowMount(BCGovAlertBanner, {
      localVue,
      propsData: { message: message },
      store,
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.class);
    expect(wrapper.html()).toContain(NotificationTypes.ERROR.icon);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders with an info message', async () => {
    const message = 'This is a custom info message for testing.';
    const wrapper = shallowMount(BCGovAlertBanner, {
      localVue,
      propsData: { message: message, type: 'info' },
      store,
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.INFO.class);
    expect(wrapper.html()).toContain(NotificationTypes.INFO.icon);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders with a success message', async () => {
    const message = 'This is a custom success message for testing.';
    const wrapper = shallowMount(BCGovAlertBanner, {
      localVue,
      propsData: { message: message, type: 'success' },
      store,
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.SUCCESS.class);
    expect(wrapper.html()).toContain(NotificationTypes.SUCCESS.icon);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders with a warning message', async () => {
    const message = 'This is a custom warning message for testing.';
    const wrapper = shallowMount(BCGovAlertBanner, {
      localVue,
      propsData: { message: message, type: 'warning' },
      store,
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.WARNING.class);
    expect(wrapper.html()).toContain(NotificationTypes.WARNING.icon);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders ok with the default if type is wrong', async () => {
    const message = 'This is a custom warning message for testing.';
    const wrapper = shallowMount(BCGovAlertBanner, {
      localVue,
      propsData: { message: message, type: 'BROKEN' },
      store,
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.class);
    expect(wrapper.html()).toContain(NotificationTypes.ERROR.icon);
    expect(wrapper.text()).toMatch(message);
  });

  it('renders html without escaping it', async () => {
    const message = 'This is a <a href="a">custom<a/> warning message.';
    const wrapper = shallowMount(BCGovAlertBanner, {
      localVue,
      propsData: { message: message, type: 'BROKEN' },
      store,
      i18n
    });
    await localVue.nextTick();

    expect(wrapper.html()).toContain(NotificationTypes.ERROR.class);
    expect(wrapper.html()).toContain(NotificationTypes.ERROR.icon);
    expect(wrapper.text()).not.toContain('href');
  });
});
