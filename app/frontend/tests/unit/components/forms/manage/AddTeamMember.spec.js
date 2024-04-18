import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect } from 'vitest';

import getRouter from '~/router';
import AddTeamMember from '~/components/forms/manage/AddTeamMember.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { FormRoleCodes, IdentityProviders } from '~/utils/constants';

describe('AddTeamMember.vue', () => {
  const formId = '123-456';
  const exampleUser = {
    fullName: 'FULL NAME',
  };

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

  it('shows the add new member button if the button has not been clicked', () => {
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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

    expect(wrapper.text()).toContain('trans.addTeamMember.addNewMember');
  });

  it('shows the add team member modal', async () => {
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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

    wrapper.setData({ addingUsers: true });

    await flushPromises();

    const idirInput = wrapper.find('[aria-label="IDIR"]');
    expect(idirInput).not.toBeNull();
    expect(idirInput.element.value).toBe(IdentityProviders.IDIR);
    const bceidBasicInput = wrapper.find('[aria-label="Basic BCeID"]');
    expect(bceidBasicInput).not.toBeNull();
    expect(bceidBasicInput.element.value).toBe(IdentityProviders.BCEIDBASIC);
    const bceidBusinessInput = wrapper.find('[aria-label="Business BCeID"]');
    expect(bceidBusinessInput).not.toBeNull();
    expect(bceidBusinessInput.element.value).toBe(
      IdentityProviders.BCEIDBUSINESS
    );
  });

  it('idir should show all roles', async () => {
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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

    wrapper.setData({ addingUsers: true, selectedIdp: IdentityProviders.IDIR });

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });
  });

  it('basic bceid should show only form_submitter role', async () => {
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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
      selectedIdp: IdentityProviders.BCEIDBASIC,
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
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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
      selectedIdp: IdentityProviders.BCEIDBUSINESS,
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
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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
      selectedIdp: IdentityProviders.IDIR,
    });

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    wrapper.setData({
      addingUsers: true,
      selectedIdp: IdentityProviders.BCEIDBASIC,
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
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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
      selectedIdp: IdentityProviders.IDIR,
    });

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    wrapper.setData({
      addingUsers: true,
      selectedIdp: IdentityProviders.BCEIDBUSINESS,
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
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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
      selectedIdp: IdentityProviders.BCEIDBASIC,
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
      selectedIdp: IdentityProviders.IDIR,
    });

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });

    wrapper.setData({
      addingUsers: true,
      selectedIdp: IdentityProviders.BCEIDBUSINESS,
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
      selectedIdp: IdentityProviders.IDIR,
    });

    await flushPromises();

    Object.values(FormRoleCodes).forEach((frc) => {
      expect(wrapper.text()).toContain(frc);
    });
  });

  it('changing idp from bceid business to basic should show only form submitter role', async () => {
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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
      selectedIdp: IdentityProviders.BCEIDBUSINESS,
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
      selectedIdp: IdentityProviders.BCEIDBASIC,
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
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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
      selectedIdp: IdentityProviders.BCEIDBASIC,
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
      selectedIdp: IdentityProviders.BCEIDBUSINESS,
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
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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
      selectedIdp: IdentityProviders.BCEIDBASIC,
    });

    await flushPromises();

    wrapper.setData({
      model: exampleUser,
      selectedRoles: [FormRoleCodes.FORM_SUBMITTER],
    });

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.setData({
      selectedIdp: IdentityProviders.BCEIDBUSINESS,
    });

    await flushPromises();

    expect(wrapper.vm.model).toBeNull();
    expect(wrapper.vm.selectedRoles).toEqual([]);
  });

  it('changing idp from bceid business to basic should clear the selected user and all selected roles', async () => {
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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
      selectedIdp: IdentityProviders.BCEIDBUSINESS,
    });

    await flushPromises();

    wrapper.setData({
      model: exampleUser,
      selectedRoles: [FormRoleCodes.FORM_SUBMITTER],
    });

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.setData({
      selectedIdp: IdentityProviders.BCEIDBASIC,
    });

    await flushPromises();

    expect(wrapper.vm.model).toBeNull();
    expect(wrapper.vm.selectedRoles).toEqual([]);
  });

  it('changing idp from bceid basic to idir should clear the selected user and all selected roles', async () => {
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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
      selectedIdp: IdentityProviders.BCEIDBASIC,
    });

    await flushPromises();

    wrapper.setData({
      model: exampleUser,
      selectedRoles: [FormRoleCodes.FORM_SUBMITTER],
    });

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.setData({
      selectedIdp: IdentityProviders.IDIR,
    });

    await flushPromises();

    expect(wrapper.vm.model).toBeNull();
    expect(wrapper.vm.selectedRoles).toEqual([]);
  });

  it('changing idp from bceid business to IDIR should clear the selected user and all selected roles', async () => {
    const wrapper = mount(AddTeamMember, {
      props: {
        formId: formId,
      },
      global: {
        plugins: [router, pinia],
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
      selectedIdp: IdentityProviders.BCEIDBUSINESS,
    });

    await flushPromises();

    wrapper.setData({
      model: exampleUser,
      selectedRoles: [FormRoleCodes.FORM_SUBMITTER],
    });

    expect(wrapper.vm.model).toEqual(exampleUser);
    expect(wrapper.vm.selectedRoles).toEqual([FormRoleCodes.FORM_SUBMITTER]);

    wrapper.setData({
      selectedIdp: IdentityProviders.IDIR,
    });

    await flushPromises();

    expect(wrapper.vm.model).toBeNull();
    expect(wrapper.vm.selectedRoles).toEqual([]);
  });
});
