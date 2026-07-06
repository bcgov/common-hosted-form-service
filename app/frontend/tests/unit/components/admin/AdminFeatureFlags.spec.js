import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { expect, vi } from 'vitest';
import { nextTick } from 'vue';

import AdminFeatureFlags from '~/components/admin/AdminFeatureFlags.vue';
import { useAdminStore } from '~/store/admin';

describe('AdminFeatureFlags.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);
  const adminStore = useAdminStore(pinia);

  beforeEach(() => {
    adminStore.$reset();
    vi.clearAllMocks();
  });

  it('fetches feature flags on mount', async () => {
    mount(AdminFeatureFlags, { global: { plugins: [pinia] } });
    await nextTick();
    expect(adminStore.getFeatureFlags).toHaveBeenCalledTimes(1);
  });

  it('renders a row per feature flag', async () => {
    adminStore.featureFlags = [
      { code: 'offlineForms', name: 'Offline Forms', enabled: false, allowAll: false },
      { code: 'submitToEmail', name: 'Submit to Email', enabled: true, allowAll: false },
    ];
    const wrapper = mount(AdminFeatureFlags, { global: { plugins: [pinia] } });
    await nextTick();
    expect(wrapper.text()).toContain('Offline Forms');
    expect(wrapper.text()).toContain('Submit to Email');
  });

  it('toggling the universal switch calls setFeatureFlagAllowAll with the code', async () => {
    adminStore.featureFlags = [
      { code: 'offlineForms', name: 'Offline Forms', enabled: true, allowAll: false },
    ];
    const wrapper = mount(AdminFeatureFlags, { global: { plugins: [pinia] } });
    await nextTick();
    const sw = wrapper.findComponent({ name: 'VSwitch' });
    sw.vm.$emit('update:model-value', true);
    await nextTick();
    expect(adminStore.setFeatureFlagAllowAll).toHaveBeenCalledWith('offlineForms', true);
  });

  it('loads feature detail when managing a feature', async () => {
    adminStore.featureFlags = [
      { code: 'offlineForms', name: 'Offline Forms', enabled: true, allowAll: false },
    ];
    const wrapper = mount(AdminFeatureFlags, { global: { plugins: [pinia] } });
    await nextTick();
    const manageBtn = wrapper.find('[data-test="featureFlags-manage-offlineForms"]');
    await manageBtn.trigger('click');
    expect(adminStore.getFeatureFlag).toHaveBeenCalledWith('offlineForms');
  });
});
