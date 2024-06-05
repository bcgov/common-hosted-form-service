import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { expect } from 'vitest';

import AddTeamMember from '~/components/forms/manage/AddTeamMember.vue';
import { useIdpStore } from '~/store/identityProviders';
import { FormRoleCodes, AppPermissions } from '~/utils/constants';

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

    wrapper.setData({
      selectedIdp: IDIR.code,
    });

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

    wrapper.setData({ addingUsers: true });

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

    wrapper.setData({ addingUsers: true, selectedIdp: IDIR.code });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBASIC.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBUSINESS.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: IDIR.code,
    });

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBASIC.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: IDIR.code,
    });

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBUSINESS.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBASIC.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: IDIR.code,
    });

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBUSINESS.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: IDIR.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBUSINESS.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBASIC.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBASIC.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBUSINESS.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBASIC.code,
    });

    await flushPromises();

    wrapper.setData({
      model: exampleUser,
      selectedRoles: [FormRoleCodes.FORM_SUBMITTER],
    });

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.setData({
      selectedIdp: BCEIDBUSINESS.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBUSINESS.code,
    });

    await flushPromises();

    wrapper.setData({
      model: exampleUser,
      selectedRoles: [FormRoleCodes.FORM_SUBMITTER],
    });

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.setData({
      selectedIdp: BCEIDBASIC.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBASIC.code,
    });

    await flushPromises();

    wrapper.setData({
      model: exampleUser,
      selectedRoles: [FormRoleCodes.FORM_SUBMITTER],
    });

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.setData({
      selectedIdp: IDIR.code,
    });

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

    wrapper.setData({
      addingUsers: true,
      selectedIdp: BCEIDBUSINESS.code,
    });

    await flushPromises();

    wrapper.setData({
      model: exampleUser,
      selectedRoles: [FormRoleCodes.FORM_SUBMITTER],
    });

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.setData({
      selectedIdp: IDIR.code,
    });

    await flushPromises();

    expect(wrapper.vm.model).toBeNull();
    expect(wrapper.vm.selectedRoles).toEqual([]);
  });
});
