import { cloneDeep } from 'lodash';

import store from '@/store/modules/notifications';

describe('notifications mutations', () => {
  let state;

  beforeEach(() => {
    state = cloneDeep(store.state);
  });

  it('PUSH should add notification to notifications state', () => {
    const obj = { foo: 'bar' };
    store.mutations.PUSH(state, obj);

    expect(state.notifications).toBeTruthy();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));
  });

  it('DELETE should remove correct notification object', () => {
    const obj = { foo: 'bar', id: 1 };
    state.notifications = [obj];
    store.mutations.DELETE(state, obj);

    expect(state.notifications).toBeTruthy();
    expect(state.notifications).toHaveLength(0);
  });

  it('DELETE should remove nothing', () => {
    const obj = { foo: 'bar', id: 1 };
    state.notifications = [{ id: 999 }];
    store.mutations.DELETE(state, obj);

    expect(state.notifications).toBeTruthy();
    expect(state.notifications).toHaveLength(1);
  });
});
