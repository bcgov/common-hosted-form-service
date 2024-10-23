import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, vi } from 'vitest';

import Subscription from '~/components/forms/manage/Subscription.vue';
import { useFormStore } from '~/store/form';
import { useAppStore } from '~/store/app';

describe('Subscription.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('showHideKey should toggle the value', async () => {
    const wrapper = mount(Subscription, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.vm.showSecret).toBeFalsy();
    wrapper.vm.showHideKey();
    expect(wrapper.vm.showSecret).toBeTruthy();
  });

  it('updateSettings should update the subscription then readFormSubscription if the form is valid', async () => {
    const updateSubscriptionSpy = vi.spyOn(formStore, 'updateSubscription');
    updateSubscriptionSpy.mockImplementationOnce(async () => {});
    const readFormSubscriptionDataSpy = vi.spyOn(
      formStore,
      'readFormSubscriptionData'
    );
    readFormSubscriptionDataSpy.mockImplementationOnce(async () => {});
    // mock valid form subscription data
    formStore.subscriptionData = {
      endpointUrl: 'http://website.com/api/v1/test',
      key: 'CLIENT_KEY',
      endpointToken: 'ENDPOINT_TOKEN',
    };
    const wrapper = mount(Subscription, {
      global: {
        plugins: [pinia],
      },
    });

    await flushPromises();

    await wrapper.vm.updateSettings();

    expect(updateSubscriptionSpy).toHaveBeenCalledTimes(1);
    expect(readFormSubscriptionDataSpy).toHaveBeenCalledTimes(1);
  });
});
