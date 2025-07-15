import { createTestingPinia } from '@pinia/testing';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import FormsTable from '~/components/designer/FormsTable.vue';

describe('FormsTable.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const authStore = useAuthStore(pinia);
  const formStore = useFormStore(pinia);
  const idpStore = useIdpStore(pinia);

  beforeEach(() => {
    authStore.$reset();
    formStore.$reset();
    idpStore.$reset();

    formStore.isRTL = false;
  });

  it('renders', () => {
    const wrapper = mount(FormsTable, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: RouterLinkStub,
          BaseDialog: true,
        },
      },
    });
    expect(wrapper.text()).toContain('trans.formsTable.myForms');
  });

  it('onDescriptionClick should set the description values', () => {
    const fId = '1';
    const fDescription = 'description';

    const wrapper = mount(FormsTable, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: RouterLinkStub,
          BaseDialog: true,
        },
      },
    });

    expect(wrapper.vm.formId).toBe(null);
    expect(wrapper.vm.formDescription).toBe(null);
    expect(wrapper.vm.showDescriptionDialog).toBeFalsy();

    wrapper.vm.onDescriptionClick(fId, fDescription);

    expect(wrapper.vm.formId).toBe(fId);
    expect(wrapper.vm.formDescription).toBe(fDescription);
    expect(wrapper.vm.showDescriptionDialog).toBeTruthy();
  });
});
