import FormUseCaseProfile from '~/components/designer/profile/FormUseCaseProfile.vue';
import { useFormStore } from '~/store/form';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { FormProfileValues} from '~/utils/constants'; 

describe('FormUseCaseProfile.vue', () => {

  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
  });

  it('renders properly', () => {

    const wrapper = mount(FormUseCaseProfile, {
    global: {
        plugins: [pinia],
    },
    })
    expect(wrapper.text()).toMatch('trans.formProfile.useCaseType');
    expect(wrapper.text()).toMatch('trans.formProfile.feedback');
    expect(wrapper.text()).toMatch('trans.formProfile.application');
    expect(wrapper.text()).toMatch('trans.formProfile.collection');
    expect(wrapper.text()).toMatch('trans.formProfile.report');
    expect(wrapper.text()).toMatch('trans.formProfile.registration');

})

  it('check if radio buttons have proper value', async () => {
    const wrapper = mount(FormUseCaseProfile, {
    global: {
        plugins: [pinia],
    },
    });

    const radioFeed = wrapper.find('[data-test="case-feedback"]');
    const inputFeed = radioFeed.find('input').wrapperElement._value;
    expect(inputFeed).toBe(FormProfileValues.FEEDBACK);

    const radioApp = wrapper.find('[data-test="case-application"]');
    const inputApp = radioApp.find('input').wrapperElement._value;
    expect(inputApp).toBe(FormProfileValues.APPLICATION);

    const radioCollection = wrapper.find('[data-test="case-collection"]');
    const inputCollection = radioCollection.find('input').wrapperElement._value;
    expect(inputCollection).toBe(FormProfileValues.COLLECTION);

    const radioReport = wrapper.find('[data-test="case-report"]');
    const inputReport = radioReport.find('input').wrapperElement._value;
    expect(inputReport).toBe(FormProfileValues.REPORT);

    const radioRegister = wrapper.find('[data-test="case-registration"]');
    const inputRegister = radioRegister.find('input').wrapperElement._value;
    expect(inputRegister).toBe(FormProfileValues.REGISTRATION);

  });
    
})