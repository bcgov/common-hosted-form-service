import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import adminService from '@/services/adminService';
import { ApiRoutes } from '@/utils/constants';

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

const zeroUuid = '00000000-0000-0000-0000-000000000000';

jest.mock('@/services/interceptors', () => {
  return {
    appAxios: () => mockInstance,
  };
});

describe('Admin Service', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  //
  // Forms
  //
  describe('admin/forms/{formId}/addUser', () => {
    const endpoint = `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${zeroUuid}/addUser`;

    it('calls update on endpoint', async () => {
      mockAxios.onPut(endpoint).reply(200);

      const result = await adminService.addFormUser('usrid', zeroUuid, ['OWNER']);
      expect(result).toBeTruthy();
      expect(mockAxios.history.put).toHaveLength(1);
    });
  });

  describe('admin/forms/{formId}/apiKey', () => {
    const endpoint = `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${zeroUuid}${ApiRoutes.APIKEY}`;

    it('calls get on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await adminService.readApiDetails(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls delete on endpoint', async () => {
      mockAxios.onDelete(endpoint).reply(200);

      const result = await adminService.deleteApiKey(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.delete).toHaveLength(1);
    });
  });

  describe('admin/forms', () => {
    const endpoint = `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}`;

    it('calls get endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await adminService.listForms();
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('admin/forms/{formId}', () => {
    const endpoint = `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${zeroUuid}`;

    it('calls get on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await adminService.readForm(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('admin/forms/{formId}/restore', () => {
    const endpoint = `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${zeroUuid}/restore`;

    it('calls update on endpoint', async () => {
      mockAxios.onPut(endpoint).reply(200);

      const result = await adminService.restoreForm(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.put).toHaveLength(1);
    });
  });

  describe('admin/forms/{formId}/formUsers', () => {
    const endpoint = `${ApiRoutes.ADMIN}${ApiRoutes.FORMS}/${zeroUuid}/formUsers`;

    it('calls get on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await adminService.readRoles(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  //
  // User
  //
  describe('admin/users', () => {
    const endpoint = `${ApiRoutes.ADMIN}${ApiRoutes.USERS}`;

    it('calls get endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await adminService.listUsers();
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('admin/users/{userId}', () => {
    const endpoint = `${ApiRoutes.ADMIN}${ApiRoutes.USERS}/${zeroUuid}`;

    it('calls get endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await adminService.readUser(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });
});
