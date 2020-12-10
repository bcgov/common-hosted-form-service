import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import userService from '@/services/userService';
import { ApiRoutes } from '@/utils/constants';

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

jest.mock('@/services/interceptors', () => {
  return {
    appAxios: () => mockInstance
  };
});

describe('User Service', () => {
  const endpoint = `${ApiRoutes.USERS}/`;

  beforeEach(() => {
    mockAxios.reset();
  });

  it('calls get on users/ endpoint', async () => {
    mockAxios.onGet(endpoint).reply(200);

    const result = await userService.getUsers();
    expect(result).toBeTruthy();
    expect(mockAxios.history.get).toHaveLength(1);
  });
});


