import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Form from '~/views/admin/Form.vue';

describe('Form.vue', () => {
  it('renders', () => {
    const wrapper = mount(Form, {
      props: {
        f: 'f',
      },
      global: {
        stubs: {
          AdministerForm: true,
        },
      },
    });

    expect(wrapper.text()).toMatch('Administer Form');
    expect(wrapper.html()).toMatch('administer-form');
  });
});
