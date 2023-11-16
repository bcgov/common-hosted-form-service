import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import apiKeyService from '@/services/apiKeyService';
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

describe('API Key Service', () => {
  const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}${ApiRoutes.APIKEY}`;

  it('calls get on GET apiKey endpoint', async () => {
    mockAxios.onGet(endpoint).reply(200);

    const result = await apiKeyService.readApiKey(zeroUuid);
    expect(result).toBeTruthy();
    expect(mockAxios.history.get).toHaveLength(1);
  });

  it('calls get on PUT apiKey endpoint', async () => {
    mockAxios.onPut(endpoint).reply(200);

    const result = await apiKeyService.generateApiKey(zeroUuid);
    expect(result).toBeTruthy();
    expect(mockAxios.history.put).toHaveLength(1);
  });

  it('calls get on PUT apiKey endpoint', async () => {
    mockAxios.onDelete(endpoint).reply(204);

    const result = await apiKeyService.deleteApiKey(zeroUuid);
    expect(result).toBeTruthy();
    expect(mockAxios.history.delete).toHaveLength(1);
  });
});
