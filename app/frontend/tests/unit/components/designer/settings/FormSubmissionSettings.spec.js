import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useFormStore } from '~/store/form';
import FormSubmissionSettings from '~/components/designer/settings/FormSubmissionSettings.vue';
import { nextTick, ref } from 'vue';
import { useAppStore } from '~/store/app';
import { IdentityMode } from '~/utils/constants';

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

  it('enableSubmissionUrlSharing is disabled for non-public forms', async () => {
    formStore.form = ref({
      ...formStore.form,
      userType: IdentityMode.TEAM,
      enableSubmissionUrlSharing: true,
    });

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

    await nextTick();

    const checkbox = wrapper.findComponent(
      '[data-test="enableSubmissionUrlSharingCheckbox"]'
    );
    expect(checkbox.exists()).toBe(true);
    expect(checkbox.props('disabled')).toBe(true);
  });

  it('enableSubmissionUrlSharing toggles directly on public forms', async () => {
    formStore.form = ref({
      ...formStore.form,
      userType: IdentityMode.PUBLIC,
      enableSubmissionUrlSharing: true,
    });

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

    await nextTick();

    const checkbox = wrapper.findComponent(
      '[data-test="enableSubmissionUrlSharingCheckbox"]'
    );
    expect(checkbox.exists()).toBe(true);

    checkbox.setValue(false);
    await nextTick();
    expect(formStore.form.enableSubmissionUrlSharing).toBe(false);

    checkbox.setValue(true);
    await nextTick();
    expect(formStore.form.enableSubmissionUrlSharing).toBe(true);
  });

  it('disabling enableSubmissionUrlSharing forces enableSubmitterEmailReceipt off; showSubmissionConfirmation and team email are unchanged', async () => {
    formStore.form = ref({
      ...formStore.form,
      userType: IdentityMode.PUBLIC,
      enableSubmissionUrlSharing: true,
      showSubmissionConfirmation: true,
      enableSubmitterEmailReceipt: true,
      sendSubmissionReceivedEmail: true,
      submissionReceivedEmails: ['a@b.c'],
    });

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

    await nextTick();

    wrapper
      .findComponent('[data-test="enableSubmissionUrlSharingCheckbox"]')
      .setValue(false);
    await nextTick();

    expect(formStore.form.enableSubmissionUrlSharing).toBe(false);
    // Turning sharing off auto-unchecks the email-receipt option because the
    // receipt email contains a link back to the success page and that link
    // would not work for the recipient on a sharing-off form (and would
    // defeat the privacy protection if forwarded to a group alias).
    expect(formStore.form.enableSubmitterEmailReceipt).toBe(false);
    // Confirmation ID display is independent of enableSubmissionUrlSharing
    // (derived from the URL, no API call).
    expect(formStore.form.showSubmissionConfirmation).toBe(true);
    // Team email notification is independent; enableSubmissionUrlSharing
    // does not touch it.
    expect(formStore.form.sendSubmissionReceivedEmail).toBe(true);
    expect(formStore.form.submissionReceivedEmails).toEqual(['a@b.c']);
  });

  it('greys out enableSubmitterEmailReceipt only; showSubmissionConfirmation and team email stay enabled when URL sharing is disabled', async () => {
    formStore.form = ref({
      ...formStore.form,
      userType: IdentityMode.PUBLIC,
      enableSubmissionUrlSharing: false,
      sendSubmissionReceivedEmail: true,
      submissionReceivedEmails: ['a@b.c'],
    });

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

    await nextTick();

    // The email-receipt option is the only thing greyed when URL sharing is disabled.
    expect(
      wrapper
        .findComponent('[data-test="enableSubmitterEmailReceiptCheckbox"]')
        .props('disabled')
    ).toBe(true);
    // The Confirmation ID checkbox is independent of enableSubmissionUrlSharing.
    expect(
      wrapper
        .findComponent('[data-test="canAllowSubmissionConfirmationCheckbox"]')
        .props('disabled')
    ).toBeFalsy();
    // The team-notification email checkbox stays under the designer's control.
    expect(
      wrapper.findComponent('[data-test="email-test"]').props('disabled')
    ).toBeFalsy();
  });

  it('hideSubmissionContentOnSuccess is disabled for non-public forms', async () => {
    formStore.form = ref({
      ...formStore.form,
      userType: IdentityMode.TEAM,
      hideSubmissionContentOnSuccess: false,
    });

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

    await nextTick();

    const checkbox = wrapper.findComponent(
      '[data-test="hideSubmissionContentOnSuccessCheckbox"]'
    );
    expect(checkbox.exists()).toBe(true);
    expect(checkbox.props('disabled')).toBe(true);
  });

  it('hideSubmissionContentOnSuccess toggles directly on public forms and is independent of the other CCP-4720 options', async () => {
    formStore.form = ref({
      ...formStore.form,
      userType: IdentityMode.PUBLIC,
      enableSubmissionUrlSharing: true,
      showSubmissionConfirmation: true,
      enableSubmitterEmailReceipt: true,
      hideSubmissionContentOnSuccess: false,
    });

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

    await nextTick();

    const checkbox = wrapper.findComponent(
      '[data-test="hideSubmissionContentOnSuccessCheckbox"]'
    );
    expect(checkbox.exists()).toBe(true);
    expect(checkbox.props('disabled')).toBeFalsy();

    checkbox.setValue(true);
    await nextTick();
    expect(formStore.form.hideSubmissionContentOnSuccess).toBe(true);
    // Independent: the other CCP-4720 options are not touched.
    expect(formStore.form.enableSubmissionUrlSharing).toBe(true);
    expect(formStore.form.showSubmissionConfirmation).toBe(true);
    expect(formStore.form.enableSubmitterEmailReceipt).toBe(true);

    checkbox.setValue(false);
    await nextTick();
    expect(formStore.form.hideSubmissionContentOnSuccess).toBe(false);
  });

  it('with enableSubmissionUrlSharing on, both new checkboxes are independently toggleable', async () => {
    formStore.form = ref({
      ...formStore.form,
      userType: IdentityMode.PUBLIC,
      enableSubmissionUrlSharing: true,
      showSubmissionConfirmation: true,
      enableSubmitterEmailReceipt: true,
    });

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

    await nextTick();

    const idCheckbox = wrapper.findComponent(
      '[data-test="canAllowSubmissionConfirmationCheckbox"]'
    );
    const emailCheckbox = wrapper.findComponent(
      '[data-test="enableSubmitterEmailReceiptCheckbox"]'
    );

    expect(idCheckbox.props('disabled')).toBeFalsy();
    expect(emailCheckbox.props('disabled')).toBeFalsy();

    idCheckbox.setValue(false);
    await nextTick();
    expect(formStore.form.showSubmissionConfirmation).toBe(false);
    expect(formStore.form.enableSubmitterEmailReceipt).toBe(true);

    emailCheckbox.setValue(false);
    await nextTick();
    expect(formStore.form.enableSubmitterEmailReceipt).toBe(false);
  });
});
