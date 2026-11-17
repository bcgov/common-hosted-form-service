import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import service from '~/services/fileService';
import { ApiRoutes } from '~/utils/constants';

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

vi.mock('~/services/interceptors', () => {
  return {
    appAxios: () => mockInstance,
  };
});

beforeEach(() => {
  mockAxios.reset();
});

describe('File Service', () => {
  describe('uploadFile', () => {
    it('posts to the files endpoint with the form id', async () => {
      mockAxios.onPost(`${ApiRoutes.FILES}?formId=form-1`).reply(201, { id: 'f1' });

      const result = await service.uploadFile('file', { formId: 'form-1' });

      expect(result.data).toEqual({ id: 'f1' });
      expect(mockAxios.history.post[0].headers['Content-Type']).toBe('multipart/form-data');
    });

    it('adds the submission being edited when given', async () => {
      mockAxios.onPost(`${ApiRoutes.FILES}?formId=form-1&formSubmissionId=sub-1`).reply(201, { id: 'f1' });

      const result = await service.uploadFile('file', { formId: 'form-1', formSubmissionId: 'sub-1' });

      expect(result.status).toBe(201);
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });
});
