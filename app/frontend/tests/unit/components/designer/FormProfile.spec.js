import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import FormProfile from '~/components/designer/FormProfile.vue';
import { useFormStore } from '~/store/form';

const STUBS = {
  BasePanel: {
    template:
      '<div class="base-panel-stub"><slot name="title" /><slot /></div>',
  },
  FormDeploymentProfile: {
    template: '<div class="form-deployment-profile-stub"></div>',
  },
  FormMinistryProfile: {
    template: '<div class="form-ministry-profile-stub"></div>',
  },
  FormLabelProfile: {
    template: '<div class="form-label-profile-stub"></div>',
  },
  FormAPIProfile: {
    template: '<div class="form-api-profile-stub"></div>',
  },
  FormUseCaseProfile: {
    template: '<div class="form-use-case-profile-stub"></div>',
  },
  VContainer: {
    template: '<div class="v-container-stub"><slot /></div>',
  },
  VRow: {
    template: '<div class="v-row-stub"><slot /></div>',
  },
  VCol: {
    template: '<div class="v-col-stub"><slot /></div>',
  },
};

describe('FormProfile.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
  });

  it('renders', () => {
    formStore.isRTL = false;

    const wrapper = mount(FormProfile, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('trans.create.formProfile');
    expect(wrapper.text()).toContain('trans.formProfile.message');
    expect(wrapper.find('.form-ministry-profile-stub').exists()).toBeTruthy();
    expect(wrapper.find('.form-use-case-profile-stub').exists()).toBeTruthy();
    expect(wrapper.find('.form-deployment-profile-stub').exists()).toBeTruthy();
    expect(wrapper.find('.form-api-profile-stub').exists()).toBeTruthy();
    expect(wrapper.find('.form-label-profile-stub').exists()).toBeTruthy();
  });

  it('applies RTL class when isRTL is true', () => {
    formStore.isRTL = true;

    const wrapper = mount(FormProfile, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    const container = wrapper.find('.v-container-stub');
    expect(container.classes()).toContain('dir-rtl');
  });

  it('renders all profile components', () => {
    formStore.isRTL = false;

    const wrapper = mount(FormProfile, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.find('.form-ministry-profile-stub').exists()).toBeTruthy();
    expect(wrapper.find('.form-use-case-profile-stub').exists()).toBeTruthy();
    expect(wrapper.find('.form-deployment-profile-stub').exists()).toBeTruthy();
    expect(wrapper.find('.form-api-profile-stub').exists()).toBeTruthy();
    expect(wrapper.find('.form-label-profile-stub').exists()).toBeTruthy();
  });
});
