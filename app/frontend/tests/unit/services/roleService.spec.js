import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import roleService from '@/services/roleService';
import { ApiRoutes } from '@/utils/constants';

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

jest.mock('@/services/interceptors', () => {
  return {
    appAxios: () => mockInstance,
  };
});

describe('Role Service', () => {
  const endpoint = `${ApiRoutes.ROLES}`;

  beforeEach(() => {
    mockAxios.reset();
  });

  it('calls get on roles/ endpoint', async () => {
    mockAxios.onGet(endpoint).reply(200);

    const result = await roleService.list();
    expect(result).toBeTruthy();
    expect(mockAxios.history.get).toHaveLength(1);
  });
});
