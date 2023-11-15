import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import getRouter from '~/router';
import ManageLayout from '~/components/forms/manage/ManageLayout.vue';
import { useFormStore } from '~/store/form';

describe('ManageLayout.vue', () => {
  const pinia = createTestingPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
  });

  it('renders', () => {
    const wrapper = mount(ManageLayout, {
      props: {
        f: 'f',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ManageFormActions: true,
          ManageForm: true,
        },
      },
    });

    expect(wrapper.text()).toMatch('trans.manageLayout.manageForm');
  });

  it('calls the store actions', () => {
    const formId = '123-456';
    const fetchFormSpy = vi.spyOn(formStore, 'fetchForm');
    const getFormPermissionsForUserSpy = vi.spyOn(
      formStore,
      'getFormPermissionsForUser'
    );
    mount(ManageLayout, {
      props: {
        f: formId,
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ManageFormActions: true,
          ManageForm: true,
        },
      },
    });

    expect(fetchFormSpy).toHaveBeenCalledTimes(1);
    expect(getFormPermissionsForUserSpy).toHaveBeenCalledTimes(1);
  });

  it('shows the form name', async () => {
    formStore.fetchForm.mockImplementation(() => {
      formStore.form.name = 'myForm';
    });
    formStore.getFormPermissionsForUser.mockImplementation(() => [
      'design_read',
    ]);
    const wrapper = mount(ManageLayout, {
      props: {
        f: 'f',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ManageFormActions: true,
          ManageForm: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain('myForm');
  });
});
