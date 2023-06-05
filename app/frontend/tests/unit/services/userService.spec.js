import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import userService from '@/services/userService';
import { ApiRoutes } from '@/utils/constants';

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

const zeroUuid = '00000000-0000-0000-0000-000000000000';

jest.mock('@/services/interceptors', () => {
  return {
    appAxios: () => mockInstance,
  };
});

beforeEach(() => {
  mockAxios.reset();
});

describe('users', () => {
  const endpoint = `${ApiRoutes.USERS}/`;

  it('calls get on users/ endpoint', async () => {
    mockAxios.onGet(endpoint).reply(200);

    const result = await userService.getUsers();
    expect(result).toBeTruthy();
    expect(mockAxios.history.get).toHaveLength(1);
  });
});

describe('user preferences', () => {
  const endpoint = `${ApiRoutes.USERS}/preferences/forms/${zeroUuid}`;

  it('calls get on users/ endpoint', async () => {
    mockAxios.onGet(endpoint).reply(200);

    const result = await userService.getUserFormPreferences(zeroUuid);
    expect(result).toBeTruthy();
    expect(mockAxios.history.get).toHaveLength(1);
  });

  it('calls put on users/preferences/forms endpoint', async () => {
    mockAxios.onPut(endpoint).reply(200);

    const result = await userService.updateUserFormPreferences(zeroUuid, {});
    expect(result).toBeTruthy();
    expect(mockAxios.history.put).toHaveLength(1);
  });
});
