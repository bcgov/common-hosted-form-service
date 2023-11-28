import FormFundProfile from '~/components/designer/profile/FormFundProfile.vue';
import { useFormStore } from '~/store/form';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

describe('FormFundProfile.vue', () => {

  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
  });

  it('renders properly', () => {

    const wrapper = mount(FormFundProfile, {
    global: {
        plugins: [pinia],
    },
    })
    expect(wrapper.text()).toMatch('trans.formProfile.fundingProfile');
    expect(wrapper.text()).toMatch('trans.formProfile.Y');
    expect(wrapper.text()).toMatch('trans.formProfile.N');
})

  it('check if radio buttons have proper value', async () => {
    const wrapper = mount(FormFundProfile, {
    global: {
        plugins: [pinia],
    },
    });

    const radioFalse = wrapper.find('[data-test="fund-false"]');
    const inputFalse = radioFalse.find('input').wrapperElement._value;
    expect(inputFalse).toBe(false);

    const radioTrue = wrapper.find('[data-test="fund-true"]');
    const inputTrue = radioTrue.find('input').wrapperElement._value;
    expect(inputTrue).toBe(true);

  });

  it('verify if fund cost input is visible', async () => {
    const wrapper = mount(FormFundProfile, {
    global: {
        plugins: [pinia],
    },
    });

    expect(formStore.form.funding).toBe(null);

    const fundCostBefore = wrapper.find('[data-test="fund-cost"]');
    expect(Object.getPrototypeOf(fundCostBefore)).toBe(null);

    formStore.form.funding = true;

    await wrapper.vm.$nextTick();

    const fundCostAfter = wrapper.find('[data-test="fund-cost"]');
    expect(fundCostAfter).toBeDefined();

    const input = fundCostAfter.find('input')
    expect(input.html()).toContain('type="number"');

  });
    
})