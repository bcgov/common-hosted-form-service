import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import formService from '@/services/formService';
import { ApiRoutes } from '@/utils/constants';

const mockInstance = axios.create();
const mockAxios = new MockAdapter(mockInstance);

const zeroUuid = '00000000-0000-0000-0000-000000000000';
const oneUuid = '11111111-1111-1111-1111-111111111111';

jest.mock('@/services/interceptors', () => {
  return {
    appAxios: () => mockInstance
  };
});

describe('Form Service', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  //
  // Forms
  //
  describe('Forms/{id}', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}`;

    it('calls forms endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.readForm(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls update on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPut(endpoint).reply(200, data);

      const result = await formService.updateForm(zeroUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.put).toHaveLength(1);
    });

    it('calls delete on endpoint', async () => {
      mockAxios.onDelete(endpoint).reply(200);

      const result = await formService.deleteForm(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.delete).toHaveLength(1);
    });
  });

  describe('Forms', () => {
    const endpoint = `${ApiRoutes.FORMS}`;

    it('calls create on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPost(endpoint).reply(200, data);

      const result = await formService.createForm(zeroUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });


  //
  // Form Drafts
  //
  describe('Forms/{formId}/drafts/{formVersionDraftId}', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/drafts/${oneUuid}`;

    it('calls read endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.readDraft(zeroUuid, oneUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls update on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPut(endpoint).reply(200, data);

      const result = await formService.updateDraft(zeroUuid, oneUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.put).toHaveLength(1);
    });

    it('calls delete on endpoint', async () => {
      mockAxios.onDelete(endpoint).reply(200);

      const result = await formService.deleteDraft(zeroUuid, oneUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.delete).toHaveLength(1);
    });
  });

  describe('Forms/{formId}/drafts', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/drafts`;

    it('calls list endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.listDrafts(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls create on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPost(endpoint).reply(200, data);

      const result = await formService.createDraft(zeroUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('Forms/{formId}/versions/{versioId}/publish', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/versions/${oneUuid}/publish`;

    it('calls publish endpoint', async () => {
      mockAxios.onPost(endpoint).reply(200);

      const result = await formService.publishVersion(zeroUuid, oneUuid, true);
      expect(result).toBeTruthy();
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('Forms/{formId}/drafts/publish', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/drafts/${oneUuid}/publish`;

    it('calls publish endpoint', async () => {
      mockAxios.onPost(endpoint).reply(200);

      const result = await formService.publishDraft(zeroUuid, oneUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  //
  // Form Versions
  //
  describe('Forms/{formId}/versions/{formVersionId}', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/versions/${oneUuid}`;

    it('calls read endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.readVersion(zeroUuid, oneUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls update on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPut(endpoint).reply(200, data);

      const result = await formService.updateVersion(zeroUuid, oneUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.put).toHaveLength(1);
    });
  });

  describe('Forms/{formId}/versions', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/versions`;

    it('calls list endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.listVersions(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('Forms/{formId}/version', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/version`;

    it('calls read published endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.readPublished(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  //
  // Submissions
  //
  describe('forms/{formId}/versions/{formVersionId}/submissions', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/versions/${oneUuid}/submissions`;

    it('calls create on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPost(endpoint).reply(200, data);

      const result = await formService.createSubmission(zeroUuid, oneUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('submissions/{submissionId}', () => {
    const endpoint = `submissions/${zeroUuid}`;

    it('calls get on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.getSubmission(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('delete submissions/{submissionId}', () => {
    const endpoint = `submissions/${zeroUuid}`;

    it('calls get on endpoint', async () => {
      mockAxios.onDelete(endpoint).reply(200);

      const result = await formService.deleteSubmission(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.delete).toHaveLength(1);
    });
  });

  describe('forms/{formId}/submissions', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/submissions`;

    it('calls get on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.listSubmissions(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('forms/{formId}/export', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/export`;

    it('calls get on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.exportSubmissions(zeroUuid, '2010', '2011', 'csv');
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  //
  // Email
  //
  describe('submission/{submissionId}/email', () => {
    const endpoint = `${ApiRoutes.SUBMISSION}/${zeroUuid}/email`;

    it('calls email endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPost(endpoint).reply(200, data);

      const result = await formService.requestReceiptEmail(zeroUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

});


