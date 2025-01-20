import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';

import { useFormStore } from '~/store/form';
import FormAccessSettings from '~/components/designer/settings/FormAccessSettings.vue';
import { IdentityMode } from '~/utils/constants';
import { useAppStore } from '~/store/app';

describe('FormAccessSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders and displays 3 radio buttons', () => {
    const wrapper = mount(FormAccessSettings, {
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

    expect(wrapper.text()).toMatch('trans.formSettings.public');
    expect(wrapper.text()).toMatch('trans.formSettings.loginRequired');
    expect(wrapper.text()).toMatch('trans.formSettings.specificTeamMembers');
  });

  it('if this is a form with a specified identity provider, it should select it', async () => {
    formStore.form = ref({
      idps: ['idir'],
    });
    const wrapper = mount(FormAccessSettings, {
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

    await flushPromises();

    expect(wrapper.vm.idpType).toEqual('idir');
  });

  it('if the form is changed to public, disable submitter drafts and submission copying', async () => {
    formStore.form = ref({
      userType: 'login',
      idps: ['idir'],
      enableSubmitterDraft: true,
      enableCopyExistingSubmission: true,
    });
    const wrapper = mount(FormAccessSettings, {
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
    expect(formStore.form.enableCopyExistingSubmission).toBeTruthy();

    formStore.form.userType = IdentityMode.PUBLIC;

    await wrapper.vm.userTypeChanged();

    await flushPromises();

    expect(formStore.form.enableSubmitterDraft).toBeFalsy();
    expect(formStore.form.enableCopyExistingSubmission).toBeFalsy();
  });

  it('if the form is changed from team, disable reminders', async () => {
    formStore.form = ref({
      userType: 'team',
      idps: ['idir'],
      reminder_enabled: true,
    });
    const wrapper = mount(FormAccessSettings, {
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

    expect(formStore.form.reminder_enabled).toBeTruthy();

    formStore.form.userType = IdentityMode.PUBLIC;

    wrapper.vm.userTypeChanged();

    expect(formStore.form.reminder_enabled).toBeFalsy();
  });

  it('updateLoginType should set the idp and set the userType to login', async () => {
    formStore.form = ref({
      userType: 'login',
      idps: ['idir'],
    });
    const wrapper = mount(FormAccessSettings, {
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

    expect(formStore.form.idps).toEqual(['idir']);
    expect(formStore.form.userType).toEqual('login');

    wrapper.vm.idpType = 'bceid-basic';

    wrapper.vm.updateLoginType();

    await nextTick();

    expect(formStore.form.idps).toEqual(['bceid-basic']);
    expect(formStore.form.userType).toEqual('login');
  });
});
