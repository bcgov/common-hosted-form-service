import { flushPromises, mount } from '@vue/test-utils';
import { h, ref, Transition } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { turnstileService } from '~/services';
import Submit from '~/views/form/Submit.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
}));

vi.mock('~/services', () => ({
  turnstileService: {
    readStatus: vi.fn(),
    verifyChallenge: vi.fn(),
  },
}));

vi.mock('~/store/form', () => ({
  useFormStore: () => ({}),
}));

function mountSubmit() {
  return mount(Submit, {
    props: { f: 'form-id' },
    global: {
      mocks: { $t: (key) => key },
      stubs: {
        FormViewer: true,
        VContainer: { template: '<div><slot /></div>' },
        VBtn: { template: '<button><slot /></button>' },
      },
    },
  });
}

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('Submit.vue', () => {
  it('finishes the route transition from a verified form to confirmation', async () => {
    turnstileService.readStatus.mockResolvedValue({
      data: { verified: true },
    });
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

  it('mounts the viewer only after the server grants access', async () => {
    turnstileService.readStatus.mockResolvedValue({
      data: { verified: true },
    });
    const wrapper = mountSubmit();

    expect(wrapper.html()).not.toContain('form-viewer');
    await flushPromises();
    expect(wrapper.html()).toContain('form-viewer');
    wrapper.unmount();
  });

  it('waits for server verification and confirmation that the proof cookie was accepted', async () => {
    const render = vi.fn(() => 'widget');
    const remove = vi.fn();
    vi.stubGlobal('turnstile', { render, remove });
    turnstileService.readStatus
      .mockResolvedValueOnce({ data: { verified: false, siteKey: 'site-key' } })
      .mockResolvedValueOnce({ data: { verified: true } });
    turnstileService.verifyChallenge.mockResolvedValue({});
    const wrapper = mountSubmit();
    await flushPromises();

    expect(wrapper.html()).not.toContain('form-viewer');
    const options = render.mock.calls[0][1];
    expect(options).toMatchObject({ sitekey: 'site-key', cData: 'form-id' });
    await options.callback('cloudflare-token');
    await flushPromises();

    expect(turnstileService.verifyChallenge).toHaveBeenCalledWith(
      'form-id',
      'cloudflare-token',
      undefined,
      false
    );
    expect(turnstileService.readStatus).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledWith('widget');
    expect(wrapper.html()).toContain('form-viewer');
    wrapper.unmount();
  });

  it('keeps the viewer closed when verification is unavailable', async () => {
    turnstileService.readStatus.mockRejectedValue(new Error('Unavailable'));
    const wrapper = mountSubmit();
    await flushPromises();

    expect(wrapper.html()).not.toContain('form-viewer');
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
