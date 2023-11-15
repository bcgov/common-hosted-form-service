import { cloneDeep } from 'lodash';
import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import adminStore from '@/store/modules/admin';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('admin getters', () => {
  let store;

  const sampleState = {
    apiKey: undefined,
    form: {},
    formList: [],
    user: {},
    userList: [],
    fcProactiveHelp: [],
    fcProactiveHelpGroupList: [],
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

  it('fcProactiveHelp should return the state fcProactiveHelp', () => {
    expect(store.getters.fcProactiveHelp).toEqual(sampleState.fcProactiveHelp);
  });

  it('fcProactiveHelpGroupList should return the state fcProactiveHelpGroupList', () => {
    expect(store.getters.fcProactiveHelpGroupList).toEqual(sampleState.fcProactiveHelpGroupList);
  });
});
