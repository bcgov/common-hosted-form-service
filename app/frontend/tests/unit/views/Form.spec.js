import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Form from '~/views/Form.vue';

describe('Form.vue', () => {
  it('renders', () => {
    const wrapper = mount(Form, {
      global: {
        stubs: {
          RouterView: true,
        },
      },
    });

    expect(wrapper.html()).toMatch('router-view');
  });
});
