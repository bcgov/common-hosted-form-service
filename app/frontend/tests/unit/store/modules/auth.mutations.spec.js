import { cloneDeep } from 'lodash';

import store from '@/store/modules/auth';

describe('auth mutations', () => {
  let state;

  beforeEach(() => {
    state = cloneDeep(store.state);
  });

  it('SET_REDIRECTURI should update redirecturi', () => {
    const uri = 'http://foo.bar';
    store.mutations.SET_REDIRECTURI(state, uri);

    expect(state.redirectUri).toBeTruthy();
    expect(state.redirectUri).toEqual(uri);
  });

  it('SET_SHOW_TOKEN_EXPIRED_WARNING_MSG should update showTokenExpiredWarningMSg', () => {
    const showTokenExpiredWarningMSg = true;
    store.mutations.SET_SHOW_TOKEN_EXPIRED_WARNING_MSG(state, showTokenExpiredWarningMSg);

    expect(state.showTokenExpiredWarningMSg).toBeTruthy();
    expect(state.showTokenExpiredWarningMSg).toEqual(showTokenExpiredWarningMSg);
  });
});

