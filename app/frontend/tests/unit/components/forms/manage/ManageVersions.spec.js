import ManageVersions from '~/components/forms/manage/ManageVersions.vue';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, describe, expect, vi } from 'vitest';

import getRouter from '~/router';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import * as filters from '~/filters';

describe('ManageVersions', () => {
    const formId = '123-456';
    const draftId = 'draft-123';
    const formDesigner = {};

    let router;
    let pinia;
    let wrapper;

    beforeEach(() => {
      router = createRouter({
        history: createWebHistory(),
        routes: getRouter().getRoutes(),
      });

      pinia = createTestingPinia({
        createSpy: vi.fn,
      });
      setActivePinia(pinia);

      const authStore = useAuthStore();
      const formStore = useFormStore();
      authStore.$reset();
      formStore.$reset();
      formStore.form = { versions: [{published: false, version: '1'}] };

      vi.mock('~/filters', () => ({
        formatDateLong: vi.fn(() => 'mock date'),
      }));

      wrapper = mount(ManageVersions, {
          props: { formId },
          global: {
              plugins: [router, pinia],
              provide: {
                  formDesigner,
                  draftId,
                  formId,
              },
              mocks: {
                  $filters: filters,
              },
          },
      });
    });

    it('renders and contains important translation key', () => {
        expect(wrapper.text()).toContain('trans.manageVersions.important');
    });

    it('does not publish draft if cancelled', async () => {
        const togglePublishSpy = vi.spyOn(wrapper.vm, 'togglePublish').mockImplementation(() => {});
        console.log(wrapper.vm.form.versions[0]);

        // Simulate the publish toggle action followed by a cancel
        await wrapper.vm.togglePublish(true, draftId, '1', true);
        await wrapper.vm.cancelPublish();

        // Check the call
        expect(togglePublishSpy).toHaveBeenCalledTimes(1);
        // Check the form state, published should be false
        console.log(wrapper.vm.form.versions[0]);
        expect(wrapper.vm.form.versions[0].published).toBe(false);
    });
});
