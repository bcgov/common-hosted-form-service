// @vitest-environment happy-dom
// happy-dom is required to access window.URL
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, expect, vi } from 'vitest';

import RequestReceipt from '~/components/forms/RequestReceipt.vue';
import { formService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const STUBS = {
  VBtn: {
    template: '<div class="v-btn-stub"><slot /></div>',
  },
  VIcon: {
    template: '<div class="v-icon-stub"><slot /></div>',
  },
  VSelect: {
    template: '<div class="v-select-stub"><slot /></div>',
  },
  VForm: {
    template: '<div class="v-form-stub"><slot /></div>',
  },
  VTextField: {
    template: '<div class="v-text-field-stub"><slot /></div>',
  },
  BaseDialog: true,
};

describe('RequestReceipt.vue', () => {
  const submissionId = '123-456';
  const email = 'email@email.com';

  const pinia = createTestingPinia();

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
  addNotificationSpy.mockImplementation(() => {});

  beforeEach(() => {
    formStore.$reset();
    notificationStore.$reset();

    addNotificationSpy.mockReset();
  });

  it('renders', async () => {
    const wrapper = mount(RequestReceipt, {
      props: {
        submissionId: submissionId,
        email: email,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('trans.requestReceipt.emailReceipt');
  });

  it('displayDialog should set showDialog to true', async () => {
    const wrapper = mount(RequestReceipt, {
      props: {
        submissionId: submissionId,
        email: email,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    wrapper.vm.displayDialog();

    expect(wrapper.vm.showDialog).toBeTruthy();
  });

  it('requestReceipt should validate the form, then call requestReceiptEmail and then addNotification then hide the dialog', async () => {
    const requestReceiptEmailSpy = vi.spyOn(formService, 'requestReceiptEmail');
    requestReceiptEmailSpy.mockImplementation(() => {});
    const wrapper = mount(RequestReceipt, {
      props: {
        submissionId: submissionId,
        email: email,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.form = {
      validate: vi.fn().mockImplementation(() => {
        return { valid: true };
      }),
    };

    await flushPromises();

    await wrapper.vm.requestReceipt();

    expect(requestReceiptEmailSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      color: 'success',
      icon: 'mdi:mdi-check-circle',
      text: 'trans.requestReceipt.emailSent',
      type: 'success',
    });
  });

  it('requestReceipt should validate the form, then call requestReceiptEmail and then addNotification then hide the dialog', async () => {
    const requestReceiptEmailSpy = vi.spyOn(formService, 'requestReceiptEmail');
    requestReceiptEmailSpy.mockImplementation(() => {
      throw new Error();
    });
    const wrapper = mount(RequestReceipt, {
      props: {
        submissionId: submissionId,
        email: email,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.form = {
      validate: vi.fn().mockImplementation(() => {
        return { valid: true };
      }),
    };

    await flushPromises();

    await wrapper.vm.requestReceipt();

    expect(requestReceiptEmailSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledTimes(1);
    expect(addNotificationSpy).toBeCalledWith({
      consoleError: 'trans.requestReceipt.sendingEmailConsErrMsg',
      text: 'trans.requestReceipt.sendingEmailErrMsg',
    });
  });
});
