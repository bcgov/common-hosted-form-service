import { setActivePinia, createPinia } from 'pinia';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';

describe('notifications actions', () => {
  const mockConsoleError = vi.spyOn(console, 'error');

  beforeEach(() => {
    setActivePinia(createPinia());
    mockConsoleError.mockReset();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('addNotification should add notification', () => {
    const mockStore = useNotificationStore();
    const obj = {
      message: 'foo',
      consoleError: 'bar',
    };
    const addNotificationSpy = vi.spyOn(mockStore, 'addNotification');
    mockStore.addNotification(obj);
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(mockStore.notifications).toEqual([
      {
        color: 'error',
        type: 'error',
        icon: '$error',
        ...obj,
        id: 1,
      },
    ]);
  });

  it('addNotification as warning should add notification', () => {
    const mockStore = useNotificationStore();
    const obj = {
      message: 'foo',
      consoleError: 'bar',
      ...NotificationTypes.WARNING,
    };

    const addNotificationSpy = vi.spyOn(mockStore, 'addNotification');
    mockStore.addNotification(obj);
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(mockStore.notifications).toEqual([
      {
        color: 'warning',
        type: 'warning',
        icon: '$warning',
        ...obj,
        id: 1,
      },
    ]);
  });

  it('addNotification without consoleError should add notification', () => {
    const mockStore = useNotificationStore();
    const obj = {
      message: 'foo',
    };
    const addNotificationSpy = vi.spyOn(mockStore, 'addNotification');
    mockStore.addNotification(obj);
    expect(mockConsoleError).toHaveBeenCalledTimes(0);
    expect(addNotificationSpy).toHaveBeenCalledTimes(1);
    expect(mockStore.notifications).toEqual([
      {
        color: 'error',
        type: 'error',
        icon: '$error',
        ...obj,
        id: 1,
      },
    ]);
  });

  it('deleteNotification should commit to DELETE', () => {
    const mockStore = useNotificationStore();
    const obj = {
      id: 1,
    };
    mockStore.notifications = [
      {
        color: 'error',
        type: 'error',
        icon: '$error',
        ...obj,
        id: 1,
      },
    ];
    expect(mockStore.notifications).toEqual([
      {
        color: 'error',
        type: 'error',
        icon: '$error',
        ...obj,
        id: 1,
      },
    ]);
    mockStore.deleteNotification(obj);
    expect(mockStore.notifications).toEqual([]);
  });
});
