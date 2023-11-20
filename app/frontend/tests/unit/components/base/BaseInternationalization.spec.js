import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, it } from 'vitest';

import BaseInternationalization from '~/components/base/BaseInternationalization.vue';
import { useFormStore } from '~/store/form';

describe('BaseInternationalization.vue', () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const formStore = useFormStore();

  beforeEach(() => {
    formStore.lang = 'en';
  });

  it('renders', async () => {
    const wrapper = mount(BaseInternationalization, {
      global: {
        stubs: {
          VDialog: {
            name: 'VMenu',
            template: '<div class="v-menu-stub"><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    // Default language
    expect(wrapper.text()).toContain('English');
  });

  it('changes language', async () => {
    const wrapper = mount(BaseInternationalization, {
      global: {
        stubs: {
          VDialog: {
            name: 'VMenu',
            template: '<div class="v-menu-stub"><slot /></div>',
          },
        },
      },
    });

    await flushPromises();

    // Default language
    expect(wrapper.text()).toContain('English');

    expect(formStore.lang).toBe('en');

    wrapper.vm.languageSelected({
      title: '简体中文 (Simplified Chinese)',
      keyword: 'zh',
    });

    expect(formStore.lang).toBe('zh');

    wrapper.vm.languageSelected({
      title: '繁體中文 (Traditional Chinese)',
      keyword: 'zh-TW',
    });

    expect(formStore.lang).toBe('zh-TW');

    wrapper.vm.languageSelected({
      title: 'UNKNOWN',
      keyword: 'zh-CUSTOM',
    });

    expect(formStore.lang).toBe('zh-CUSTOM');
  });
});
