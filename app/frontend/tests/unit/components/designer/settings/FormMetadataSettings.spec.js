import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';

import { useFormStore } from '~/store/form';
import FormMetadataSettings from '~/components/designer/settings/FormMetadataSettings.vue';

describe('FormMetadataSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
  });

  it('sets JSON when valid JSON string', async () => {
    formStore.form = ref({
      formMetadata: {
        metadata: {},
      },
    });
    const wrapper = mount(FormMetadataSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    expect(formStore.form.formMetadata.metadata).toEqual({});
    wrapper.vm.updateMetadata(JSON.stringify({ test: 'updated' }));
    await nextTick();
    expect(formStore.form.formMetadata.metadata).toEqual({ test: 'updated' });
  });

  it('does not set JSON when invalid JSON string', async () => {
    formStore.form = ref({
      formMetadata: {
        metadata: { test: 'not updated' },
      },
    });
    const wrapper = mount(FormMetadataSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    expect(formStore.form.formMetadata.metadata).toEqual({
      test: 'not updated',
    });
    wrapper.vm.updateMetadata('this is not a valid JSON string.');
    await nextTick();
    expect(formStore.form.formMetadata.metadata).toEqual({
      test: 'not updated',
    });
  });
});
