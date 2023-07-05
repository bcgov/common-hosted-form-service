import { mount } from '@vue/test-utils';
import { expect } from 'vitest';
import { nextTick } from 'vue';

import AddOwner from '~/components/admin/AddOwner.vue';

describe('AddOwner.vue', () => {
  it('renders', async () => {
    const wrapper = mount(AddOwner, {
      props: {
        formId: 'f',
      },
      global: {
        plugins: [],
      },
    });

    await nextTick();

    expect(wrapper.text())
      .toContain('trans.addOwner.infoA')
      .toContain('trans.addOwner.label');
  });
});
