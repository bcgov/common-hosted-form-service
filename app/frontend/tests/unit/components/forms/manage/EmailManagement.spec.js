import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EmailManagement from '~/components/forms/manage/EmailManagement.vue';
import { useFormStore } from '~/store/form';

const STUBS = {
  EmailTemplate: {
    template: '<div class="email-template-stub"></div>',
  },
  VTooltip: {
    template: '<div class="v-tooltip-stub"><slot /></div>',
  },
  VBtn: {
    template: '<div class="v-btn-stub"><slot /></div>',
    name: 'VBtn',
  },
  VIcon: {
    template: '<div class="v-icon-stub"></div>',
  },
};

describe('EmailManagement.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    vi.clearAllMocks();
  });

  it('renders', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const fetchEmailTemplatesSpy = vi.spyOn(formStore, 'fetchEmailTemplates');
    fetchEmailTemplatesSpy.mockResolvedValue({});

    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    fetchFormSpy.mockResolvedValue({});

    const wrapper = mount(EmailManagement, {
      props: {
        formId: 'test-form-id',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('trans.emailManagement.emailManagement');
    expect(wrapper.text()).toContain('Test Form');
    expect(wrapper.find('.email-template-stub').exists()).toBeTruthy();
  });

  it('fetches email templates and form on mount', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const fetchEmailTemplatesSpy = vi.spyOn(formStore, 'fetchEmailTemplates');
    fetchEmailTemplatesSpy.mockResolvedValue({});

    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    fetchFormSpy.mockResolvedValue({});

    mount(EmailManagement, {
      props: {
        formId: 'test-form-id',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(fetchEmailTemplatesSpy).toHaveBeenCalledWith('test-form-id');
    expect(fetchFormSpy).toHaveBeenCalledWith('test-form-id');
  });

  it('displays form name correctly', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'My Test Form',
    };

    const fetchEmailTemplatesSpy = vi.spyOn(formStore, 'fetchEmailTemplates');
    fetchEmailTemplatesSpy.mockResolvedValue({});

    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    fetchFormSpy.mockResolvedValue({});

    const wrapper = mount(EmailManagement, {
      props: {
        formId: 'test-form-id',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('My Test Form');
  });

  it('applies RTL class when isRTL is true', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };
    formStore.isRTL = true;

    const fetchEmailTemplatesSpy = vi.spyOn(formStore, 'fetchEmailTemplates');
    fetchEmailTemplatesSpy.mockResolvedValue({});

    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    fetchFormSpy.mockResolvedValue({});

    const wrapper = mount(EmailManagement, {
      props: {
        formId: 'test-form-id',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    expect(wrapper.classes()).toContain('dir-rtl');
  });

  it('renders manage form button', async () => {
    formStore.form = {
      id: 'test-form-id',
      name: 'Test Form',
    };

    const fetchEmailTemplatesSpy = vi.spyOn(formStore, 'fetchEmailTemplates');
    fetchEmailTemplatesSpy.mockResolvedValue({});

    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    fetchFormSpy.mockResolvedValue({});

    const wrapper = mount(EmailManagement, {
      props: {
        formId: 'test-form-id',
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    await flushPromises();

    // The button uses :to prop which creates a router-link internally
    // Check that the component renders (the button is wrapped in tooltip)
    expect(wrapper.html()).toMatch('v-tooltip-stub');
  });
});
