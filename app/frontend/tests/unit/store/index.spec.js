import store from '@/store/index';

describe('vuex store', () => {
  it('exists', () => {
    expect(store.getters).toBeTruthy();
  });

  it('loads form module immediately', () => {
    expect(store.hasModule('form')).toBeTruthy();
  });

  it('loads notifications module immediately', () => {
    expect(store.hasModule('notifications')).toBeTruthy();
  });
});
