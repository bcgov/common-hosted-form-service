import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import cdogsRouterService from '~/services/cdogsRouterService';
import { ApiRoutes } from '~/utils/constants';

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

const formId = '00000000-0000-0000-0000-000000000000';
const submissionId = '11111111-1111-1111-1111-111111111111';

vi.mock('~/services/interceptors', () => {
  return {
    appAxios: () => mockInstance,
  };
});

describe('CDOGS Router Service', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  describe('determineCdogsVersion', () => {
    it('returns v1 when config endpoint returns 404 (not found)', async () => {
      const endpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      mockAxios.onGet(endpoint).reply(404);

      const result = await cdogsRouterService.determineCdogsVersion(formId);
      expect(result).toBe('v1');
    });

    it('returns v2 when config is enabled', async () => {
      const endpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      mockAxios.onGet(endpoint).reply(200, { enabled: true });

      const result = await cdogsRouterService.determineCdogsVersion(formId);
      expect(result).toBe('v2');
    });

    it('throws error when config exists but is not enabled', async () => {
      const endpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      mockAxios.onGet(endpoint).reply(200, { enabled: false });

      try {
        await cdogsRouterService.determineCdogsVersion(formId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('CDOGS v3 is not enabled');
      }
    });

    it('throws error when 403 Forbidden response', async () => {
      const endpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      mockAxios.onGet(endpoint).reply(403);

      try {
        await cdogsRouterService.determineCdogsVersion(formId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });

    it('returns v1 for other errors to maintain backward compatibility', async () => {
      const endpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      mockAxios.onGet(endpoint).reply(500);

      const result = await cdogsRouterService.determineCdogsVersion(formId);
      expect(result).toBe('v1');
    });
  });

  describe('docGen', () => {
    const mockBody = {
      options: {
        reportName: 'test_report',
        convertTo: 'pdf',
        overwrite: true,
      },
      template: {
        content: 'SGVsbG8gV29ybGQh',
        encodingType: 'base64',
        fileType: 'docx',
      },
    };

    it('routes to v1 when config does not exist (404)', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      const submitEndpoint = `${ApiRoutes.SUBMISSION}/${submissionId}/template/render`;

      mockAxios.onGet(configEndpoint).reply(404);
      mockAxios.onPost(submitEndpoint).reply(200, { data: 'rendered' });

      const result = await cdogsRouterService.docGen(
        formId,
        submissionId,
        mockBody
      );
      expect(result).toBeTruthy();
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.post[0].url).toBe(submitEndpoint);
    });

    it('routes to v2 when config is enabled', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      const submitEndpoint = `${ApiRoutes.SUBMISSION}/${submissionId}/template/render`;

      mockAxios.onGet(configEndpoint).reply(200, { enabled: true });
      mockAxios.onPost(submitEndpoint).reply(200, { data: 'rendered' });

      const result = await cdogsRouterService.docGen(
        formId,
        submissionId,
        mockBody
      );
      expect(result).toBeTruthy();
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.post[0].url).toBe(submitEndpoint);
    });

    it('throws error when config exists but is disabled', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;

      mockAxios.onGet(configEndpoint).reply(200, { enabled: false });

      try {
        await cdogsRouterService.docGen(formId, submissionId, mockBody);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('CDOGS v3 is not enabled');
      }
    });
  });

  describe('draftDocGen', () => {
    const mockBody = {
      formId: formId,
      template: {
        content: 'SGVsbG8gV29ybGQh',
        encodingType: 'base64',
        fileType: 'docx',
      },
      submission: { test: 'data' },
    };

    it('routes to v1 when config does not exist (404)', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      const draftEndpoint = `${ApiRoutes.UTILS}/template/render`;

      mockAxios.onGet(configEndpoint).reply(404);
      mockAxios.onPost(draftEndpoint).reply(200, { data: 'rendered' });

      const result = await cdogsRouterService.draftDocGen(formId, mockBody);
      expect(result).toBeTruthy();
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.post[0].url).toBe(draftEndpoint);
    });

    it('routes to v2 when config is enabled', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      const draftEndpoint = `${ApiRoutes.UTILS}/template/render`;

      mockAxios.onGet(configEndpoint).reply(200, { enabled: true });
      mockAxios.onPost(draftEndpoint).reply(200, { data: 'rendered' });

      const result = await cdogsRouterService.draftDocGen(formId, mockBody);
      expect(result).toBeTruthy();
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.post[0].url).toBe(draftEndpoint);
    });

    it('throws error when config exists but is disabled', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;

      mockAxios.onGet(configEndpoint).reply(200, { enabled: false });

      try {
        await cdogsRouterService.draftDocGen(formId, mockBody);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('CDOGS v3 is not enabled');
      }
    });

    it('includes formId in request body for v2 routes', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      const draftEndpoint = `${ApiRoutes.UTILS}/template/render`;

      mockAxios.onGet(configEndpoint).reply(200, { enabled: true });
      mockAxios.onPost(draftEndpoint).reply(200, { data: 'rendered' });

      await cdogsRouterService.draftDocGen(formId, mockBody);

      const postRequest = mockAxios.history.post[0];
      const requestBody = JSON.parse(postRequest.data);
      expect(requestBody.formId).toBe(formId);
    });
  });
});
