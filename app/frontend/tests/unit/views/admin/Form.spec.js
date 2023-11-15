import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import Form from '~/views/admin/Form.vue';

describe('Form.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  it('renders', () => {
    const wrapper = mount(Form, {
      props: {
        f: 'f',
      },
      global: {
        stubs: {
          AdministerForm: true,
        },
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toMatch('trans.admin.form.administerForm');
    expect(wrapper.html()).toMatch('administer-form');
  });
});
