import { cloneDeep } from 'lodash';
import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import adminStore from '@/store/modules/admin';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('admin getters', () => {
  let store;

  const sampleState = {
    apiKey: null,
    form: {},
    formList: [],
    user: {},
    userList: []
  };

  beforeEach(() => {
    store = new Vuex.Store(cloneDeep(adminStore));
    store.replaceState(cloneDeep(sampleState));
  });

  it('apiKey should return the state apiKey', () => {
    expect(store.getters.apiKey).toEqual(sampleState.apiKey);
  });

  it('form should return the state form', () => {
    expect(store.getters.form).toEqual(sampleState.form);
  });

  it('formList should return the state formList', () => {
    expect(store.getters.formList).toEqual(sampleState.formList);
  });

  it('user should return the state user', () => {
    expect(store.getters.user).toEqual(sampleState.user);
  });

  it('userList should return the state userList', () => {
    expect(store.getters.userList).toEqual(sampleState.userList);
  });
});
