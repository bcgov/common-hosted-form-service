import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import moment from 'moment';
import { setActivePinia } from 'pinia';
import { describe, beforeEach, vi } from 'vitest';

import ApiKey from '~/components/forms/manage/ApiKey.vue';
import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';
import { useAppStore } from '~/store/app';

const STUBS = {
  BaseCopyToClipboard: {
    name: 'BaseCopyToClipboard',
    template: '<div class="base-copy-to-clipboard-stub"><slot /></div>',
  },
  BaseDialog: true,
};

const API_KEY = {
  createdAt: moment(),
  createdBy: 'APIKEY_TEST',
  filesApiAccess: false,
  formId: '1',
  id: 1,
  secret: 'THIS_IS_AN_API_KEY',
  updatedAt: moment(),
  updatedBy: null,
};

describe('ApiKey.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders', () => {
    const wrapper = mount(ApiKey, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('trans.apiKey.formOwnerKeyAcess');
    expect(wrapper.text()).toContain('trans.apiKey.disclaimer');
    expect(wrapper.text()).toContain('trans.apiKey.infoA');
    expect(wrapper.text()).toContain('trans.apiKey.infoB');
    expect(wrapper.text()).toContain('trans.apiKey.infoC');
    expect(wrapper.text()).toContain('trans.apiKey.infoD');
    expect(wrapper.text()).toContain('trans.apiKey.generate');
    expect(wrapper.text()).toContain('trans.apiKey.apiKey');
    expect(wrapper.text()).toContain('trans.apiKey.secret');
    expect(wrapper.text()).toContain('trans.apiKey.filesAPIAccess');
  });

  it('can delete key with the right permissions and can not without the right permissions', () => {
    formStore.apiKey = API_KEY;

    const wrapper = mount(ApiKey, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    formStore.permissions = [FormPermissions.FORM_API_DELETE];

    expect(wrapper.vm.canDeleteKey).toBeTruthy();

    formStore.permissions = [];

    expect(wrapper.vm.canDeleteKey).toBeFalsy();
  });

  it('can generate key with the right permissions and can not without the right permissions', () => {
    const wrapper = mount(ApiKey, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    formStore.permissions = [FormPermissions.FORM_API_CREATE];

    expect(wrapper.vm.canGenerateKey).toBeTruthy();

    formStore.permissions = [];

    expect(wrapper.vm.canGenerateKey).toBeFalsy();
  });

  it('can read secret with the right permissions and can not without the right permissions', () => {
    formStore.apiKey = API_KEY;

    const wrapper = mount(ApiKey, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    formStore.permissions = [FormPermissions.FORM_API_READ];

    expect(wrapper.vm.canReadSecret).toBeTruthy();

    formStore.permissions = [];

    expect(wrapper.vm.canReadSecret).toBeFalsy();
  });

  it('returns the computed api key secret if it exists', () => {
    formStore.apiKey = API_KEY;

    const wrapper = mount(ApiKey, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.secret).toEqual(API_KEY.secret);
  });

  it('returns the computed api key secret if it exists', async () => {
    const readApiKeySpy = vi.spyOn(formStore, 'readApiKey');
    readApiKeySpy.mockImplementationOnce(() => {});
    formStore.apiKey = API_KEY;
    formStore.permissions = [FormPermissions.FORM_API_CREATE];

    mount(ApiKey, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(readApiKeySpy).toHaveBeenCalledTimes(1);
  });

  it('createKey should call generateApiKey', async () => {
    const generateApiKeySpy = vi.spyOn(formStore, 'generateApiKey');
    generateApiKeySpy.mockImplementationOnce(async () => {
      formStore.apiKey = API_KEY;
    });

    const wrapper = mount(ApiKey, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await wrapper.vm.createKey();
    expect(generateApiKeySpy).toHaveBeenCalledTimes(1);
  });

  it('deleteKey should call deleteApiKey', async () => {
    const deleteApiKeySpy = vi.spyOn(formStore, 'deleteApiKey');
    deleteApiKeySpy.mockImplementationOnce(async () => {
      formStore.apiKey = API_KEY;
    });

    const wrapper = mount(ApiKey, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await wrapper.vm.deleteKey();
    expect(deleteApiKeySpy).toHaveBeenCalledTimes(1);
  });

  it('updateKey should call filesApiKeyAccess', async () => {
    const updateKeySpy = vi.spyOn(formStore, 'filesApiKeyAccess');
    updateKeySpy.mockImplementationOnce(async () => {
      formStore.apiKey = API_KEY;
    });

    const wrapper = mount(ApiKey, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await wrapper.vm.updateKey();
    expect(updateKeySpy).toHaveBeenCalledTimes(1);
  });
});
