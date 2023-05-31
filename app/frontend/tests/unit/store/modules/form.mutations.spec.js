import { cloneDeep } from 'lodash';

import store from '@/store/modules/form';

describe('form mutations', () => {
  let state;

  beforeEach(() => {
    state = cloneDeep(store.state);
  });

  it('ADD_FORM_TO_LIST should add to formList state', () => {
    const obj = { foo: 'bar' };
    store.mutations.ADD_FORM_TO_LIST(state, obj);

    expect(state.formList).toBeTruthy();
    expect(state.formList).toHaveLength(1);
    expect(state.formList).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('ADD_SUBMISSION_TO_LIST should add to submissionList state', () => {
    const obj = { foo: 'bar' };
    store.mutations.ADD_SUBMISSION_TO_LIST(state, obj);

    expect(state.submissionList).toBeTruthy();
    expect(state.submissionList).toHaveLength(1);
    expect(state.submissionList).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('SET_API_KEY should update apiKey state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_API_KEY(state, [obj]);

    expect(state.apiKey).toBeTruthy();
    expect(state.apiKey).toHaveLength(1);
    expect(state.apiKey).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('SET_DRAFTS should update drafts state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_DRAFTS(state, [obj]);

    expect(state.drafts).toBeTruthy();
    expect(state.drafts).toHaveLength(1);
    expect(state.drafts).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('SET_FORM should update form state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_FORM(state, obj);

    expect(state.form).toBeTruthy();
    expect(state.form).toEqual(expect.objectContaining(obj));
  });

  it('SET_FORM_PERMISSIONS should update permissions state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_FORM_PERMISSIONS(state, [obj]);

    expect(state.permissions).toBeTruthy();
    expect(state.permissions).toHaveLength(1);
    expect(state.permissions).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('SET_FORMLIST should update formList state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_FORMLIST(state, [obj]);

    expect(state.formList).toBeTruthy();
    expect(state.formList).toHaveLength(1);
    expect(state.formList).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('SET_FORM_FIELDS should update formFields state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_FORM_FIELDS(state, [obj]);

    expect(state.formFields).toBeTruthy();
    expect(state.formFields).toHaveLength(1);
    expect(state.formFields).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('SET_FORMSUBMISSION should update formSubmission state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_FORMSUBMISSION(state, obj);

    expect(state.formSubmission).toBeTruthy();
    expect(state.formSubmission).toEqual(expect.objectContaining(obj));
  });

  it('SET_SUBMISSIONLIST should update submissionList state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_SUBMISSIONLIST(state, [obj]);

    expect(state.submissionList).toBeTruthy();
    expect(state.submissionList).toHaveLength(1);
    expect(state.submissionList).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('SET_USER_FORM_PREFERENCES should update userFormPreferences state', () => {
    const obj = { foo: 'bar' };
    store.mutations.SET_USER_FORM_PREFERENCES(state, [obj]);

    expect(state.userFormPreferences).toBeTruthy();
    expect(state.userFormPreferences).toHaveLength(1);
    expect(state.userFormPreferences).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('SET_VERSION should update form state', () => {
    const obj = 1;
    store.mutations.SET_VERSION(state, obj);

    expect(state.version).toBeTruthy();
    expect(state.version).toEqual(obj);
  });

  it('SET_FCPROACTIVEHELPGROUPLIST get form state', () => {
    const obj = {};
    store.mutations.SET_FCPROACTIVEHELPGROUPLIST(state, obj);

    expect(state.fcProactiveHelpGroupList).toBeTruthy();
    expect(state.fcProactiveHelpGroupList).toEqual(obj);
  });

  it('SET_FCPROACTIVEHELPIMAGEURL get form state', () => {
    const obj = '';
    store.mutations.SET_FCPROACTIVEHELPIMAGEURL(state, obj);

    expect(state.fcProactiveHelpImageUrl).toEqual('');
    expect(state.fcProactiveHelpImageUrl).toEqual(obj);
  });
});
