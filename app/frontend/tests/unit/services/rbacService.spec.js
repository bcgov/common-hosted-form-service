import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import rbacService from '~/services/rbacService';
import { ApiRoutes } from '~/utils/constants';

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

vi.mock('~/services/interceptors', () => {
  return {
    appAxios: () => mockInstance,
  };
});

describe('RBAC Service', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  describe('rbac/current', () => {
    const endpoint = `${ApiRoutes.RBAC}/current`;

    it('calls rbac/current endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await rbacService.getCurrentUser();
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('rbac/current/forms', () => {
    const endpoint = `${ApiRoutes.RBAC}/current/forms`;

    it('calls rbac/current endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await rbacService.getCurrentUserForms({ idp: 'idir' });
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
      expect(Object.keys(mockAxios.history.get[0].params)).toEqual(['idp']);
    });
  });

  describe('rbac/current/submissions', () => {
    const endpoint = `${ApiRoutes.RBAC}/current/submissions`;

    it('calls rbac/current endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await rbacService.getUserSubmissions({ formId: '123' });
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
      expect(Object.keys(mockAxios.history.get[0].params)).toEqual(['formId']);
    });
  });

  describe('rbac/forms', () => {
    const endpoint = `${ApiRoutes.RBAC}/forms`;

    it('calls get on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await rbacService.getFormUsers({ idp: 'idir' });
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
      expect(Object.keys(mockAxios.history.get[0].params)).toEqual(['idp']);
    });

    it('calls put on endpoint', async () => {
      const data = { test: 'data' };
      mockAxios.onPut(endpoint).reply(200, data);

      const result = await rbacService.setFormUsers(data, { idp: 'idir' });
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.put).toHaveLength(1);
      expect(Object.keys(mockAxios.history.put[0].params)).toEqual(['idp']);
    });
  });

  describe('rbac/users', () => {
    const endpoint = `${ApiRoutes.RBAC}/users`;

    it('calls get on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await rbacService.getUserForms({ idp: 'idir' });
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
      expect(Object.keys(mockAxios.history.get[0].params)).toEqual(['idp']);
    });

    it('calls put on endpoint', async () => {
      const data = { test: 'data' };
      mockAxios.onPut(endpoint).reply(200, data);

      const result = await rbacService.setUserForms(data, { idp: 'idir' });
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.put).toHaveLength(1);
      expect(Object.keys(mockAxios.history.put[0].params)).toEqual(['idp']);
    });
  });
});
