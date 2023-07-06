import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Root from '~/views/user/Root.vue';

describe('Root.vue', () => {
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
      },
    });

    expect(wrapper.find('h1').text()).toMatch('User');
    expect(wrapper.find('[data-test="my-forms-btn"]').text()).toMatch(
      'MY FORMS'
    );
    expect(wrapper.find('[data-test="history-btn"]').text()).toMatch('HISTORY');
  });
});
