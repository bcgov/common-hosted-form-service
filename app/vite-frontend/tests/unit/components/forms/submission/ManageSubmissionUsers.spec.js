import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import { rbacService } from '~/services';
import getRouter from '~/router';
import ManageSubmissionUsers from '~/components/forms/submission/ManageSubmissionUsers.vue';
import { useFormStore } from '~/store/form';

describe('ManageSubmissionUsers.vue', () => {
  const SUBMISSION_ID = '1111111111-1111-1111-111111111111';
  const getSubmissionUsersSpy = vi.spyOn(rbacService, 'getSubmissionUsers');
  const pinia = createTestingPinia();
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);

  beforeEach(() => {
    getSubmissionUsersSpy.mockReset();
    formStore.$reset();
  });

  afterAll(() => {
    getSubmissionUsersSpy.mockRestore();
  });

  it('renders', () => {
    formStore.form.name = 'myForm';
    getSubmissionUsersSpy.mockImplementation(() => ({ data: [] }));
    const wrapper = mount(ManageSubmissionUsers, {
      props: {
        isDraft: false,
        submissionId: SUBMISSION_ID,
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          BaseDialog: true,
          VDialog: {
            name: 'VDialog',
            template: '<div class="v-dialog-stub"><slot /></div>',
          },
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain(
      'trans.manageSubmissionUsers.manageTeamMembers'
    );
  });
});
