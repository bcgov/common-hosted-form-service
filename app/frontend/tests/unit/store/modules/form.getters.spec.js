import { cloneDeep } from 'lodash';
import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import formStore from '@/store/modules/form';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('form getters', () => {
  let store;

  const sampleState = {
    drafts: [],
    form: {
      name: 'ABC',
      reminder: {
        enabled: false,
        allowAdditionalNotifications: true,
      },
      schedule: {
        enabled: true,
        scheduleType: 'manual',
      },
    },
    formList: [
      {
        name: 'ABC',
      },
      {
        name: 'XYZ',
      },
    ],
    formSubmission: {
      confirmationId: '1234',
      submission: {
        data: { field: '123' },
      },
    },
    permissions: ['SUBMIT', 'READ'],
    submissionList: ['test', 'sub'],
    version: { type: 'form' },
  };

  beforeEach(() => {
    store = new Vuex.Store(cloneDeep(formStore));
    store.replaceState(cloneDeep(sampleState));
  });

  it('apiKey should return the state apiKey', () => {
    expect(store.getters.apiKey).toEqual(sampleState.apiKey);
  });

  it('drafts should return the state drafts', () => {
    expect(store.getters.drafts).toEqual(sampleState.drafts);
  });

  it('form should return the state form', () => {
    expect(store.getters.form).toEqual(sampleState.form);
  });

  it('formList should return the state formList', () => {
    expect(store.getters.formList).toEqual(sampleState.formList);
  });

  it('formFields should return the state formFields', () => {
    expect(store.getters.formFields).toEqual(sampleState.formFields);
  });

  it('formSubmission should return the state formSubmission', () => {
    expect(store.getters.formSubmission).toEqual(sampleState.formSubmission);
  });

  it('permissions should return the state permissions', () => {
    expect(store.getters.permissions).toEqual(sampleState.permissions);
  });

  it('submissionList should return the state submissionList', () => {
    expect(store.getters.submissionList).toEqual(sampleState.submissionList);
  });

  it('submissionList should return the state submissionList', () => {
    expect(store.getters.submissionList).toEqual(sampleState.submissionList);
  });

  it('userFormPreferences should return the state userFormPreferences', () => {
    expect(store.getters.userFormPreferences).toEqual(sampleState.userFormPreferences);
  });

  it('version should return the state version', () => {
    expect(store.getters.version).toEqual(sampleState.version);
  });

  it('fcNamesProactiveHelpList should return the state fcNamesProactiveHelpList', () => {
    expect(store.getters.fcNamesProactiveHelpList).toEqual(sampleState.fcNamesProactiveHelpList);
  });

  it('fcProactiveHelpImageUrl should return the state fcProactiveHelpImageUrl', () => {
    expect(store.getters.fcProactiveHelpImageUrl).toEqual(sampleState.fcProactiveHelpImageUrl);
  });
});
