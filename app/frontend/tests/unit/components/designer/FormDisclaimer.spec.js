import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FormDisclaimer from '~/components/designer/FormDisclaimer.vue';

describe('FormDisclaimer.vue', () => {
  it('renders', () => {
    const wrapper = mount(FormDisclaimer, {
      global: {
        plugins: [createTestingPinia()],
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
  });
});
