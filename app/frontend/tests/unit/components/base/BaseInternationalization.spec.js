import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, it } from 'vitest';

import BaseInternationalization from '~/components/base/BaseInternationalization.vue';
import { useFormStore } from '~/store/form';
import { useAppStore } from '~/store/app';

describe('BaseInternationalization.vue', () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();

    formStore.isRTL = false;
  });

  it('renders', async () => {
    const wrapper = mount(BaseInternationalization, {
      global: {
        plugins: [pinia],
      },
    });

    await flushPromises();

    // Default language
    expect(wrapper.html()).toContain('v-select');
  });

  it('changes language should update the form stores isRTL', async () => {
    const wrapper = mount(BaseInternationalization, {
      global: {
        plugins: [pinia],
      },
    });

    await flushPromises();

    wrapper.vm.languageSelected('zh');

    expect(formStore.isRTL).toBeFalsy();

    wrapper.vm.languageSelected('zhTW');

    wrapper.vm.languageSelected('zhTW');

    wrapper.vm.languageSelected('zhCUSTOM');

    wrapper.vm.languageSelected('ar');

    expect(formStore.isRTL).toBeTruthy();
  });
});
