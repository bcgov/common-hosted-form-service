import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import Success from '~/views/form/Success.vue';
import { useFormStore } from '~/store/form';
import { SUBMISSION_ACCESS_TOKEN_STORAGE_PREFIX } from '~/services/formService';

const SUBMISSION_ID = 'b8f0c1d2-3456-4789-9abc-def012345678';
const STORAGE_KEY = SUBMISSION_ACCESS_TOKEN_STORAGE_PREFIX + SUBMISSION_ID;

const buildToken = (id, exp) => `${id}.${exp}.${'a'.repeat(64)}`;

const mountSuccess = () =>
  mount(Success, {
    props: { s: SUBMISSION_ID, f: 'f' },
    global: {
      stubs: { FormViewer: true, RequestReceipt: true },
    },
  });

describe('Success.vue', () => {
  beforeEach(() => {
    const pinia = createTestingPinia({ stubActions: false });
    setActivePinia(pinia);
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('renders FormViewer when URL sharing is enabled', async () => {
    const wrapper = mountSuccess();
    expect(wrapper.html()).toMatch('form-viewer');
  });

  it('renders the static confirmation block when URL sharing is disabled and no access token is stored', async () => {
    useFormStore().form.enableSubmissionUrlSharing = false;
    const wrapper = mountSuccess();
    expect(wrapper.html()).not.toMatch('form-viewer');
  });

  it('renders the static confirmation block when URL sharing is disabled and the stored token has expired', async () => {
    useFormStore().form.enableSubmissionUrlSharing = false;
    sessionStorage.setItem(STORAGE_KEY, buildToken(SUBMISSION_ID, Date.now() - 1000));
    const wrapper = mountSuccess();
    expect(wrapper.html()).not.toMatch('form-viewer');
  });

  it('renders FormViewer when URL sharing is disabled and a non-expired token is stored', async () => {
    useFormStore().form.enableSubmissionUrlSharing = false;
    sessionStorage.setItem(STORAGE_KEY, buildToken(SUBMISSION_ID, Date.now() + 60_000));
    const wrapper = mountSuccess();
    expect(wrapper.html()).toMatch('form-viewer');
  });

  it('clears the stored access token when the component is unmounted', () => {
    sessionStorage.setItem(STORAGE_KEY, buildToken(SUBMISSION_ID, Date.now() + 60_000));
    const wrapper = mountSuccess();
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
    wrapper.unmount();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('clears the stored access token when the browser fires pagehide', () => {
    sessionStorage.setItem(STORAGE_KEY, buildToken(SUBMISSION_ID, Date.now() + 60_000));
    mountSuccess();
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
    globalThis.dispatchEvent(new Event('pagehide'));
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
