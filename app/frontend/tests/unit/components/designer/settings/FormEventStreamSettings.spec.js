import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useAppStore } from '~/store/app';
import { useFormStore } from '~/store/form';
import FormEventStreamSettings from '~/components/designer/settings/FormEventStreamSettings.vue';
import { encryptionKeyService } from '~/services';

const STUBS = {
  BasePanel: {
    name: 'BasePanel',
    template: '<div class="base-panel-stub"><slot /></div>',
  },
  BaseCopyToClipboard: {
    name: 'BaseCopyToClipboard',
    template: '<div class="base-copy-to-clipboard-stub"><slot /></div>',
  },
};

describe('FormEventStreamSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);
  const listEncryptionAlgorithmsSpy = vi.spyOn(
    encryptionKeyService,
    'listEncryptionAlgorithms'
  );

  beforeEach(() => {
    appStore.$reset();
    formStore.$reset();
    listEncryptionAlgorithmsSpy.mockReset();
    listEncryptionAlgorithmsSpy.mockImplementation(() => ({ data: [] }));
  });

  afterAll(() => {
    listEncryptionAlgorithmsSpy.mockRestore();
  });

  it('renders eventStreamService configuration', async () => {
    appStore.config = ref({
      eventStreamService: {
        consumerservers: 'http://consumerservers.com',
        streamName: 'stream',
        source: 'src',
        domain: 'domain',
      },
    });
    const wrapper = mount(FormEventStreamSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });
    expect(wrapper.find('[data-test="consumerservers"]').text()).toContain(
      'http://consumerservers.com'
    );
    expect(wrapper.find('[data-test="streamName"]').text()).toContain('stream');
    expect(wrapper.find('[data-test="source"]').text()).toContain('src');
    expect(wrapper.find('[data-test="domain"]').text()).toContain('domain');
  });

  it('generates an encryption key when it has an algorithm', async () => {
    formStore.form = ref({
      eventStreamConfig: {
        enablePrivateStream: true,
        encryptionKey: {
          algorithm: 'aes-256-gcm',
          key: null,
        },
      },
    });
    const wrapper = mount(FormEventStreamSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(formStore.form.eventStreamConfig.encryptionKey.key).toBe(null);
    await wrapper.vm.generateKey();
    expect(formStore.form.eventStreamConfig.encryptionKey.key).toBeTruthy(); // populated
  });

  it('does not generate an encryption key without algorithm', async () => {
    formStore.form = ref({
      eventStreamConfig: {
        enablePrivateStream: true,
        encryptionKey: {
          algorithm: null,
          key: null,
        },
      },
    });
    const wrapper = mount(FormEventStreamSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(formStore.form.eventStreamConfig.encryptionKey.key).toBe(null);
    await wrapper.vm.generateKey();
    expect(formStore.form.eventStreamConfig.encryptionKey.key).toBe(undefined);
  });

  it('requires algorithm and key when private stream enabled', async () => {
    formStore.form = ref({
      eventStreamConfig: {
        enablePublicStream: false,
        enablePrivateStream: true,
        encryptionKey: {
          algorithm: null,
          key: null,
        },
      },
    });

    const wrapper = mount(FormEventStreamSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(
      wrapper.vm.encryptionKeyRules[0](
        formStore.form.eventStreamConfig.encryptionKey.algorithm
      )
    ).toEqual('trans.formSettings.encryptionKeyReq');

    expect(
      wrapper.vm.encryptionKeyRules[0](
        formStore.form.eventStreamConfig.encryptionKey.key
      )
    ).toEqual('trans.formSettings.encryptionKeyReq');

    expect(wrapper.vm.encryptionKeyRules[0](null)).toEqual(
      'trans.formSettings.encryptionKeyReq'
    );

    expect(wrapper.vm.encryptionKeyRules[0](undefined)).toEqual(
      'trans.formSettings.encryptionKeyReq'
    );

    expect(wrapper.vm.encryptionKeyRules[0](' ')).toEqual(
      'trans.formSettings.encryptionKeyReq'
    );

    expect(wrapper.vm.encryptionKeyRules[0]('aes-256-gcm')).toEqual(true); // some value should pass
  });

  it('hides stream config when not enabled', async () => {
    formStore.form = ref({
      eventStreamConfig: {
        enablePublicStream: false,
        enablePrivateStream: true,
        encryptionKey: {
          algorithm: null,
          key: null,
        },
        accountName: null,
        enabled: false,
      },
    });

    const wrapper = mount(FormEventStreamSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    const row1 = wrapper.find('[data-cy="enablePublicStreamRow"]');
    expect(row1.exists()).toBeFalsy();
    const row2 = wrapper.find('[data-cy="enablePrivateStreamRow"]');
    expect(row2.exists()).toBeFalsy();
  });

  it('shows stream config when enabled', async () => {
    formStore.form = ref({
      eventStreamConfig: {
        enablePublicStream: false,
        enablePrivateStream: true,
        encryptionKey: {
          algorithm: null,
          key: null,
        },
        accountName: 'testaccount', //accountName required to become enabled
        enabled: true,
      },
    });

    const wrapper = mount(FormEventStreamSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    const row1 = wrapper.find('[data-cy="enablePublicStreamRow"]');
    expect(row1.exists()).toBeTruthy();
    const row2 = wrapper.find('[data-cy="enablePrivateStreamRow"]');
    expect(row2.exists()).toBeTruthy();
  });
});
