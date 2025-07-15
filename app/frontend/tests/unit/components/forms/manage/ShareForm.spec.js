// @vitest-environment happy-dom
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, vi } from 'vitest';
import { useRouter } from 'vue-router';

import ShareForm from '~/components/forms/manage/ShareForm.vue';
import { useFormStore } from '~/store/form';
import { useAppStore } from '~/store/app';

const STUBS = {
  BaseCopyToClipboard: {
    template: '<div class="base-copy-to-clipboard-stub"><slot /></div>',
  },
  QRcodeVue: {
    name: 'qrcode-vue',
    template:
      '<div class="qrcode-vue-stub"><div class="qrCodeContainer"><canvas /><slot /></div></div>',
  },
  VCardText: {
    template: '<div class="v-card-text-stub"><slot /></div>',
  },
  VCard: {
    template: '<div class="v-card-stub"><slot /></div>',
  },
  VDialogTransition: {
    template: '<div class="v-dialog-transition-stub"><slot /></div>',
  },
  VDialog: {
    template: '<div class="v-dialog-stub"><slot /></div>',
  },
};

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    resolve: () => {},
  })),
}));

describe('ShareForm.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('formLink resolves a URL and returns the href', async () => {
    delete window.location;
    window.location = new URL('https://submit.digital.gov.bc.ca/');
    const resolve = vi.fn();
    resolve.mockImplementation(() => {
      return {
        href: '/#',
      };
    });
    useRouter.mockImplementationOnce(() => ({
      resolve,
    }));
    const wrapper = mount(ShareForm, {
      props: {
        formId: '1',
        warning: true,
      },
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
          },
        },
        stubs: STUBS,
      },
    });

    await flushPromises();

    const formLink = wrapper.vm.formLink;
    expect(formLink).toEqual('https://submit.digital.gov.bc.ca/#');
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('downloadQr', async () => {
    const resolve = vi.fn();
    resolve.mockImplementation(() => {
      return {
        href: '#',
      };
    });
    useRouter.mockImplementationOnce(() => ({
      resolve,
    }));
    const toDataURL = vi.fn();
    const querySelectorSpy = vi.spyOn(document, 'querySelector');
    querySelectorSpy.mockImplementationOnce(() => {
      return {
        toDataURL,
      };
    });
    const wrapper = mount(ShareForm, {
      props: {
        formId: '1',
        warning: true,
      },
      global: {
        plugins: [pinia],
        mocks: {
          $filters: {
            formatDateLong: vi.fn().mockReturnValue('formatted date'),
          },
        },
        stubs: STUBS,
      },
    });

    wrapper.vm.dialog = true;

    await flushPromises();

    wrapper.vm.downloadQr();
    expect(toDataURL).toHaveBeenCalledTimes(1);
  });
});
