import FormUseCaseProfile from '~/components/designer/profile/FormUseCaseProfile.vue';
import { useFormStore } from '~/store/form';
import { FormProfileValues } from '~/utils/constants';

import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { useAppStore } from '~/store/app';

describe('FormUseCaseProfile.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders properly', () => {
    const wrapper = mount(FormUseCaseProfile, {
      global: {
        plugins: [pinia],
      },
    });
    const select = wrapper.findComponent('[data-test="case-select"]');
    expect(wrapper.text()).toMatch('trans.formProfile.useCasePrompt');
    expect(select.componentVM.label).toMatch('trans.formProfile.useCase');
  });

  it('check length of select', async () => {
    const wrapper = mount(FormUseCaseProfile, {
      global: {
        plugins: [pinia],
      },
    });

    const select = wrapper.findComponent('[data-test="case-select"]');

    const items = select.componentVM.items;
    expect(items).toEqual(FormProfileValues.USE_CASE);
  });
});
