import store from '@/store/modules/notifications';
import { NotificationTypes } from '@/utils/constants';

describe('notifications actions', () => {
  const mockStore = {
    commit: jest.fn(),
  };
  const mockConsoleError = jest.spyOn(console, 'error');

  beforeEach(() => {
    mockStore.commit.mockReset();
    mockConsoleError.mockReset();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('addNotification should commit to PUSH', () => {
    const obj = {
      message: 'foo',
      consoleError: 'bar',
    };
    store.actions.addNotification(mockStore, obj);
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockStore.commit).toHaveBeenCalledTimes(1);
    expect(mockStore.commit).toHaveBeenCalledWith('PUSH', {
      type: 'error',
      class: 'alert-error',
      icon: 'error',
      ...obj,
    });
  });

  it('addNotification as warning should commit to PUSH', () => {
    const obj = {
      message: 'foo',
      consoleError: 'bar',
      ...NotificationTypes.WARNING,
    };
    store.actions.addNotification(mockStore, obj);
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockStore.commit).toHaveBeenCalledTimes(1);
    expect(mockStore.commit).toHaveBeenCalledWith('PUSH', {
      type: 'warning',
      class: 'warning-error',
      icon: 'warning',
      ...obj,
    });
  });

  it('addNotification without consoleError should commit to PUSH', () => {
    const obj = {
      message: 'foo',
    };
    store.actions.addNotification(mockStore, obj);
    expect(mockStore.commit).toHaveBeenCalledTimes(1);
    expect(mockStore.commit).toHaveBeenCalledWith('PUSH', {
      type: 'error',
      class: 'alert-error',
      icon: 'error',
      ...obj,
    });
  });

  it('deleteNotification should commit to DELETE', () => {
    const obj = {
      id: 1,
    };
    store.actions.deleteNotification(mockStore, obj);
    expect(mockStore.commit).toHaveBeenCalledTimes(1);
    expect(mockStore.commit).toHaveBeenCalledWith('DELETE', obj);
  });
});
