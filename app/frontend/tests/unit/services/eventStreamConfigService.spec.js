import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import service from '~/services/eventStreamConfigService';
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

describe('Event Stream Config Service', () => {
  it('calls get on GET form event stream config', async () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}${ApiRoutes.EVENT_STREAM_CONFIG}`;
    mockAxios.onGet(endpoint).reply(200);

    const result = await service.getEventStreamConfig(zeroUuid);
    expect(result).toBeTruthy();
    expect(mockAxios.history.get).toHaveLength(1);
  });
});
