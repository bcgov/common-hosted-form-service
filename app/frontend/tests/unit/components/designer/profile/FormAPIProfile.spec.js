import FormAPIProfile from '~/components/designer/profile/FormAPIProfile.vue';
import { useFormStore } from '~/store/form';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

describe('FormAPIProfile.vue', () => {

  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
  });

  it('renders properly', () => {

    const wrapper = mount(FormAPIProfile, {
    global: {
        plugins: [pinia],
    },
    })
    expect(wrapper.text()).toMatch('trans.formProfile.APIIntegration');
    expect(wrapper.text()).toMatch('trans.formProfile.Y');
    expect(wrapper.text()).toMatch('trans.formProfile.N');

})

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
    
})