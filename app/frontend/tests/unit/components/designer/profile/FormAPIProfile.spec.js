import FormAPIProfile from '~/components/designer/profile/FormAPIProfile.vue';
import { useFormStore } from '~/store/form';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { useAppStore } from '~/store/app';

describe('FormAPIProfile.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders properly', () => {
    const wrapper = mount(FormAPIProfile, {
      global: {
        plugins: [pinia],
      },
    });
    expect(wrapper.text()).toMatch('trans.formProfile.APIPrompt');
    expect(wrapper.text()).toMatch('trans.formProfile.Y');
    expect(wrapper.text()).toMatch('trans.formProfile.N');
  });

  it('check if radio buttons have proper value', async () => {
    const wrapper = mount(FormAPIProfile, {
      global: {
        plugins: [pinia],
      },
    });

    const radioFalse = wrapper.find('[data-test="api-false"]');
    const inputFalse = radioFalse.find('input').wrapperElement._value;
    expect(inputFalse).toBe(false);

    const radioTrue = wrapper.find('[data-test="api-true"]');
    const inputTrue = radioTrue.find('input').wrapperElement._value;
    expect(inputTrue).toBe(true);
  });

  it('test click of radio buttons', async () => {
    const wrapper = mount(FormAPIProfile, {
      global: {
        plugins: [pinia],
      },
    });

    const radioGroup = wrapper.findComponent('[data-test="api-radio"]');

    expect(formStore.form.apiIntegration).toBe(null);
    radioGroup.setValue(true);
    await nextTick;
    expect(formStore.form.apiIntegration).toBe(true);
    radioGroup.setValue(false);
    await nextTick;
    expect(formStore.form.apiIntegration).toBe(false);
  });
});
