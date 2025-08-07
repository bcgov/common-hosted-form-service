import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';

import { useFormStore } from '~/store/form';
import FormAccessSettings from '~/components/designer/settings/FormAccessSettings.vue';
import { IdentityMode } from '~/utils/constants';
import { useAppStore } from '~/store/app';
import { useIdpStore } from '~/store/identityProviders';

describe('FormAccessSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);
  const idpStore = useIdpStore(pinia);
  idpStore.providers = require('../../../fixtures/identityProviders.json');

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
  });

  it('renders and displays 3 login types', () => {
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

    // Find the v-autocomplete by data-test attribute
    const components = wrapper.findAllComponents({ name: 'VAutocomplete' });
    const autocomplete = components.find(
      (c) => c.attributes('data-test') === 'userType'
    );
    expect(autocomplete.exists()).toBe(true);

    const items = autocomplete.props('items');
    expect(items).toEqual(wrapper.vm.IdpTypeList);
    expect(items).toHaveLength(3);
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

    expect(wrapper.vm.idpType).toEqual(['idir']);
  });

  it('if the form is changed to public, disable some settings', async () => {
    formStore.form = ref({
      userType: 'login',
      idps: ['idir'],
      enableSubmitterDraft: true,
      enableCopyExistingSubmission: true,
      allowSubmitterToUploadFile: true,
      enableSubmitterRevision: true,
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
    expect(formStore.form.allowSubmitterToUploadFile).toBeTruthy();
    expect(formStore.form.enableSubmitterRevision).toBeTruthy();

    formStore.form.userType = IdentityMode.PUBLIC;

    await wrapper.vm.userTypeChanged();

    await flushPromises();

    expect(formStore.form.enableSubmitterDraft).toBeFalsy();
    expect(formStore.form.enableCopyExistingSubmission).toBeFalsy();
    expect(formStore.form.allowSubmitterToUploadFile).toBeFalsy();
    expect(formStore.form.enableSubmitterRevision).toBeFalsy();
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

  it('userTypeChanged should set the idp and set the userType to login', async () => {
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

    wrapper.vm.idpType = ['bceid-basic'];

    wrapper.vm.userTypeChanged();

    await nextTick();

    expect(formStore.form.idps).toEqual(['bceid-basic']);
    expect(formStore.form.userType).toEqual('login');
  });

  it('multiple idps can be set', async () => {
    formStore.form = ref({
      userType: 'login',
      idps: [],
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
    expect(formStore.form.idps).toEqual([]);
    expect(formStore.form.userType).toEqual('login');

    wrapper.vm.idpType = ['idir', 'bceid-basic'];
    await nextTick();
    expect(formStore.form.idps).toContain('bceid-basic');
    expect(formStore.form.idps.length).toBe(2);
  });
});
