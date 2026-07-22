import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useFeatureFlagStore } from '~/store/featureFlags';
import { useFormStore } from '~/store/form';
import SubmissionPackageEmailSettings from '~/components/designer/settings/SubmissionPackageEmailSettings.vue';

const DOC_TEMPLATE_STUB = {
  name: 'DocumentTemplate',
  template: '<div class="document-template-stub" />',
};

const mountComponent = (pinia) =>
  mount(SubmissionPackageEmailSettings, {
    global: {
      plugins: [pinia],
      stubs: {
        // DocumentTemplate fetches templates/print config on mount; stub it out
        // so this spec stays focused on the package-email gating + controls.
        DocumentTemplate: DOC_TEMPLATE_STUB,
      },
    },
  });

// Mount the component inside a v-form so we can assert it participates in the
// settings-form validation (the way it does in FormSettings on save).
const mountInForm = (pinia) =>
  mount(
    {
      components: { SubmissionPackageEmailSettings },
      template: '<v-form ref="form"><SubmissionPackageEmailSettings /></v-form>',
    },
    {
      global: {
        plugins: [pinia],
        stubs: { DocumentTemplate: DOC_TEMPLATE_STUB },
      },
    }
  );

describe('SubmissionPackageEmailSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);
  const featureFlagStore = useFeatureFlagStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    featureFlagStore.$reset();
  });

  it('renders nothing when the submitToEmail feature is not active', () => {
    const wrapper = mountComponent(pinia);

    expect(
      wrapper.find('[data-test="submission-package-email-test"]').exists()
    ).toBe(false);
  });

  it('renders the package email checkbox when submitToEmail is active', () => {
    featureFlagStore.active = { submitToEmail: true };

    const wrapper = mountComponent(pinia);

    expect(
      wrapper.find('[data-test="submission-package-email-test"]').exists()
    ).toBe(true);
    // The control is no longer gated on the form being published, so the
    // "please publish/save" disabled label must not render.
    expect(wrapper.text()).not.toMatch(
      'trans.formSettings.emailPackageDisabled'
    );
  });

  it('shows the email list and document template only once enabled', async () => {
    featureFlagStore.active = { submitToEmail: true };

    const wrapper = mountComponent(pinia);
    // Not enabled yet: no email list / template.
    expect(wrapper.text()).not.toMatch(
      'trans.formSettings.notificationEmailAddrs'
    );
    expect(wrapper.findComponent({ name: 'DocumentTemplate' }).exists()).toBe(
      false
    );

    formStore.form.submissionPackageSettings.enabled = true;
    await nextTick();

    expect(wrapper.text()).toMatch('trans.formSettings.notificationEmailAddrs');
    expect(wrapper.findComponent({ name: 'DocumentTemplate' }).exists()).toBe(
      true
    );
  });

  describe('validation when enabled', () => {
    const enable = () => {
      featureFlagStore.active = { submitToEmail: true };
      formStore.form.submissionPackageSettings = {
        enabled: true,
        templateId: null,
        emails: [],
      };
    };

    it('is invalid with no template and no recipients', async () => {
      enable();
      const wrapper = mountInForm(pinia);
      await nextTick();

      const { valid } = await wrapper.findComponent({ name: 'VForm' }).vm.validate();
      expect(valid).toBe(false);
    });

    it('is invalid with recipients but no template', async () => {
      enable();
      formStore.form.submissionPackageSettings.emails = ['a@b.com'];
      const wrapper = mountInForm(pinia);
      await nextTick();

      const { valid } = await wrapper.findComponent({ name: 'VForm' }).vm.validate();
      expect(valid).toBe(false);
    });

    it('is valid with both a template and a recipient', async () => {
      enable();
      formStore.form.submissionPackageSettings.templateId = 'a-template-id';
      formStore.form.submissionPackageSettings.emails = ['a@b.com'];
      const wrapper = mountInForm(pinia);
      await nextTick();

      const { valid } = await wrapper.findComponent({ name: 'VForm' }).vm.validate();
      expect(valid).toBe(true);
    });
  });
});
