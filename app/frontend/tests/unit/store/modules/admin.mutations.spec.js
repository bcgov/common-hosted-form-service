import { cloneDeep } from 'lodash';

import store from '@/store/modules/admin';

describe('admin mutations', () => {
  let state;

  beforeEach(() => {
    state = cloneDeep(store.state);
  });

  it('SET_API_KEY should update apiKey state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_API_KEY(state, obj);

    expect(state.apiKey).toBeTruthy();
    expect(state.apiKey).toEqual(expect.objectContaining(obj));
  });

  it('SET_FORM should update form state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_FORM(state, obj);

    expect(state.form).toBeTruthy();
    expect(state.form).toEqual(expect.objectContaining(obj));
  });

  it('SET_FORMLIST should update formList state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_FORMLIST(state, [obj]);

    expect(state.formList).toBeTruthy();
    expect(state.formList).toHaveLength(1);
    expect(state.formList).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('SET_USER should update form state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_USER(state, obj);

    expect(state.user).toBeTruthy();
    expect(state.user).toEqual(expect.objectContaining(obj));
  });

  it('SET_USERLIST should update formList state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_USERLIST(state, [obj]);

    expect(state.userList).toBeTruthy();
    expect(state.userList).toHaveLength(1);
    expect(state.userList).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('SET_FCPROACTIVEHELP should update fcProactiveHelp state', () => {
    const obj = {};
    store.mutations.SET_FCPROACTIVEHELP(state, obj);

    expect(state.fcProactiveHelp).toBeTruthy();
    expect(state.fcProactiveHelp).toEqual(expect.objectContaining(obj));
  });

  it('SET_FCPROACTIVEHELPGROUPLIST should update fcProactiveHelp state', () => {
    const obj = [];
    store.mutations.SET_FCPROACTIVEHELPGROUPLIST(state, obj);

    expect(state.fcProactiveHelpGroupList).toBeTruthy();
    expect(state.fcProactiveHelpGroupList).toEqual(expect.objectContaining(obj));
  });
});
