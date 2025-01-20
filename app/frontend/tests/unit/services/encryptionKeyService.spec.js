import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import service from '~/services/encryptionKeyService';
import { ApiRoutes } from '~/utils/constants';

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

const zeroUuid = '00000000-0000-0000-0000-000000000000';

vi.mock('~/services/interceptors', () => {
  return {
    appAxios: () => mockInstance,
  };
});

beforeEach(() => {
  mockAxios.reset();
});

describe('Encryption Key Service', () => {
  it('calls get on GET list algorithms endpoint', async () => {
    const endpoint = `${ApiRoutes.FORMS}/${ApiRoutes.ENCRYPTION_KEY}/algorithms`;
    mockAxios.onGet(endpoint).reply(200);

    const result = await service.listEncryptionAlgorithms();
    expect(result).toBeTruthy();
    expect(mockAxios.history.get).toHaveLength(1);
  });

  it('calls get on GET form encryption key endpoint', async () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}${ApiRoutes.ENCRYPTION_KEY}/${zeroUuid}`;
    mockAxios.onGet(endpoint).reply(200);

    const result = await service.getEncryptionKey(zeroUuid, zeroUuid);
    expect(result).toBeTruthy();
    expect(mockAxios.history.get).toHaveLength(1);
  });
});
