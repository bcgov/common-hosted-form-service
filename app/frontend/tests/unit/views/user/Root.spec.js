import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import Root from '~/views/user/Root.vue';

describe('Root.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  it('renders', () => {
    const wrapper = mount(Root, {
      global: {
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          RouterLink: {
            name: 'RouterLink',
            template: '<div class="router-link-stub"><slot /></div>',
          },
        },
        plugins: [pinia],
      },
    });

    expect(wrapper.find('h1').text()).toMatch('trans.user.root.user');
    expect(wrapper.find('[data-test="my-forms-btn"]').text()).toMatch(
      'trans.user.root.myForms'
    );
    expect(wrapper.find('[data-test="history-btn"]').text()).toMatch(
      'trans.user.root.history'
    );
  });
});
