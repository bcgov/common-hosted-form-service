import { cloneDeep } from 'lodash';
import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import formStore from '@/store/modules/form';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('form getters', () => {
  let store;

  const sampleState = {
    form: {
      name: 'ABC'
    },
    formList: [
      {
        name: 'ABC'
      }, {
        name: 'XYZ'
      }
    ],
    formSubmission: {
      confirmationId: '1234',
      submission: {
        data: { field: '123' }
      }
    },
    permissions: ['SUBMIT', 'READ'],
    submissionList: ['test', 'sub'],
    version: { type: 'form' }
  };

  beforeEach(() => {
    store = new Vuex.Store(cloneDeep(formStore));
    store.replaceState(cloneDeep(sampleState));
  });

  it('form should return the state form', () => {
    expect(store.getters.form).toEqual(sampleState.form);
  });

  it('formlist should return the state formlist', () => {
    expect(store.getters.formlist).toEqual(sampleState.formlist);
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

  it('version should return the state version', () => {
    expect(store.getters.version).toEqual(sampleState.version);
  });
});
