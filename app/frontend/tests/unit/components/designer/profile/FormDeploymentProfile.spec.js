import FormDeploymentProfile from '~/components/designer/profile/FormDeploymentProfile.vue';
import { useFormStore } from '~/store/form';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { FormProfileValues } from '~/utils/constants';
import { nextTick } from 'vue';
import { useAppStore } from '~/store/app';

describe('FormDeploymentProfile.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders properly', () => {
    const wrapper = mount(FormDeploymentProfile, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toMatch('trans.formProfile.deploymentPrompt');
    expect(wrapper.text()).toMatch('trans.formProfile.development');
    expect(wrapper.text()).toMatch('trans.formProfile.test');
    expect(wrapper.text()).toMatch('trans.formProfile.production');
  });

  it('check if radio buttons have proper value', async () => {
    const wrapper = mount(FormDeploymentProfile, {
      global: {
        plugins: [pinia],
      },
    });

    const radioDev = wrapper.find('[data-test="deployment-development"]');
    const inputDev = radioDev.find('input').wrapperElement._value;
    expect(inputDev).toBe(FormProfileValues.DEVELOPMENT);

    const radioTest = wrapper.find('[data-test="deployment-test"]');
    const inputTest = radioTest.find('input').wrapperElement._value;
    expect(inputTest).toBe(FormProfileValues.TEST);

    const radioProd = wrapper.find('[data-test="deployment-prod"]');
    const inputProd = radioProd.find('input').wrapperElement._value;
    expect(inputProd).toBe(FormProfileValues.PRODUCTION);
  });

  it('test click of radio buttons', async () => {
    const wrapper = mount(FormDeploymentProfile, {
      global: {
        plugins: [pinia],
      },
    });

    const radioGroup = wrapper.findComponent('[data-test="deployment-radio"]');

    expect(formStore.form.deploymentLevel).toBe(null);
    radioGroup.setValue(true);
    await nextTick;
    expect(formStore.form.deploymentLevel).toBe(true);
    radioGroup.setValue(false);
    await nextTick;
    expect(formStore.form.deploymentLevel).toBe(false);
  });
});
