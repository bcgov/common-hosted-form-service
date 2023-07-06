import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Forms from '~/views/user/Forms.vue';

describe('Forms.vue', () => {
  it('renders', () => {
    const wrapper = mount(Forms, {
      global: {
        stubs: {
          FormsTable: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('forms-table');
  });
});
