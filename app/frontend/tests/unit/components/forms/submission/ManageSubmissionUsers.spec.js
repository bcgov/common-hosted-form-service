import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import { rbacService, userService } from '~/services';
import getRouter from '~/router';
import ManageSubmissionUsers from '~/components/forms/submission/ManageSubmissionUsers.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { useIdpStore } from '~/store/identityProviders';
import { FormPermissions } from '~/utils/constants';
import { useAppStore } from '~/store/app';

const providers = require('../../../fixtures/identityProviders.json');

describe('ManageSubmissionUsers.vue', () => {
  const SUBMISSION_ID = '1111111111-1111-1111-111111111111';
  // mock out all the service calls that may be called in this component
  const getSubmissionUsersSpy = vi.spyOn(rbacService, 'getSubmissionUsers');
  const setSubmissionUserPermissionsSpy = vi.spyOn(
    rbacService,
    'setSubmissionUserPermissions'
  );
  const getUsersSpy = vi.spyOn(userService, 'getUsers');
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  beforeEach(() => {
    // we need to reset and give a base implementation
    // without a base implementation we could see Error: connect ECONNREFUSED 127.0.0.1:3000
    // messages in the logs as it tries to make a call to non-running host
    getSubmissionUsersSpy.mockReset();
    setSubmissionUserPermissionsSpy.mockReset();
    getUsersSpy.mockReset();
    getSubmissionUsersSpy.mockImplementation(() => ({ data: [] }));
    setSubmissionUserPermissionsSpy.mockImplementation(() => ({ data: [] }));
    getUsersSpy.mockImplementation(() => ({ data: [] }));
  });

  afterAll(() => {
    // restore all the call spies.
    getSubmissionUsersSpy.mockRestore();
    setSubmissionUserPermissionsSpy.mockRestore();
    getUsersSpy.mockRestore();
  });

  it('renders', () => {
    const pinia = createTestingPinia({ stubActions: false });
    setActivePinia(pinia);
    const formStore = useFormStore(pinia);
    useAppStore(pinia);

    formStore.form.name = 'myForm';
    getSubmissionUsersSpy.mockImplementation(() => ({ data: [] }));
    const wrapper = mount(ManageSubmissionUsers, {
      props: {
        isDraft: false,
        submissionId: SUBMISSION_ID,
        formId: '123',
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

  it('autocompleteLabel returns exactEmailOrUsername if the selected idp is not the primary, requiredField otherwise', async () => {
    const pinia = createTestingPinia({ stubActions: false });
    const idpStore = useIdpStore(pinia);
    setActivePinia(pinia);
    idpStore.providers = providers;
    const wrapper = shallowMount(ManageSubmissionUsers, {
      props: {
        isDraft: false,
        submissionId: SUBMISSION_ID,
        formId: '123',
      },
      global: {
        plugins: [router, pinia],
      },
    });

    wrapper.vm.selectedIdp = null;
    await flushPromises();
    // default is null selectedIdp
    expect(wrapper.vm.autocompleteLabel).toEqual(
      'trans.manageSubmissionUsers.exactEmailOrUsername'
    );
    wrapper.vm.selectedIdp = 'idir';
    await flushPromises();
    expect(wrapper.vm.autocompleteLabel).toEqual(
      'trans.manageSubmissionUsers.requiredField'
    );
  });

  it('onChangeSelectedIdp does nothing if idp did not change, otherwise resets userSearchResults', () => {
    const wrapper = shallowMount(ManageSubmissionUsers, {
      props: {
        isDraft: false,
        submissionId: SUBMISSION_ID,
        formId: '123',
      },
      global: {
        plugins: [router],
      },
    });

    wrapper.vm.userSearchResults = ['we put something in here'];
    // nothing changes if we don't change the idp
    wrapper.vm.onChangeSelectedIdp('idir', 'idir');
    expect(wrapper.vm.userSearchResults).toEqual(['we put something in here']);
    // should reset userSearchResults if idp is changed
    wrapper.vm.onChangeSelectedIdp('idir', 'bceid-basic');
    expect(wrapper.vm.userSearchResults).toEqual([]);
  });

  it('onChangeUserSearchInput should get the userSearchResults', async () => {
    const pinia = createTestingPinia({ stubActions: false });
    const idpStore = useIdpStore(pinia);
    setActivePinia(pinia);
    idpStore.providers = providers;
    const wrapper = shallowMount(ManageSubmissionUsers, {
      props: {
        isDraft: false,
        submissionId: SUBMISSION_ID,
        formId: '123',
      },
      global: {
        plugins: [router, pinia],
      },
    });

    // no input returns nothing
    wrapper.vm.onChangeUserSearchInput();
    expect(wrapper.vm.userSearchResults).toEqual([]);

    // errors should be caught and swallowed, no results
    getUsersSpy.mockImplementationOnce(async () => {
      throw new Error();
    });
    wrapper.vm.onChangeUserSearchInput('search');
    expect(wrapper.vm.userSearchResults).toEqual([]);

    await flushPromises();

    getUsersSpy.mockReset();
    getUsersSpy.mockImplementation(async () => {
      return {
        data: ['something'],
      };
    });
    wrapper.vm.onChangeUserSearchInput('search');
    expect(wrapper.vm.userSearchResults).toEqual([]);

    // idir means no teamMembershipConfig, getUsers should be called with just the search
    wrapper.vm.onChangeUserSearchInput('search');
    expect(getUsersSpy).toHaveBeenCalledWith({
      idpCode: 'idir',
      search: 'search',
    });
    getUsersSpy.mockReset();

    // bceid has search input length and exact search for email
    wrapper.vm.selectedIdp = 'bceid-basic';

    // should throw an error if search input is shorter than the min length specified by teamMebershipConfig
    getUsersSpy.mockImplementationOnce(async () => {
      throw new Error();
    });
    wrapper.vm.onChangeUserSearchInput('jon');
    expect(wrapper.vm.userSearchResults).toEqual([]);
    getUsersSpy.mockReset();

    // should throw an error if search input is not a valid email specified by teamMebershipConfig
    getUsersSpy.mockImplementationOnce(async () => {
      throw new Error();
    });
    wrapper.vm.onChangeUserSearchInput('john@email.');
    expect(wrapper.vm.userSearchResults).toEqual([]);
    getUsersSpy.mockReset();

    // should return email in the params if it is a valid email
    getUsersSpy.mockImplementationOnce(() => ({ data: [] }));
    wrapper.vm.onChangeUserSearchInput('john@email.com');
    expect(getUsersSpy).toHaveBeenCalledWith({
      idpCode: 'bceid-basic',
      email: 'john@email.com',
    });
    getUsersSpy.mockReset();

    // should return username in the params if it is a valid username
    getUsersSpy.mockImplementationOnce(() => ({ data: [] }));
    wrapper.vm.onChangeUserSearchInput('johndoe');
    expect(getUsersSpy).toHaveBeenCalledWith({
      idpCode: 'bceid-basic',
      username: 'johndoe',
    });
    getUsersSpy.mockReset();
  });

  it('addUser will add user if they are not on the team otherwise addNotification', async () => {
    const pinia = createTestingPinia({ stubActions: false });
    const notificationStore = useNotificationStore(pinia);
    setActivePinia(pinia);
    const addNotificationSpy = vi
      .spyOn(notificationStore, 'addNotification')
      .mockImplementation(() => {});
    const wrapper = shallowMount(ManageSubmissionUsers, {
      props: {
        isDraft: false,
        submissionId: SUBMISSION_ID,
        formId: '123',
      },
      global: {
        plugins: [router, pinia],
      },
    });

    // if the user is already on the team, it should addNotification as an error
    wrapper.vm.userSearchSelection = {
      id: 1,
    };
    wrapper.vm.formSubmissionUsers = [{ id: 1 }];
    await wrapper.vm.addUser();
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);

    // otherwise it should try to call modifyPermissions
    wrapper.vm.userSearchSelection = {
      id: 1,
    };
    wrapper.vm.formSubmissionUsers = [];
    await wrapper.vm.addUser();

    expect(setSubmissionUserPermissionsSpy).toHaveBeenCalledTimes(1);
  });

  it('modifyPermissions will give a success message depending on permissions length', async () => {
    const pinia = createTestingPinia({ stubActions: false });
    const notificationStore = useNotificationStore(pinia);
    setActivePinia(pinia);
    const wrapper = shallowMount(ManageSubmissionUsers, {
      props: {
        isDraft: false,
        submissionId: SUBMISSION_ID,
        formId: '123',
      },
      global: {
        plugins: [router, pinia],
      },
    });

    await flushPromises();

    const addNotificationSpy = vi
      .spyOn(notificationStore, 'addNotification')
      .mockImplementation(() => {});

    // if an error occurs, a notification should be given
    setSubmissionUserPermissionsSpy.mockImplementation(() => {
      throw new Error();
    });
    await wrapper.vm.modifyPermissions('123', [
      FormPermissions.SUBMISSION_UPDATE,
    ]);
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledWith({
      consoleError: 'trans.manageSubmissionUsers.updateUserErrMsg',
      text: 'trans.manageSubmissionUsers.updateUserErrMsg',
    });
    addNotificationSpy.mockReset();
    setSubmissionUserPermissionsSpy.mockReset();

    setSubmissionUserPermissionsSpy.mockImplementation(async () => {
      return {
        data: [
          {
            userId: 'userId',
            user: {
              email: 'email',
              fullName: 'fullName',
              username: 'username',
            },
            permissions: [FormPermissions.SUBMISSION_CREATE],
          },
        ],
      };
    });
    // we're adding permissions to a user
    wrapper.vm.userSearchSelection = {
      email: 'john@email.com',
    };
    await wrapper.vm.modifyPermissions('123', [
      FormPermissions.SUBMISSION_UPDATE,
    ]);
    expect(addNotificationSpy).toHaveBeenCalledWith({
      color: 'success',
      icon: 'mdi:mdi-check-circle',
      text: 'trans.manageSubmissionUsers.sentInviteEmailTo john@email.com',
      type: 'success',
    });
  });

  it('removeUser should set userToDelete to the selected user and show the delete dialog', () => {
    const wrapper = shallowMount(ManageSubmissionUsers, {
      props: {
        isDraft: false,
        submissionId: SUBMISSION_ID,
        formId: '123',
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.vm.userToDelete).toEqual({});
    expect(wrapper.vm.showDeleteDialog).toBeFalsy();

    wrapper.vm.removeUser({ id: '123' });

    expect(wrapper.vm.userToDelete).toEqual({ id: '123' });
    expect(wrapper.vm.showDeleteDialog).toBeTruthy();
  });
});
