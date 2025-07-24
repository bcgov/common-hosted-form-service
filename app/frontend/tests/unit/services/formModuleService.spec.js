import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formModuleService } from '~/services';
import { ApiRoutes } from '~/utils/constants';

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

const zeroUuid = '00000000-0000-0000-0000-000000000000';
const oneUuid = '11111111-1111-1111-1111-111111111111';

vi.mock('~/services/interceptors', () => {
  return {
    appAxios: () => mockInstance,
  };
});

describe('Form Module Service', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  describe('form_modules/', () => {
    const endpoint = `${ApiRoutes.FORMMODULES}`;

    it('calls get endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formModuleService.listFormModules();
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('form_modules', () => {
    const endpoint = `${ApiRoutes.FORMMODULES}`;

    it('calls create on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPost(endpoint).reply(200, data);

      const result = await formModuleService.createFormModule(zeroUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('form_modules/{formModuleId}', () => {
    const endpoint = `${ApiRoutes.FORMMODULES}/${zeroUuid}`;

    it('calls read on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formModuleService.readFormModule(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls update on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPut(endpoint).reply(200, data);

      const result = await formModuleService.updateFormModule(zeroUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.put).toHaveLength(1);
    });
  });

  describe('form_modules/{formModuleId}/version', () => {
    const endpoint = `${ApiRoutes.FORMMODULES}/${zeroUuid}/version`;

    it('calls create on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPost(endpoint).reply(200, data);

      const result = await formModuleService.createFormModuleVersion(
        zeroUuid,
        data
      );
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('form_modules/{formModuleId}/version/{formModuleVersionId}', () => {
    const endpoint = `${ApiRoutes.FORMMODULES}/${zeroUuid}/version/${oneUuid}`;

    it('calls read on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formModuleService.readFormModuleVersion(
        zeroUuid,
        oneUuid
      );
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls update on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPut(endpoint).reply(200, data);

      const result = await formModuleService.updateFormModuleVersion(
        zeroUuid,
        oneUuid,
        data
      );
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.put).toHaveLength(1);
    });
  });

  describe('form_modules/{formModuleId}/idp', () => {
    const endpoint = `${ApiRoutes.FORMMODULES}/${zeroUuid}/idp`;

    it('calls get endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formModuleService.listFormModuleIdentityProviders(
        zeroUuid
      );
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });
});
