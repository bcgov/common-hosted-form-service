import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import WebcomponentSettings from '~/components/forms/manage/WebcomponentSettings.vue';
import { webcomponentSettingsService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { IdentityMode, NotificationTypes } from '~/utils/constants';

const STUBS = {
  VAlert: {
    template: '<div class="v-alert-stub"><slot /></div>',
  },
  VList: {
    template: '<div class="v-list-stub"><slot /></div>',
  },
  VListItem: {
    props: ['title'],
    template: '<div class="v-list-item-stub">{{ title }}<slot name="append" /></div>',
  },
  VTextField: {
    template: '<div class="v-text-field-stub" />',
  },
  VBtn: {
    template: '<div class="v-btn-stub"><slot /></div>',
  },
};

describe('WebcomponentSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
  addNotificationSpy.mockImplementation(() => {});

  const readSpy = vi.spyOn(
    webcomponentSettingsService,
    'readWebcomponentSettings'
  );
  const upsertSpy = vi.spyOn(
    webcomponentSettingsService,
    'upsertWebcomponentSettings'
  );

  const mountComponent = async () => {
    const wrapper = mount(WebcomponentSettings, {
      global: { plugins: [pinia], stubs: STUBS },
    });
    await flushPromises();
    return wrapper;
  };

  beforeEach(() => {
    formStore.$reset();
    notificationStore.$reset();
    addNotificationSpy.mockReset();
    readSpy.mockReset();
    upsertSpy.mockReset();
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
      userType: IdentityMode.PUBLIC,
    };
    readSpy.mockResolvedValue({ data: null });
  });

  it('renders the description and the empty state', async () => {
    const wrapper = await mountComponent();

    expect(readSpy).toHaveBeenCalledWith('test-form-id');
    expect(wrapper.text()).toContain('trans.webcomponentSettings.description');
    expect(wrapper.text()).toContain('trans.webcomponentSettings.noOrigins');
  });

  it('shows a notice when the form is not Public', async () => {
    formStore.form = { id: 'test-form-id', userType: IdentityMode.LOGIN };
    const wrapper = await mountComponent();

    expect(wrapper.find('[data-test="notPublicNotice"]').exists()).toBe(true);
  });

  it('does not show the notice for a Public form', async () => {
    const wrapper = await mountComponent();

    expect(wrapper.find('[data-test="notPublicNotice"]').exists()).toBe(false);
  });

  it('lists the saved origins', async () => {
    readSpy.mockResolvedValue({
      data: { allowedOrigins: ['https://www.example.com'] },
    });
    const wrapper = await mountComponent();

    expect(wrapper.find('[data-test="originList"]').text()).toContain(
      'https://www.example.com'
    );
  });

  it('adds a normalised origin and clears the input', async () => {
    const wrapper = await mountComponent();

    wrapper.vm.newOrigin = '  https://WWW.Example.com:443/ ';
    wrapper.vm.addOrigin();

    expect(wrapper.vm.allowedOrigins).toEqual(['https://www.example.com']);
    expect(wrapper.vm.newOrigin).toBe('');
  });

  it.each([
    'http://www.example.com',
    'https://www.example.com/path',
    'https://*.example.com',
    'not a url',
  ])('does not add the invalid origin %s', async (origin) => {
    const wrapper = await mountComponent();

    wrapper.vm.newOrigin = origin;

    expect(wrapper.vm.originError).toBe(
      'trans.webcomponentSettings.invalidOrigin'
    );
    wrapper.vm.addOrigin();
    expect(wrapper.vm.allowedOrigins).toEqual([]);
  });

  it('shows the origin error only after an add attempt', async () => {
    const wrapper = await mountComponent();

    wrapper.vm.newOrigin = 'https://www.example.com/path';
    expect(wrapper.vm.shownOriginError).toBe('');

    wrapper.vm.addOrigin();
    expect(wrapper.vm.shownOriginError).toBe(
      'trans.webcomponentSettings.invalidOrigin'
    );
  });

  it('does not add an origin longer than the server allows', async () => {
    const wrapper = await mountComponent();

    wrapper.vm.newOrigin = `https://${'a'.repeat(250)}.com`;
    wrapper.vm.addOrigin();

    expect(wrapper.vm.allowedOrigins).toEqual([]);
  });

  it('accepts http on localhost', async () => {
    const wrapper = await mountComponent();

    wrapper.vm.newOrigin = 'http://localhost:3000';
    wrapper.vm.addOrigin();

    expect(wrapper.vm.allowedOrigins).toEqual(['http://localhost:3000']);
  });

  it('does not add a duplicate origin', async () => {
    readSpy.mockResolvedValue({
      data: { allowedOrigins: ['https://www.example.com'] },
    });
    const wrapper = await mountComponent();

    wrapper.vm.newOrigin = 'https://WWW.example.com';

    expect(wrapper.vm.originError).toBe(
      'trans.webcomponentSettings.duplicateOrigin'
    );
    wrapper.vm.addOrigin();
    expect(wrapper.vm.allowedOrigins).toEqual(['https://www.example.com']);
  });

  it('stops adding at the maximum number of origins', async () => {
    const allowedOrigins = Array.from(
      { length: 20 },
      (_v, i) => `https://site${i}.example.com`
    );
    readSpy.mockResolvedValue({ data: { allowedOrigins } });
    const wrapper = await mountComponent();

    expect(wrapper.vm.atLimit).toBe(true);
    wrapper.vm.newOrigin = 'https://another.example.com';
    wrapper.vm.addOrigin();
    expect(wrapper.vm.allowedOrigins).toHaveLength(20);
  });

  it('removes an origin', async () => {
    readSpy.mockResolvedValue({
      data: { allowedOrigins: ['https://a.example.com', 'https://b.example.com'] },
    });
    const wrapper = await mountComponent();

    wrapper.vm.removeOrigin('https://a.example.com');

    expect(wrapper.vm.allowedOrigins).toEqual(['https://b.example.com']);
  });

  it('saves the origins and shows a success message', async () => {
    upsertSpy.mockResolvedValue({
      data: { allowedOrigins: ['https://www.example.com'] },
    });
    const wrapper = await mountComponent();

    wrapper.vm.newOrigin = 'https://www.example.com';
    wrapper.vm.addOrigin();
    await wrapper.vm.handleSave();

    expect(upsertSpy).toHaveBeenCalledWith('test-form-id', {
      allowedOrigins: ['https://www.example.com'],
    });
    expect(addNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'trans.webcomponentSettings.saveSuccess',
        ...NotificationTypes.SUCCESS,
      })
    );
    expect(wrapper.vm.saving).toBe(false);
  });

  it('shows an error message when saving fails', async () => {
    upsertSpy.mockRejectedValue(new Error('422'));
    const wrapper = await mountComponent();

    await wrapper.vm.handleSave();

    expect(addNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'trans.webcomponentSettings.saveError' })
    );
    expect(wrapper.vm.saving).toBe(false);
  });

  it('blocks saving when loading fails, so saved origins are not replaced', async () => {
    readSpy.mockRejectedValue(new Error('500'));
    const wrapper = await mountComponent();

    expect(addNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'trans.webcomponentSettings.fetchError' })
    );
    expect(wrapper.vm.loadFailed).toBe(true);
    expect(wrapper.find('[data-test="loadFailed"]').exists()).toBe(true);
  });
});
