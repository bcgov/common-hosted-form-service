import { flushPromises, mount } from '@vue/test-utils';
import { h, ref, Transition } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import Submit from '~/views/form/Submit.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
}));

describe('Submit.vue', () => {
  it('finishes the route transition from the form to confirmation', async () => {
    const submitted = ref(false);
    const wrapper = mount(
      {
        render: () =>
          h(Transition, { mode: 'out-in', css: false, onLeave: (_el, done) => setTimeout(done, 0) }, () =>
            submitted.value
              ? h('div', { key: 'success' }, 'Submission complete')
              : h(Submit, { key: 'submit', f: 'form-id' })
          ),
      },
      {
        global: {
          mocks: { $t: (key) => key },
          stubs: {
            Transition: false,
            FormViewer: true,
            VContainer: { template: '<div><slot /></div>' },
          },
        },
      }
    );

    await flushPromises();
    expect(wrapper.html()).toContain('form-viewer');
    submitted.value = true;
    await vi.waitFor(() => expect(wrapper.text()).toBe('Submission complete'));
    wrapper.unmount();
  });
});
