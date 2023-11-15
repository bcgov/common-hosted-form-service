import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseNotificationContainer from '~/components/base/BaseNotificationContainer.vue';

describe('BaseNotificationContainer.vue', () => {
  it('renders', async () => {
    const wrapper = mount(BaseNotificationContainer, {
      global: {
        stubs: ['BaseNotificationBar'],
        plugins: [createTestingPinia()],
      },
    });

    expect(wrapper.html()).toMatch('notification-container');
  });
});
