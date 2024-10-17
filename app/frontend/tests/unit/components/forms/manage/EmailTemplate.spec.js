import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, vi } from 'vitest';
import { ref } from 'vue';

import EmailTemplate from '~/components/forms/manage/EmailTemplate.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useAppStore } from '~/store/app';

const STUBS = {};

describe('EmailTemplate.vue', () => {
  let pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
    formStore.emailTemplates = ref([
      {
        body: 'Thank you for your {{ form.name }} submission. You can view your submission details by visiting the following links:',
        formId: '8e436682-35be-4a93-82bc-08408d8fa606',
        subject: '{{ form.name }} Accepted',
        title: '{{ form.name }} Accepted',
        type: 'submissionConfirmation',
      },
    ]);
  });

  it('renders', () => {
    const wrapper = mount(EmailTemplate, {
      props: {
        title: 'Test title',
        type: 'submissionConfirmation',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.text()).toContain('Test title');
    expect(wrapper.text()).toContain('trans.emailTemplate.subject');
    expect(wrapper.text()).toContain('trans.emailTemplate.title');
    expect(wrapper.text()).toContain('trans.emailTemplate.body');
    expect(wrapper.text()).toContain('trans.emailTemplate.save');
  });

  it('saveEmailTemplate succeeds', async () => {
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const updateEmailTemplateSpy = vi.spyOn(formStore, 'updateEmailTemplate');
    updateEmailTemplateSpy.mockImplementation(async () => {
      return {};
    });
    const wrapper = mount(EmailTemplate, {
      props: {
        title: 'Test title',
        type: 'submissionConfirmation',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await wrapper.vm.saveEmailTemplate();

    await flushPromises();

    expect(updateEmailTemplateSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledTimes(0);
  });

  it('saveEmailTemplate shows a notification on failure', async () => {
    const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');
    const updateEmailTemplateSpy = vi.spyOn(formStore, 'updateEmailTemplate');
    updateEmailTemplateSpy.mockImplementation(async () => {
      throw new Error();
    });
    const wrapper = mount(EmailTemplate, {
      props: {
        title: 'Test title',
        type: 'submissionConfirmation',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await wrapper.vm.saveEmailTemplate();

    await flushPromises();

    expect(updateEmailTemplateSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
  });
});
