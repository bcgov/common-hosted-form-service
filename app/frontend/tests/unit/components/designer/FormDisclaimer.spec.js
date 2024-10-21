import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import { useFormStore } from '~/store/form';
import FormDisclaimer from '~/components/designer/FormDisclaimer.vue';

describe('FormDisclaimer.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();

    formStore.isRTL = false;
  });

  it('renders', () => {
    const wrapper = mount(FormDisclaimer, {
      global: {
        plugins: [pinia],
      },
    });
    expect(wrapper.text())
      .toContain('trans.formDisclaimer.disclaimerAndStatement')
      .toContain('trans.formDisclaimer.privacyLaw')
      .toContain('trans.formDisclaimer.disclosure')
      .toContain('trans.formDisclaimer.consent')
      .toContain('trans.formDisclaimer.formIntention')
      .toContain('trans.formDisclaimer.privacyOfficer')
      .toContain('trans.formDisclaimer.assement');

    expect(wrapper.html()).not.toContain('mr-6');
  });

  it('renders with mr-6 if RTL is true', () => {
    formStore.isRTL = true;

    const wrapper = mount(FormDisclaimer, {
      global: {
        plugins: [pinia],
      },
    });
    expect(wrapper.text())
      .toContain('trans.formDisclaimer.disclaimerAndStatement')
      .toContain('trans.formDisclaimer.privacyLaw')
      .toContain('trans.formDisclaimer.disclosure')
      .toContain('trans.formDisclaimer.consent')
      .toContain('trans.formDisclaimer.formIntention')
      .toContain('trans.formDisclaimer.privacyOfficer')
      .toContain('trans.formDisclaimer.assement');

    expect(wrapper.html()).toContain('mr-6');
  });
});
