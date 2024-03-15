import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import getRouter from '~/router';
import TeamManagement from '~/components/forms/manage/TeamManagement.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

describe('TeamManagement.vue', () => {
  const formId = '123-456';

  const pinia = createTestingPinia();

  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const authStore = useAuthStore(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    authStore.$reset();
    formStore.$reset();
  });

  it('renders', () => {
    const loadItemsSpy = vi.spyOn(TeamManagement.methods, 'loadItems');
    formStore.form = {
      name: 'This is a form title',
    };
    loadItemsSpy.mockImplementation(() => {});
    const wrapper = mount(TeamManagement, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toContain('trans.teamManagement.teamManagement');
    expect(wrapper.html()).toContain(formStore.form.name);
  });
});
