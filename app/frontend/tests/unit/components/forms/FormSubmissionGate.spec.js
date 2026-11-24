import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { turnstileService } from '~/services';
import FormSubmissionGate from '~/components/forms/FormSubmissionGate.vue';

vi.mock('~/services', () => ({
  turnstileService: {
    readStatus: vi.fn(),
    verifyChallenge: vi.fn(),
  },
}));

vi.mock('~/store/form', () => ({
  useFormStore: () => ({}),
}));

function mountGate() {
  return mount(FormSubmissionGate, {
    props: { formId: 'form-id' },
    slots: { default: '<div>Form content</div>' },
    global: {
      mocks: { $t: (key) => key },
      stubs: {
        VBtn: { template: '<button><slot /></button>' },
      },
    },
  });
}

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('FormSubmissionGate.vue', () => {
  it('renders the form content only after the server grants access', async () => {
    turnstileService.readStatus.mockResolvedValue({
      data: { verified: true },
    });
    const wrapper = mountGate();

    expect(wrapper.html()).not.toContain('Form content');
    await flushPromises();
    expect(wrapper.html()).toContain('Form content');
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
    const wrapper = mountGate();
    await flushPromises();

    expect(wrapper.html()).not.toContain('Form content');
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
    expect(wrapper.html()).toContain('Form content');
    wrapper.unmount();
  });

  it('keeps the viewer closed when verification is unavailable', async () => {
    turnstileService.readStatus.mockRejectedValue(new Error('Unavailable'));
    const wrapper = mountGate();
    await flushPromises();

    expect(wrapper.html()).not.toContain('Form content');
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
