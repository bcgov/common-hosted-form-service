import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, expect, vi } from 'vitest';

import AddTeamMember from '~/components/forms/manage/AddTeamMember.vue';
import { useIdpStore } from '~/store/identityProviders';
import { FormRoleCodes, AppPermissions } from '~/utils/constants';
import userService from '~/services/userService';

const IDIR = {
  active: true,
  login: true,
  code: 'idir',
  display: 'IDIR',
  extra: {},
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
    FormRoleCodes.SUBMISSION_APPROVER,
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
  extra: {
    addTeamMemberSearch: {
      email: {
        exact: true,
        message: 'trans.manageSubmissionUsers.exactBCEIDSearch',
      },
      text: {
        message: 'trans.manageSubmissionUsers.searchInputLength',
        minLength: 6,
      },
    },
    userSearch: {
      detail: 'Could not retrieve BCeID users. Invalid options provided.',
      filters: [
        {
          name: 'filterIdpUserId',
          param: 'idpUserId',
          required: 0,
        },
        {
          name: 'filterIdpCode',
          param: 'idpCode',
          required: 0,
        },
        {
          name: 'filterUsername',
          param: 'username',
          exact: true,
          required: 2,
          caseSensitive: false,
        },
        {
          name: 'filterFullName',
          param: 'fullName',
          required: 0,
        },
        {
          name: 'filterFirstName',
          param: 'firstName',
          required: 0,
        },
        {
          name: 'filterLastName',
          param: 'lastName',
          required: 0,
        },
        {
          name: 'filterEmail',
          exact: true,
          param: 'email',
          required: 2,
          caseSensitive: false,
        },
        {
          name: 'filterSearch',
          param: 'search',
          required: 0,
        },
      ],
    },
  },
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
  extra: {
    addTeamMemberSearch: {
      email: {
        exact: true,
        message: 'trans.manageSubmissionUsers.exactBCEIDSearch',
      },
      text: {
        message: 'trans.manageSubmissionUsers.searchInputLength',
        minLength: 6,
      },
    },
    formAccessSettings: 'idim',
    userSearch: {
      detail: 'Could not retrieve BCeID users. Invalid options provided.',
      filters: [
        {
          name: 'filterIdpUserId',
          param: 'idpUserId',
          required: 0,
        },
        {
          name: 'filterIdpCode',
          param: 'idpCode',
          required: 0,
        },
        {
          name: 'filterUsername',
          param: 'username',
          exact: true,
          required: 2,
          caseSensitive: false,
        },
        {
          name: 'filterFullName',
          param: 'fullName',
          required: 0,
        },
        {
          name: 'filterFirstName',
          param: 'firstName',
          required: 0,
        },
        {
          name: 'filterLastName',
          param: 'lastName',
          required: 0,
        },
        {
          name: 'filterEmail',
          exact: true,
          param: 'email',
          required: 2,
          caseSensitive: false,
        },
        {
          name: 'filterSearch',
          param: 'search',
          required: 0,
        },
      ],
    },
  },
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
    FormRoleCodes.SUBMISSION_APPROVER,
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

const PUBLIC = {
  active: true,
  login: false,
  code: 'public',
  display: 'Public',
  extra: {},
  idp: 'public',
  permissions: [],
  primary: false,
  roles: null,
  tokenmap: null,
};

const STUBS = {
  VTooltip: {
    name: 'VTooltip',
    template: '<div class="v-tooltip-stub"><slot /></div>',
  },
  VBtn: {
    name: 'VBtn',
    template: '<div class="v-btn-stub"><slot /></div>',
  },
  VIcon: {
    name: 'VIcon',
    template: '<div class="v-icon-stub"><slot /></div>',
  },
};

describe('AddTeamMember.vue', () => {
  const formId = '123-456';
  const exampleUser = {
    fullName: 'FULL NAME',
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows the add new member button if the button has not been clicked', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.selectedIdp = IDIR.code;
    await flushPromises();

    expect(wrapper.text()).toContain('trans.addTeamMember.addNewMember');
  });

  it('shows the add team member modal', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: STUBS,
      },
    });

    wrapper.vm.addingUsers = true;

    await flushPromises();

    const idirInput = wrapper.find('[aria-label="IDIR"]');
    expect(idirInput).not.toBeNull();
    expect(idirInput.element.value).toBe(IDIR.code);
    const bceidBasicInput = wrapper.find('[aria-label="Basic BCeID"]');
    expect(bceidBasicInput).not.toBeNull();
    expect(bceidBasicInput.element.value).toBe(BCEIDBASIC.code);
    const bceidBusinessInput = wrapper.find('[aria-label="Business BCeID"]');
    expect(bceidBusinessInput).not.toBeNull();
    expect(bceidBusinessInput.element.value).toBe(BCEIDBUSINESS.code);
  });

  it('idir should show all roles', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = IDIR.code;

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });
  });

  it('basic bceid should show only form_submitter role', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBASIC.code;

    await flushPromises();

    [FormRoleCodes.FORM_SUBMITTER].forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    [
      FormRoleCodes.OWNER,
      FormRoleCodes.SUBMISSION_REVIEWER,
      FormRoleCodes.TEAM_MANAGER,
      FormRoleCodes.FORM_DESIGNER,
    ].forEach((frc) => {
      expect(wrapper.text()).not.toContain(frc);
    });
  });

  it('business bceid should show only form_submitter, submission_reviewer, team_manager roles', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBUSINESS.code;

    await flushPromises();

    [
      FormRoleCodes.FORM_SUBMITTER,
      FormRoleCodes.SUBMISSION_REVIEWER,
      FormRoleCodes.TEAM_MANAGER,
    ].forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    [FormRoleCodes.OWNER, FormRoleCodes.FORM_DESIGNER].forEach((frc) => {
      expect(wrapper.text()).not.toContain(frc);
    });
  });

  it('changing idp from idir to bceid basic should only show form submitter role', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = IDIR.code;

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBASIC.code;

    await flushPromises();

    [FormRoleCodes.FORM_SUBMITTER].forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    [
      FormRoleCodes.OWNER,
      FormRoleCodes.SUBMISSION_REVIEWER,
      FormRoleCodes.TEAM_MANAGER,
      FormRoleCodes.FORM_DESIGNER,
    ].forEach((frc) => {
      expect(wrapper.text()).not.toContain(frc);
    });
  });

  it('changing idp from idir to bceid business should only show form submitter, submission reviewer, team manager roles', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = IDIR.code;

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBUSINESS.code;

    await flushPromises();

    [
      FormRoleCodes.FORM_SUBMITTER,
      FormRoleCodes.SUBMISSION_REVIEWER,
      FormRoleCodes.TEAM_MANAGER,
    ].forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    [FormRoleCodes.OWNER, FormRoleCodes.FORM_DESIGNER].forEach((frc) => {
      expect(wrapper.text()).not.toContain(frc);
    });
  });

  it('changing idp from bceid business or basic to idir should show all roles', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBASIC.code;

    await flushPromises();

    [FormRoleCodes.FORM_SUBMITTER].forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    [
      FormRoleCodes.OWNER,
      FormRoleCodes.SUBMISSION_REVIEWER,
      FormRoleCodes.TEAM_MANAGER,
      FormRoleCodes.FORM_DESIGNER,
    ].forEach((frc) => {
      expect(wrapper.text()).not.toContain(frc);
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = IDIR.code;

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBUSINESS.code;

    await flushPromises();

    [
      FormRoleCodes.FORM_SUBMITTER,
      FormRoleCodes.SUBMISSION_REVIEWER,
      FormRoleCodes.TEAM_MANAGER,
    ].forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    [FormRoleCodes.OWNER, FormRoleCodes.FORM_DESIGNER].forEach((frc) => {
      expect(wrapper.text()).not.toContain(frc);
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = IDIR.code;

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });
  });

  it('changing idp from bceid business to basic should show only form submitter role', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBUSINESS.code;

    await flushPromises();

    [
      FormRoleCodes.FORM_SUBMITTER,
      FormRoleCodes.SUBMISSION_REVIEWER,
      FormRoleCodes.TEAM_MANAGER,
    ].forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    [FormRoleCodes.OWNER, FormRoleCodes.FORM_DESIGNER].forEach((frc) => {
      expect(wrapper.text()).not.toContain(frc);
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBASIC.code;

    await flushPromises();

    [FormRoleCodes.FORM_SUBMITTER].forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    [
      FormRoleCodes.OWNER,
      FormRoleCodes.SUBMISSION_REVIEWER,
      FormRoleCodes.TEAM_MANAGER,
      FormRoleCodes.FORM_DESIGNER,
    ].forEach((frc) => {
      expect(wrapper.text()).not.toContain(frc);
    });
  });

  it('changing idp from bceid basic to business should show only form submitter, submission reviewer, team manager role', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBASIC.code;

    await flushPromises();

    [FormRoleCodes.FORM_SUBMITTER].forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    [
      FormRoleCodes.OWNER,
      FormRoleCodes.SUBMISSION_REVIEWER,
      FormRoleCodes.TEAM_MANAGER,
      FormRoleCodes.FORM_DESIGNER,
    ].forEach((frc) => {
      expect(wrapper.text()).not.toContain(frc);
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBUSINESS.code;

    await flushPromises();

    [
      FormRoleCodes.FORM_SUBMITTER,
      FormRoleCodes.SUBMISSION_REVIEWER,
      FormRoleCodes.TEAM_MANAGER,
    ].forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    [FormRoleCodes.OWNER, FormRoleCodes.FORM_DESIGNER].forEach((frc) => {
      expect(wrapper.text()).not.toContain(frc);
    });
  });

  it('changing idp from bceid basic to business should clear the selected user and all selected roles', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBASIC.code;

    await flushPromises();

    wrapper.vm.model = exampleUser;
    wrapper.vm.selectedRoles = [FormRoleCodes.FORM_SUBMITTER];

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.vm.selectedIdp = BCEIDBUSINESS.code;

    await flushPromises();

    expect(wrapper.vm.model).toBeNull();
    expect(wrapper.vm.selectedRoles).toEqual([]);
  });

  it('changing idp from bceid business to basic should clear the selected user and all selected roles', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBUSINESS.code;

    await flushPromises();

    wrapper.vm.model = exampleUser;
    wrapper.vm.selectedRoles = [FormRoleCodes.FORM_SUBMITTER];

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.vm.selectedIdp = BCEIDBASIC.code;

    await flushPromises();

    expect(wrapper.vm.model).toBeNull();
    expect(wrapper.vm.selectedRoles).toEqual([]);
  });

  it('changing idp from bceid basic to idir should clear the selected user and all selected roles', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBASIC.code;

    await flushPromises();

    wrapper.vm.model = exampleUser;
    wrapper.vm.selectedRoles = [FormRoleCodes.FORM_SUBMITTER];

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.vm.selectedIdp = IDIR.code;

    await flushPromises();

    expect(wrapper.vm.model).toBeNull();
    expect(wrapper.vm.selectedRoles).toEqual([]);
  });

  it('changing idp from bceid business to IDIR should clear the selected user and all selected roles', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = BCEIDBUSINESS.code;

    await flushPromises();

    wrapper.vm.model = exampleUser;
    wrapper.vm.selectedRoles = [FormRoleCodes.FORM_SUBMITTER];

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.vm.addingUsers = true;
    wrapper.vm.selectedIdp = IDIR.code;

    await flushPromises();

    expect(wrapper.vm.model).toBeNull();
    expect(wrapper.vm.selectedRoles).toEqual([]);
  });

  it('filterObject will return true if the query text exists', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    let filteredObject = wrapper.vm.filterObject('', 'john', {
      full_name: 'john doe',
      email: 'email@email.com',
    });

    expect(filteredObject).toBeTruthy();

    filteredObject = wrapper.vm.filterObject('', 'test', {
      full_name: 'john doe',
      email: 'email@email.com',
    });

    expect(filteredObject).toBeFalsy();
  });

  it('filterObject will return true if the query text exists inside a nested object', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    let filteredObject = wrapper.vm.filterObject('', 'john', {
      name: {
        first: 'john',
        last: 'doe',
      },
      email: 'email@email.com',
    });

    expect(filteredObject).toBeTruthy();

    filteredObject = wrapper.vm.filterObject('', 'test', {
      name: {
        first: 'john',
        last: 'doe',
      },
      email: 'email@email.com',
    });

    expect(filteredObject).toBeFalsy();
  });

  it('save will fail if there are no selected roles', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.selectedRoles = [];

    wrapper.vm.save();

    expect(wrapper.vm.showError).toBeTruthy();
  });

  it('save will emit the new users to add', async () => {
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.addingUsers = true;
    wrapper.vm.model = 'john';
    wrapper.vm.selectedRoles = ['owner'];

    expect(wrapper.vm.addingUsers).toBeTruthy();
    wrapper.vm.save();
    expect(wrapper.emitted()).toHaveProperty('new-users');
    expect(wrapper.emitted()).toEqual({
      'new-users': [[['john'], ['owner']]],
    });
    expect(wrapper.vm.model).toEqual(null);
    expect(wrapper.vm.addingUsers).toBeFalsy();
  });

  it('search users will simply return if the input is the same as the model', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.model = 'johndoe';
    wrapper.vm.selectedIdp = BCEIDBASIC.code;
    await wrapper.vm.searchUsers('johndoe');
    expect(wrapper.vm.entries).toEqual([]);
  });

  it('search users will set the search parameters if there is no teamMembershipConfig', async () => {
    const getUsersSpy = vi.spyOn(userService, 'getUsers');

    getUsersSpy.mockImplementation((params) => {
      return {
        data: [params],
      };
    });
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.selectedIdp = IDIR.code;
    await wrapper.vm.searchUsers('johndoe');
    expect(wrapper.vm.entries[0].search).toEqual('johndoe');
  });

  it('search users should throw error if the idp config text min length is too short', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.selectedIdp = BCEIDBASIC.code;
    await wrapper.vm.searchUsers('john');
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenLastCalledWith(
      'trans.manageSubmissionUsers.getUsersErrMsg'
    );
  });

  it('search users should throw error there is an @ and it is a bad email but success otherwise', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const getUsersSpy = vi.spyOn(userService, 'getUsers');

    getUsersSpy.mockImplementation((params) => {
      return {
        data: [params],
      };
    });
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.selectedIdp = BCEIDBASIC.code;
    await wrapper.vm.searchUsers('email@email');
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenLastCalledWith(
      'trans.manageSubmissionUsers.getUsersErrMsg'
    );
    await wrapper.vm.searchUsers('email@email.com');
    expect(wrapper.vm.entries[0].email).toEqual('email@email.com');
  });

  it('search users should return the search value if it is valid', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const getUsersSpy = vi.spyOn(userService, 'getUsers');

    getUsersSpy.mockImplementation((params) => {
      return {
        data: [params],
      };
    });
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.selectedIdp = BCEIDBASIC.code;
    await wrapper.vm.searchUsers('johndoe');
    expect(wrapper.vm.entries[0].username).toEqual('johndoe');
  });

  it('search users should return nothing if there is no input', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const getUsersSpy = vi.spyOn(userService, 'getUsers');

    getUsersSpy.mockImplementation((params) => {
      return {
        data: [params],
      };
    });
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.selectedIdp = BCEIDBASIC.code;
    await wrapper.vm.searchUsers('');
    expect(wrapper.vm.entries).toEqual([]);
  });

  it('clears timeout when unmounted', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const getUsersSpy = vi.spyOn(userService, 'getUsers');

    getUsersSpy.mockImplementation((params) => {
      return {
        data: [params],
      };
    });
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.unmount();

    expect(wrapper.vm.debounceTimer).toBeNull();
  });

  it('clears timeout if debounce timer is already set', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const getUsersSpy = vi.spyOn(userService, 'getUsers');

    getUsersSpy.mockImplementation((params) => {
      return {
        data: [params],
      };
    });
    const pinia = createTestingPinia({ stubActions: false });

    setActivePinia(pinia);
    const idpStore = useIdpStore(pinia);

    idpStore.providers = [IDIR, BCEIDBASIC, BCEIDBUSINESS, PUBLIC];

    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [pinia],
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template: '<div class="v-tooltip-stub"><slot /></div>',
          },
          VBtn: {
            name: 'VBtn',
            template: '<div class="v-btn-stub"><slot /></div>',
          },
          VIcon: {
            name: 'VIcon',
            template: '<div class="v-icon-stub"><slot /></div>',
          },
          VChipGroup: {
            name: 'VChipGroup',
            template: '<div class="v-chip-group-stub"><slot /></div>',
          },
          VChip: {
            name: 'VChip',
            template: '<div class="v-chip-stub"><slot /></div>',
          },
        },
      },
    });

    wrapper.vm.selectedIdp = IDIR.code;

    expect(wrapper.vm.debounceTimer).toBeNull();
    wrapper.vm.debounceSearch('this is some user');
    expect(wrapper.vm.debounceTimer).not.toBeNull();
    wrapper.vm.debounceTime = 1;
    wrapper.vm.debounceSearch('this is another user');
    expect(wrapper.vm.debounceTimer).not.toBeNull();

    vi.runAllTimersAsync();

    await flushPromises();
    expect(getUsersSpy).toBeCalledTimes(1);
  });
});
