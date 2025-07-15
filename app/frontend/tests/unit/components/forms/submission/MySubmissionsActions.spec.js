import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, it } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';

import MySubmissionsActions from '~/components/forms/submission/MySubmissionsActions.vue';
import getRouter from '~/router';
import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';
import { useAppStore } from '~/store/app';

const FORM_ID = '123';
const STUBS = {
  RouterLink: {
    name: 'router-link',
    template: '<div class="router-link-stub"><slot /></div>',
  },
  VTooltip: {
    name: 'v-tooltip',
    template: '<div class="v-tooltip-stub"><slot /></div>',
  },
};

describe('MySubmissionsActions', () => {
  const pinia = createTestingPinia();
  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  setActivePinia(pinia);
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders', () => {
    const SUBMISSION = {
      permissions: [],
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.html()).not.toContain(
      'trans.mySubmissionsActions.copyThisSubmission'
    );
  });

  it('renders if this is a submitted submission and isCopyFromExistingSubmissionEnabled is true', () => {
    const SUBMISSION = {
      status: 'SUBMITTED',
    };
    formStore.form = {
      enableCopyExistingSubmission: true,
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.html()).toContain(
      'trans.mySubmissionsActions.copyThisSubmission'
    );
  });

  it('renders if this is a completed submission and isCopyFromExistingSubmissionEnabled is true', () => {
    const SUBMISSION = {
      status: 'COMPLETED',
    };
    formStore.form = {
      enableCopyExistingSubmission: true,
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.html()).toContain(
      'trans.mySubmissionsActions.copyThisSubmission'
    );
  });

  it('renders if this is a completed submission and isCopyFromExistingSubmissionEnabled is true', () => {
    const SUBMISSION = {
      status: 'ASSIGNED',
    };
    formStore.form = {
      enableCopyExistingSubmission: true,
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.html()).not.toContain(
      'trans.mySubmissionsActions.copyThisSubmission'
    );
  });

  it('hasDeletePermission returns true if the submission has the create permission', () => {
    let SUBMISSION = {
      permissions: [FormPermissions.SUBMISSION_CREATE],
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.hasDeletePermission).toBeTruthy();
  });

  it('hasDeletePermission returns false if the submission does not have the create permission', () => {
    let SUBMISSION = {
      permissions: [],
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.hasDeletePermission).toBeFalsy();
  });

  it('hasEditPermission returns true if the submission has the update permission', () => {
    let SUBMISSION = {
      permissions: [FormPermissions.SUBMISSION_UPDATE],
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.hasEditPermission).toBeTruthy();
  });

  it('hasEditPermission returns false if the submission does not have the update permission', () => {
    let SUBMISSION = {
      permissions: [],
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.hasEditPermission).toBeFalsy();
  });

  it('hasViewPermission returns true if the submission has the read permission', () => {
    let SUBMISSION = {
      permissions: [FormPermissions.SUBMISSION_READ],
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.hasViewPermission).toBeTruthy();
  });

  it('hasViewPermission returns false if the submission does not have the read permission', () => {
    let SUBMISSION = {
      permissions: [],
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.hasViewPermission).toBeFalsy();
  });

  it('isCopyFromExistingSubmissionEnabled returns true if the form has enableCopyExistingSubmission enabled', () => {
    let SUBMISSION = {
      permissions: [FormPermissions.SUBMISSION_READ],
    };
    formStore.form = {
      enableCopyExistingSubmission: true,
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.isCopyFromExistingSubmissionEnabled).toBeTruthy();
  });

  it('isCopyFromExistingSubmissionEnabled returns false if the form does not have enableCopyExistingSubmission enabled', () => {
    let SUBMISSION = {
      permissions: [],
    };
    formStore.form = {
      enableCopyExistingSubmission: false,
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    expect(wrapper.vm.isCopyFromExistingSubmissionEnabled).toBeFalsy();
  });

  it('draftDeleted will emit draft-deleted', async () => {
    let SUBMISSION = {
      permissions: [],
    };

    const wrapper = shallowMount(MySubmissionsActions, {
      props: {
        formId: FORM_ID,
        submission: SUBMISSION,
      },
      global: {
        plugins: [pinia, router],
        stubs: STUBS,
      },
    });

    wrapper.vm.draftDeleted();

    await flushPromises();

    expect(wrapper.emitted()).toHaveProperty('draft-deleted');
  });
});
