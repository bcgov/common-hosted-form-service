import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { ApiRoutes } from '~/utils/constants';

const formId = '00000000-0000-0000-0000-000000000000';
const submissionId = '11111111-1111-1111-1111-111111111111';

let cdogsRouterService;
let mockGet;
let mockPost;

beforeEach(async () => {
  vi.resetModules();

  mockGet = vi.fn();
  mockPost = vi.fn();

  vi.doMock('~/services/interceptors', () => ({
    appAxios: () => ({
      get: mockGet,
      post: mockPost,
    }),
  }));

  cdogsRouterService = (await import('~/services/cdogsRouterService')).default;
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unmock('~/services/interceptors');
});

describe('CDOGS Router Service', () => {
  describe('determineCdogsVersion', () => {
    it('returns v1 when config endpoint returns 404 (not found)', async () => {
      const endpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      mockGet.mockRejectedValueOnce({
        response: { status: 404 },
      });

      const result = await cdogsRouterService.determineCdogsVersion(formId);
      expect(result).toBe('v1');
      expect(mockGet).toHaveBeenCalledWith(endpoint);
    });

    it('returns v2 when config is enabled', async () => {
      const endpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      mockGet.mockResolvedValueOnce({
        data: { enabled: true },
      });

      const result = await cdogsRouterService.determineCdogsVersion(formId);
      expect(result).toBe('v2');
      expect(mockGet).toHaveBeenCalledWith(endpoint);
    });

    it('returns v1 when config exists but is not enabled', async () => {
      const endpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      mockGet.mockResolvedValueOnce({
        data: { enabled: false },
      });

      const result = await cdogsRouterService.determineCdogsVersion(formId);
      expect(result).toBe('v1');
      expect(mockGet).toHaveBeenCalledWith(endpoint);
    });

    it('returns v1 when 403 Forbidden response (backward compatibility)', async () => {
      const endpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      mockGet.mockRejectedValueOnce({
        response: { status: 403 },
      });

      const result = await cdogsRouterService.determineCdogsVersion(formId);
      expect(result).toBe('v1');
      expect(mockGet).toHaveBeenCalledWith(endpoint);
    });

    it('returns v1 for other errors to maintain backward compatibility', async () => {
      const endpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      mockGet.mockRejectedValueOnce({
        response: { status: 500 },
      });

      const result = await cdogsRouterService.determineCdogsVersion(formId);
      expect(result).toBe('v1');
      expect(mockGet).toHaveBeenCalledWith(endpoint);
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

      mockGet.mockRejectedValueOnce({ response: { status: 404 } });
      mockPost.mockResolvedValueOnce({ data: { rendered: true } });

      const result = await cdogsRouterService.docGen(
        formId,
        submissionId,
        mockBody
      );
      expect(result).toEqual({ data: { rendered: true } });
      expect(mockGet).toHaveBeenCalledWith(configEndpoint);
      expect(mockPost).toHaveBeenCalledWith(submitEndpoint, mockBody, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
    });

    it('routes to v2 when config is enabled', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      const submitEndpoint = `${ApiRoutes.SUBMISSION}/${submissionId}/template/render`;

      mockGet.mockResolvedValueOnce({ data: { enabled: true } });
      mockPost.mockResolvedValueOnce({ data: { rendered: true } });

      const result = await cdogsRouterService.docGen(
        formId,
        submissionId,
        mockBody
      );
      expect(result).toEqual({ data: { rendered: true } });
      expect(mockGet).toHaveBeenCalledWith(configEndpoint);
      expect(mockPost).toHaveBeenCalledWith(submitEndpoint, mockBody, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
    });

    it('routes to v1 when config exists but is disabled', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      const submitEndpoint = `${ApiRoutes.SUBMISSION}/${submissionId}/template/render`;

      mockGet.mockResolvedValueOnce({ data: { enabled: false } });
      mockPost.mockResolvedValueOnce({ data: { rendered: true } });

      const result = await cdogsRouterService.docGen(
        formId,
        submissionId,
        mockBody
      );
      expect(result).toEqual({ data: { rendered: true } });
      expect(mockGet).toHaveBeenCalledWith(configEndpoint);
      expect(mockPost).toHaveBeenCalledWith(submitEndpoint, mockBody, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
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

      mockGet.mockRejectedValueOnce({ response: { status: 404 } });
      mockPost.mockResolvedValueOnce({ data: { rendered: true } });

      const result = await cdogsRouterService.draftDocGen(formId, mockBody);
      expect(result).toEqual({ data: { rendered: true } });
      expect(mockGet).toHaveBeenCalledWith(configEndpoint);
      expect(mockPost).toHaveBeenCalledWith(draftEndpoint, mockBody, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
    });

    it('routes to v2 when config is enabled', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      const draftEndpoint = `${ApiRoutes.UTILS}/template/render`;

      mockGet.mockResolvedValueOnce({ data: { enabled: true } });
      mockPost.mockResolvedValueOnce({ data: { rendered: true } });

      const result = await cdogsRouterService.draftDocGen(formId, mockBody);
      expect(result).toEqual({ data: { rendered: true } });
      expect(mockGet).toHaveBeenCalledWith(configEndpoint);
      expect(mockPost).toHaveBeenCalledWith(draftEndpoint, mockBody, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
    });

    it('routes to v1 when config exists but is disabled', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      const draftEndpoint = `${ApiRoutes.UTILS}/template/render`;

      mockGet.mockResolvedValueOnce({ data: { enabled: false } });
      mockPost.mockResolvedValueOnce({ data: { rendered: true } });

      const result = await cdogsRouterService.draftDocGen(formId, mockBody);
      expect(result).toEqual({ data: { rendered: true } });
      expect(mockGet).toHaveBeenCalledWith(configEndpoint);
      expect(mockPost).toHaveBeenCalledWith(draftEndpoint, mockBody, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
    });

    it('includes formId in request body for v2 routes', async () => {
      const configEndpoint = `${ApiRoutes.FORMS}/${formId}/cdogsV3Config`;
      const draftEndpoint = `${ApiRoutes.UTILS}/template/render`;

      mockGet.mockResolvedValueOnce({ data: { enabled: true } });
      mockPost.mockResolvedValueOnce({ data: { rendered: true } });

      await cdogsRouterService.draftDocGen(formId, mockBody);

      expect(mockPost).toHaveBeenCalledWith(draftEndpoint, mockBody, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      const callBody = mockPost.mock.calls[0][1];
      expect(callBody.formId).toBe(formId);
    });
  });
});
