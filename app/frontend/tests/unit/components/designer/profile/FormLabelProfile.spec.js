import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';

import FormLabelProfile from '~/components/designer/profile/FormLabelProfile.vue';
import { userService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useAppStore } from '~/store/app';

describe('FormLabelProfile.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);
  const appStore = useAppStore(pinia);

  const getUserLabelsSpy = vi.spyOn(userService, 'getUserLabels');
  const addNotificationSpy = vi.spyOn(notificationStore, 'addNotification');

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
    notificationStore.$reset();
    getUserLabelsSpy.mockReset();
  });

  afterAll(() => {
    getUserLabelsSpy.mockRestore();
  });

  it('renders properly', () => {
    getUserLabelsSpy.mockImplementation(() => []);
    const wrapper = mount(FormLabelProfile, {
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toMatch('trans.formProfile.labelPrompt');
  });

  it('mounted should throw an error', () => {
    getUserLabelsSpy.mockImplementation(() => {
      throw 'This is an error';
    });
    formStore.labels = ['this label is way tooooooooooooo long'];
    mount(FormLabelProfile, {
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
        },
      },
    });

    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
  });
});
