import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import getRouter from '~/router';
import SubmissionsTable from '~/components/forms/SubmissionsTable.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

describe('SubmissionsTable.vue', () => {
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
    const refreshSubmissionsSpy = vi.spyOn(
      SubmissionsTable.methods,
      'refreshSubmissions'
    );
    formStore.form = {
      name: 'This is a form title',
    };
    refreshSubmissionsSpy.mockImplementation(() => {});
    const wrapper = mount(SubmissionsTable, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.text()).toContain('trans.formsTable.submissions');
    expect(wrapper.html()).toContain(formStore.form.name);
  });
});
