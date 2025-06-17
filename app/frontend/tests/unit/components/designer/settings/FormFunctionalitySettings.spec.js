import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import FormFunctionalitySettings from '~/components/designer/settings/FormFunctionalitySettings.vue';
import { FormRoleCodes, AppPermissions, IdentityMode } from '~/utils/constants';
import { useAppStore } from '~/store/app';
import { ref, nextTick } from 'vue';

const IDIR = {
  active: true,
  login: true,
  code: 'idir',
  display: 'IDIR',
  idp: 'idir',
  permissions: [
    AppPermissions.VIEWS_FORM_STEPPER,
    AppPermissions.VIEWS_ADMIN,
    AppPermissions.VIEWS_FILE_DOWNLOAD,
    AppPermissions.VIEWS_FORM_EMAILS,
    AppPermissions.VIEWS_FORM_EXPORT,
    AppPermissions.VIEWS_FORM_MANAGE,
    AppPermissions.VIEWS_FORM_PREVIEW,
    AppPermissions.VIEWS_FORM_SUBMISSIONS,
    AppPermissions.VIEWS_FORM_TEAMS,
    AppPermissions.VIEWS_FORM_VIEW,
    AppPermissions.VIEWS_USER_SUBMISSIONS,
  ],
  primary: true,
  roles: [
    FormRoleCodes.OWNER,
    FormRoleCodes.TEAM_MANAGER,
    FormRoleCodes.FORM_DESIGNER,
    FormRoleCodes.SUBMISSION_REVIEWER,
    FormRoleCodes.FORM_SUBMITTER,
  ],
  tokenmap: {
    idp: 'identity_provider',
    email: 'email',
    fullName: 'name',
    lastName: 'family_name',
    username: 'idir_username',
    firstName: 'given_name',
    idpUserId: 'idir_user_guid',
    keycloakId: 'idir_user_guid',
  },
};

const BCEIDBASIC = {
  active: true,
  login: true,
  code: 'bceid-basic',
  display: 'Basic BCeID',
  idp: 'bceidbasic',
  permissions: [AppPermissions.VIEWS_USER_SUBMISSIONS],
  primary: false,
  roles: [FormRoleCodes.FORM_SUBMITTER],
  tokenmap: {
    idp: 'identity_provider',
    email: 'email',
    fullName: 'name',
    lastName: null,
    username: 'bceid_username',
    firstName: null,
    idpUserId: 'bceid_user_guid',
    keycloakId: 'bceid_user_guid',
  },
};

const BCEIDBUSINESS = {
  active: true,
  login: true,
  code: 'bceid-business',
  display: 'Business BCeID',
  idp: 'bceidbusiness',
  permissions: [
    AppPermissions.VIEWS_FORM_EXPORT,
    AppPermissions.VIEWS_FORM_MANAGE,
    AppPermissions.VIEWS_FORM_SUBMISSIONS,
    AppPermissions.VIEWS_FORM_TEAMS,
    AppPermissions.VIEWS_FORM_VIEW,
    AppPermissions.VIEWS_USER_SUBMISSIONS,
  ],
  primary: false,
  roles: [
    FormRoleCodes.TEAM_MANAGER,
    FormRoleCodes.SUBMISSION_REVIEWER,
    FormRoleCodes.FORM_SUBMITTER,
  ],
  tokenmap: {
    idp: 'identity_provider',
    email: 'email',
    fullName: 'name',
    lastName: null,
    username: 'bceid_username',
    firstName: null,
    idpUserId: 'bceid_user_guid',
    keycloakId: 'bceid_user_guid',
  },
};

// Helper function to create a complete form object
const createFormObject = (overrides = {}) => ({
  id: 'test-form-id',
  name: 'Test Form',
  description: 'Test Description',
  schedule: {
    enabled: false,
  },
  subscribe: {
    enabled: false,
  },
  enableSubmitterDraft: false,
  allowSubmitterToUploadFile: true,
  enableStatusUpdates: true,
  showAssigneeInSubmissionsTable: false,
  enableCopyExistingSubmission: false,
  enableMultiDraft: false,
  wideFormLayout: false,
  enableTeamMemberDraftShare: false,
  userType: IdentityMode.TEAM,
  ...overrides,
});

describe('FormFunctionalitySettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const authStore = useAuthStore(pinia);
  const formStore = useFormStore(pinia);
  const idpStore = useIdpStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    authStore.$reset();
    formStore.$reset();
    idpStore.$reset();
    appStore.$reset();

    authStore.identityProvider = ref({
      code: 'idir',
    });

    formStore.form = ref(createFormObject());
    formStore.isFormPublished = false;
    formStore.isRTL = false;

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS];
    idpStore.isPrimary = (code) => code === 'idir';
  });

  it('renders and displays form functionality settings', () => {
    const wrapper = mount(FormFunctionalitySettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toMatch(
      'trans.formSettings.canSaveAndEditDraftLabel'
    );
    expect(wrapper.text()).toMatch(
      'trans.formSettings.canUpdateStatusAsReviewer'
    );
    expect(wrapper.text()).toMatch('trans.formSettings.allowMultiDraft');
    expect(wrapper.text()).toMatch(
      'trans.formSettings.formSubmissinScheduleMsg'
    );
    expect(wrapper.text()).toMatch(
      'trans.formSettings.submitterCanCopyExistingSubmissn'
    );
    expect(wrapper.text()).toMatch('trans.formSettings.allowEventSubscription');
    expect(wrapper.text()).toMatch('trans.formSettings.wideFormLayout');
    expect(wrapper.text()).toMatch('trans.canShareDraft.shareDraftMessage');
  });

  it('submitters can not upload files if drafts are disabled', async () => {
    formStore.form = ref(createFormObject({ enableSubmitterDraft: true }));

    const wrapper = mount(FormFunctionalitySettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    expect(formStore.form.enableSubmitterDraft).toBeTruthy();
    expect(formStore.form.allowSubmitterToUploadFile).toBeTruthy();

    formStore.form.enableSubmitterDraft = false;

    wrapper.vm.enableSubmitterDraftChanged();

    expect(formStore.form.allowSubmitterToUploadFile).toBeFalsy();
  });

  it('if the submitter is allowed to upload files and drafts are disabled then enable drafts', async () => {
    formStore.form = ref(createFormObject({ enableSubmitterDraft: true }));

    const wrapper = mount(FormFunctionalitySettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    expect(formStore.form.enableSubmitterDraft).toBeTruthy();
    expect(formStore.form.allowSubmitterToUploadFile).toBeTruthy();
    expect(formStore.form.enableTeamMemberDraftShare).toBeFalsy();

    formStore.form.enableSubmitterDraft = false;

    wrapper.vm.allowSubmitterToUploadFileChanged();

    expect(formStore.form.enableSubmitterDraft).toBeTruthy();
    expect(formStore.form.allowSubmitterToUploadFile).toBeTruthy();
  });

  it('displays assignee checkbox when status updates is enabled and form is not public', async () => {
    // Set up form for non-public with status updates enabled
    formStore.form = ref(
      createFormObject({
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: false,
        userType: IdentityMode.TEAM, //'TEAM' for non-public forms
      })
    );

    const wrapper = mount(FormFunctionalitySettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    await wrapper.vm.$nextTick();

    const assigneeCheckbox = wrapper.find(
      '[data-test="showAssigneeInSubmissionsTableCheckbox"]'
    );
    expect(assigneeCheckbox.exists()).toBe(true);

    // Verify the text content is correct
    expect(wrapper.text()).toMatch('trans.formSettings.displayAssigneeColumn');
  });

  it('does not display assignee checkbox when status updates is disabled', async () => {
    formStore.form = ref(
      createFormObject({
        enableStatusUpdates: false, // Status updates disabled
        showAssigneeInSubmissionsTable: false,
        userType: IdentityMode.TEAM,
      })
    );

    const wrapper = mount(FormFunctionalitySettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    await wrapper.vm.$nextTick();

    // Should NOT show assignee checkbox when status updates disabled
    const assigneeCheckbox = wrapper.find(
      '[data-test="showAssigneeInSubmissionsTableCheckbox"]'
    );
    expect(assigneeCheckbox.exists()).toBe(false);
  });

  it('does not display assignee checkbox for public forms', async () => {
    formStore.form = ref(
      createFormObject({
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: false,
        userType: IdentityMode.PUBLIC, //public form
      })
    );

    const wrapper = mount(FormFunctionalitySettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    await wrapper.vm.$nextTick();

    // Should NOT show assignee checkbox for public forms
    const assigneeCheckbox = wrapper.find(
      '[data-test="showAssigneeInSubmissionsTableCheckbox"]'
    );
    expect(assigneeCheckbox.exists()).toBe(false);
  });

  it('toggles assignee checkbox value correctly', async () => {
    formStore.form = ref(
      createFormObject({
        enableStatusUpdates: true,
        showAssigneeInSubmissionsTable: false,
        userType: IdentityMode.TEAM,
      })
    );

    const wrapper = mount(FormFunctionalitySettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    await wrapper.vm.$nextTick();

    // Use findComponent instead of find, following the working pattern
    const assigneeCheckbox = wrapper.findComponent(
      '[data-test="showAssigneeInSubmissionsTableCheckbox"]'
    );
    expect(assigneeCheckbox.exists()).toBe(true);

    // Initial state should be false
    expect(formStore.form.showAssigneeInSubmissionsTable).toBe(false);

    // Test: User checks the checkbox -> should update the form store
    assigneeCheckbox.setValue(true);
    await nextTick; // Use nextTick like the working pattern

    // Verify that checking the box updated the form store
    expect(formStore.form.showAssigneeInSubmissionsTable).toBe(true);

    // Test: User unchecks the checkbox -> should update the form store
    assigneeCheckbox.setValue(false);
    await nextTick; // Use nextTick like the working pattern

    // Verify that unchecking the box updated the form store
    expect(formStore.form.showAssigneeInSubmissionsTable).toBe(false);
  });
});
