import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useFormStore } from '~/store/form';
import FormSubmissionSettings from '~/components/designer/settings/FormSubmissionSettings.vue';
import { nextTick } from 'vue';
import { useAppStore } from '~/store/app';

describe('FormSubmissionSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders and tests default values', () => {
    const wrapper = mount(FormSubmissionSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toMatch('trans.formSettings.submissionConfirmation');
    expect(wrapper.text()).toMatch('trans.formSettings.emailNotificatnToTeam');

    expect(formStore.form.sendSubmissionReceivedEmail).toBe(false);
    expect(formStore.form.showSubmissionConfirmation).toBe(true);
    expect(formStore.form.submissionReceivedEmails).toStrictEqual([]);
  });

  it('test click of email notification checkbox', async () => {
    const wrapper = mount(FormSubmissionSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    const checkBox = wrapper.findComponent('[data-test="email-test"]');
    checkBox.setValue(true);
    await nextTick;

    expect(formStore.form.sendSubmissionReceivedEmail).toBe(true);
    expect(wrapper.text()).toMatch('trans.formSettings.notificationEmailAddrs');

    checkBox.setValue(false);
    await nextTick;
    expect(wrapper.text()).not.toMatch(
      'trans.formSettings.notificationEmailAddrs'
    );
  });
});
