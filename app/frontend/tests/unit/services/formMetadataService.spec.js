import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import service from '~/services/formMetadataService';
import { ApiRoutes } from '~/utils/constants';

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

const zeroUuid = '00000000-0000-0000-0000-000000000000';

vi.mock('~/services/interceptors', () => {
  return {
    appAxios: () => mockInstance,
  };
});

describe('Form Metadata Service', () => {
  const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}${ApiRoutes.FORM_METADATA}`;

  beforeEach(() => {
    mockAxios.reset();
  });

  //
  // formMetadata
  //
  describe('forms/{formId}/formMetadata', () => {
    it('calls create on endpoint', async () => {
      mockAxios.onPost(endpoint).reply(201);

      const result = await service.createFormMetadata(zeroUuid, {});
      expect(result).toBeTruthy();
      expect(mockAxios.history.post).toHaveLength(1);
    });

    it('calls get on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await service.getFormMetadata(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls update on endpoint', async () => {
      mockAxios.onPut(endpoint).reply(200);

      const result = await service.updateFormMetadata(zeroUuid, {});
      expect(result).toBeTruthy();
      expect(mockAxios.history.put).toHaveLength(1);
    });

    it('calls delete on endpoint', async () => {
      mockAxios.onDelete(endpoint).reply(204);

      const result = await service.deleteFormMetadata(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.delete).toHaveLength(1);
    });
  });
});
