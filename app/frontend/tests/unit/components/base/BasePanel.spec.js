import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BasePanel from '~/components/base/BasePanel.vue';

describe('BasePanel.vue', () => {
  it('renders without title slot', () => {
    const wrapper = mount(BasePanel, {
      slots: {
        default: '<p>Test content</p>',
      },
      global: {
        stubs: {
          VCard: {
            template: '<div class="v-card-stub"><slot /></div>',
          },
          VCardTitle: {
            template: '<div class="v-card-title-stub"><slot /></div>',
          },
          VCardText: {
            template: '<div class="v-card-text-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Test content');
    expect(wrapper.find('.v-card-title-stub').exists()).toBeFalsy();
  });

  it('renders with title slot', () => {
    const wrapper = mount(BasePanel, {
      slots: {
        title: '<span>Test Title</span>',
        default: '<p>Test content</p>',
      },
      global: {
        stubs: {
          VCard: {
            template: '<div class="v-card-stub"><slot /></div>',
          },
          VCardTitle: {
            template: '<div class="v-card-title-stub"><slot /></div>',
          },
          VCardText: {
            template: '<div class="v-card-text-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Test Title');
    expect(wrapper.text()).toContain('Test content');
    expect(wrapper.find('.v-card-title-stub').exists()).toBeTruthy();
  });

  it('applies correct CSS classes', () => {
    const wrapper = mount(BasePanel, {
      global: {
        stubs: {
          VCard: {
            template: '<div class="v-card-stub"><slot /></div>',
          },
          VCardTitle: {
            template: '<div class="v-card-title-stub"><slot /></div>',
          },
          VCardText: {
            template: '<div class="v-card-text-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.html()).toMatch('v-card-stub');
  });
});
