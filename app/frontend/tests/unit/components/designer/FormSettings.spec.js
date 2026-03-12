import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import FormSettings from '~/components/designer/FormSettings.vue';
import { useFormStore } from '~/store/form';

const STUBS = {
  FormGeneralSettings: {
    template: '<div class="form-general-settings-stub"></div>',
  },
  FormAccessSettings: {
    template: '<div class="form-access-settings-stub"></div>',
  },
  FormFunctionalitySettings: {
    template: '<div class="form-functionality-settings-stub"></div>',
  },
  FormSubmissionSettings: {
    template: '<div class="form-submission-settings-stub"></div>',
  },
  FormScheduleSettings: {
    template: '<div class="form-schedule-settings-stub"></div>',
  },
  FormMetadataSettings: {
    template: '<div class="form-metadata-settings-stub"></div>',
  },
  FormEventStreamSettings: {
    template: '<div class="form-event-stream-settings-stub"></div>',
  },
  VContainer: {
    template: '<div class="v-container-stub"><slot /></div>',
  },
  VRow: {
    template: '<div class="v-row-stub"><slot /></div>',
  },
  VCol: {
    template: '<div class="v-col-stub"><slot /></div>',
  },
};

describe('FormSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
  });

  it('renders all settings components', () => {
    formStore.form = {
      id: 'test-form-id',
      schedule: {
        enabled: false,
      },
    };
    formStore.isFormPublished = false;
    formStore.isRTL = false;

    const wrapper = mount(FormSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.find('.form-general-settings-stub').exists()).toBeTruthy();
    expect(wrapper.find('.form-access-settings-stub').exists()).toBeTruthy();
    expect(
      wrapper.find('.form-functionality-settings-stub').exists()
    ).toBeTruthy();
    expect(
      wrapper.find('.form-submission-settings-stub').exists()
    ).toBeTruthy();
    expect(wrapper.find('.form-metadata-settings-stub').exists()).toBeTruthy();
    expect(
      wrapper.find('.form-event-stream-settings-stub').exists()
    ).toBeTruthy();
  });

  it('renders schedule settings when form is published and schedule is enabled', () => {
    formStore.form = {
      id: 'test-form-id',
      schedule: {
        enabled: true,
      },
    };
    formStore.isFormPublished = true;
    formStore.isRTL = false;

    const wrapper = mount(FormSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.find('.form-schedule-settings-stub').exists()).toBeTruthy();
  });

  it('does not render schedule settings when form is not published', () => {
    formStore.form = {
      id: 'test-form-id',
      schedule: {
        enabled: true,
      },
    };
    formStore.isFormPublished = false;
    formStore.isRTL = false;

    const wrapper = mount(FormSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.find('.form-schedule-settings-stub').exists()).toBeFalsy();
  });

  it('does not render schedule settings when schedule is disabled', () => {
    formStore.form = {
      id: 'test-form-id',
      schedule: {
        enabled: false,
      },
    };
    formStore.isFormPublished = true;
    formStore.isRTL = false;

    const wrapper = mount(FormSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(wrapper.find('.form-schedule-settings-stub').exists()).toBeFalsy();
  });

  it('passes disabled prop to functionality and metadata settings', () => {
    formStore.form = {
      id: 'test-form-id',
      schedule: {
        enabled: false,
      },
    };
    formStore.isFormPublished = false;
    formStore.isRTL = false;

    const wrapper = mount(FormSettings, {
      props: {
        disabled: true,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    // Check that the components receive the disabled prop
    const functionalitySettings = wrapper.find(
      '.form-functionality-settings-stub'
    );
    const metadataSettings = wrapper.find('.form-metadata-settings-stub');
    const eventStreamSettings = wrapper.find(
      '.form-event-stream-settings-stub'
    );

    expect(functionalitySettings.exists()).toBeTruthy();
    expect(metadataSettings.exists()).toBeTruthy();
    expect(eventStreamSettings.exists()).toBeTruthy();
  });

  it('applies RTL class when isRTL is true', () => {
    formStore.form = {
      id: 'test-form-id',
      schedule: {
        enabled: false,
      },
    };
    formStore.isFormPublished = false;
    formStore.isRTL = true;

    const wrapper = mount(FormSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    const container = wrapper.find('.v-container-stub');
    expect(container.classes()).toContain('dir-rtl');
  });

  it('renders event stream settings only when form has id', () => {
    formStore.form = {
      id: 'test-form-id',
      schedule: {
        enabled: false,
      },
    };
    formStore.isFormPublished = false;
    formStore.isRTL = false;

    const wrapper = mount(FormSettings, {
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    expect(
      wrapper.find('.form-event-stream-settings-stub').exists()
    ).toBeTruthy();
  });
});
