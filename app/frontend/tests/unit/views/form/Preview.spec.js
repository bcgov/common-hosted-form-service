import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Preview from '~/views/form/Preview.vue';

describe('Preview.vue', () => {
  const mockisRTLGetter = jest.fn();
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            isRTL: mockisRTLGetter,
          },
        },
      },
    });
  });
  it('renders', () => {
    const wrapper = mount(Preview, {
      props: {
        f: 'f',
        d: 'd',
        v: 'v',
      },
      global: {
        stubs: {
          BaseSecure: {
            name: 'BaseSecure',
            template: '<div class="base-secure-stub"><slot /></div>',
          },
          FormViewer: true,
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.html()).toMatch('base-secure');
    expect(wrapper.html()).toMatch('PREVIEW');
    expect(wrapper.html()).toMatch(
      'This shows a preview of the form version design and behaviour as your submitters will see it. You cannot submit the form from this page.'
    );
    expect(wrapper.html()).toMatch('form-viewer');
  });
});
