import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import FormFunctionalitySettings from '~/components/designer/settings/FormFunctionalitySettings.vue';
import { FormRoleCodes, AppPermissions } from '~/utils/constants';
import { useAppStore } from '~/store/app';

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
    formStore.form = ref({
      schedule: {
        enabled: false,
      },
      subscribe: {
        enabled: false,
      },
      enableSubmitterDraft: false,
      allowSubmitterToUploadFile: true,
    });
    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS];
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
  });

  it('submitters can not upload files if drafts are disabled', async () => {
    formStore.form.enableSubmitterDraft = true;
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
    formStore.form.enableSubmitterDraft = true;
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

    wrapper.vm.allowSubmitterToUploadFileChanged();

    expect(formStore.form.enableSubmitterDraft).toBeTruthy();
    expect(formStore.form.allowSubmitterToUploadFile).toBeTruthy();
  });
});
