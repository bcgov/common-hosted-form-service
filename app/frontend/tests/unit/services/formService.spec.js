import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formService } from '~/services';
import {
  clearSubmissionAccessToken,
  getValidSubmissionAccessToken,
  SUBMISSION_ACCESS_TOKEN_STORAGE_PREFIX,
} from '~/services/formService';
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

describe('Form Service', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  //
  // Forms
  //
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

  describe('Forms/{formId}', () => {
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

  describe('Forms/{formId}/fields', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/fields`;

    it('calls fields endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200, { versions: [], fields: [] });

      const result = await formService.readFormFields(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].url).toEqual(endpoint);
    });
  });

  describe('Forms/{formId}/options', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/options`;

    it('calls read endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.readFormOptions(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('Forms/{formId}/statusCodes', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/statusCodes`;

    it('calls read endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.getStatusCodes(zeroUuid);
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

  describe('Forms/{formId}/versions/{versionId}/publish', () => {
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
  // Email Templates
  //
  describe('Forms/{formId}/emailTemplates', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/emailTemplates`;

    it('calls list endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.listEmailTemplates(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('Forms/{formId}/emailTemplate', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/emailTemplate`;

    it('calls update on endpoint', async () => {
      const data = { formId: zeroUuid, test: 'testdata' };
      mockAxios.onPut(endpoint).reply(200, data);

      const result = await formService.updateEmailTemplate(data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.put).toHaveLength(1);
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

      const result = await formService.createSubmission(
        zeroUuid,
        oneUuid,
        data
      );
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

  describe('submissions/{submissionId}/options', () => {
    const endpoint = `submissions/${zeroUuid}/options`;

    it('calls get on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.getSubmissionOptions(zeroUuid);
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

  describe('put submissions/{submissionId}', () => {
    const endpoint = `submissions/${zeroUuid}`;

    it('calls update on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPut(endpoint).reply(200, data);

      const result = await formService.updateSubmission(zeroUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.put).toHaveLength(1);
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

  describe('submissions/{submissionId}/edits', () => {
    const endpoint = `submissions/${zeroUuid}/edits`;

    it('calls get on endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.listSubmissionEdits(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('forms/{formId}/export/fields', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/export/fields`;

    it('calls get on endpoint', async () => {
      mockAxios.onPost(endpoint).reply(200);

      const result = await formService.exportSubmissions(zeroUuid, 'csv');
      expect(result).toBeTruthy();
      expect(mockAxios.history.post).toHaveLength(1);
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

  //
  // Notes and Status
  //
  describe('submission/{submissionId}/email', () => {
    const endpoint = `${ApiRoutes.SUBMISSION}/${zeroUuid}/notes`;

    it('calls get endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.getSubmissionNotes(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls post endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPost(endpoint).reply(200, data);

      const result = await formService.addNote(zeroUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('submission/{submissionId}/template/render', () => {
    const endpoint = `${ApiRoutes.SUBMISSION}/${zeroUuid}/template/render`;

    it('calls post endpoint', async () => {
      mockAxios.onPost(endpoint).reply(200);
      const parsedContext = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const content = 'SGVsbG8ge2Quc2ltcGxldGV4dGZpZWxkfSEK';
      const contentFileType = 'txt';
      const outputFileName = 'template_hello_world';
      const outputFileType = 'pdf';

      const mockBody = {
        data: parsedContext,
        options: {
          reportName: outputFileName,
          convertTo: outputFileType,
          overwrite: true,
        },
        template: {
          content: content,
          encodingType: 'base64',
          fileType: contentFileType,
        },
      };

      const result = await formService.docGen(zeroUuid, mockBody);
      expect(result).toBeTruthy();
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('forms/{formId}/template/render', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}/template/render`;

    it('calls post endpoint', async () => {
      mockAxios.onPost(endpoint).reply(200);
      const mockBody = {
        template: {
          content: 'SGVsbG8ge2Quc2ltcGxldGV4dGZpZWxkfSEK',
          encodingType: 'base64',
          fileType: 'txt',
        },
        submission: {
          data: { simpletextfield: 'firstName lastName' },
        },
      };

      const result = await formService.draftDocGen(zeroUuid, mockBody);
      expect(result).toBeTruthy();
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('submission/{submissionId}/status', () => {
    const endpoint = `${ApiRoutes.SUBMISSION}/${zeroUuid}/status`;

    it('calls get endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.getSubmissionStatuses(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls post endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPost(endpoint).reply(200, data);

      const result = await formService.updateSubmissionStatus(zeroUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('GET submission/{submissionId}/submitterRevision', () => {
    const endpoint = `${ApiRoutes.SUBMISSION}/${zeroUuid}/submitterRevision`;

    it('calls check submitter revision endpoint', async () => {
      const responseData = true;
      mockAxios.onGet(endpoint).reply(200, responseData);

      const result = await formService.checkSubmitterRevision(zeroUuid);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(responseData);
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('handles false response when revision not allowed', async () => {
      const responseData = false;
      mockAxios.onGet(endpoint).reply(200, responseData);

      const result = await formService.checkSubmitterRevision(zeroUuid);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(responseData);
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('POST submission/{submissionId}/submitterRevision', () => {
    const endpoint = `${ApiRoutes.SUBMISSION}/${zeroUuid}/submitterRevision`;

    it('calls perform submitter revision endpoint successfully', async () => {
      const responseData = { success: true, message: 'Revision initiated' };
      mockAxios.onPost(endpoint).reply(200, responseData);

      const result = await formService.performSubmitterRevision(zeroUuid);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(responseData);
      expect(result.status).toBe(200);
      expect(mockAxios.history.post).toHaveLength(1);
    });

    it('handles 400 response when revision not allowed', async () => {
      mockAxios
        .onPost(endpoint)
        .reply(400, { message: 'Revision not allowed' });

      try {
        await formService.performSubmitterRevision(zeroUuid);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
      expect(mockAxios.history.post).toHaveLength(1);
    });

    it('handles 403 response when user lacks permission', async () => {
      mockAxios.onPost(endpoint).reply(403, { message: 'Permission denied' });

      try {
        await formService.performSubmitterRevision(zeroUuid);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('submissions/${submissionId}/${formId}/submissions', () => {
    let submissionId = 'ac4ef441-43b1-414a-a0d4-1e2f67c2a745';
    let formId = 'd15a8c14-c78a-42fa-8afd-b3f1fed59159';

    const endpoint = `${ApiRoutes.SUBMISSION}/${submissionId}/${formId}/submissions`;

    it('calls delete endpoint', async () => {
      mockAxios.onDelete(endpoint).reply(200);

      let submissionIds = [
        'ac4ef441-43b1-414a-a0d4-1e2f67c2a745',
        '0715b1ac-4069-4778-a868-b4f71fdea18d',
      ];

      const result = await formService.deleteMultipleSubmissions(
        submissionId,
        formId,
        { data: { submissionIds } }
      );
      expect(result).toBeTruthy();
      expect(mockAxios.history.delete).toHaveLength(1);
    });
  });

  describe('submissions/${submissionId}/${formId}/submissions/restore', () => {
    let submissionId = 'ac4ef441-43b1-414a-a0d4-1e2f67c2a745';
    let formId = 'd15a8c14-c78a-42fa-8afd-b3f1fed59159';
    const endpoint = `${ApiRoutes.SUBMISSION}/${submissionId}/${formId}/submissions/restore`;

    it('calls restore multiple submission endpoint', async () => {
      mockAxios.onPut(endpoint).reply(200);
      let submissionIds = [
        'ac4ef441-43b1-414a-a0d4-1e2f67c2a745',
        '0715b1ac-4069-4778-a868-b4f71fdea18d',
      ];

      const result = await formService.restoreMultipleSubmissions(
        submissionId,
        formId,
        { submissionIds }
      );
      expect(result).toBeTruthy();
      expect(mockAxios.history.put).toHaveLength(1);
    });
  });
  describe('submissions/${formId}/csvexport/fields', () => {
    let formId = 'd15a8c14-c78a-42fa-8afd-b3f1fed59159';

    const endpoint = `${ApiRoutes.FORMS}/${formId}/csvexport/fields`;

    it('calls to get submissions fields for csv export', async () => {
      mockAxios.onGet(endpoint).reply(200);
      const result = await formService.readCSVExportFields(
        formId,
        'submissions',
        false,
        false,
        1
      );
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });

  describe('Forms/{formId}/externalAPIs', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}${ApiRoutes.EXTERNAL_APIS}`;

    it('calls list endpoint', async () => {
      mockAxios.onGet(endpoint).reply(200);

      const result = await formService.externalAPIList(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls create on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPost(endpoint).reply(200, data);

      const result = await formService.externalAPICreate(zeroUuid, data);
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.post).toHaveLength(1);
    });
  });

  describe('Forms/{formId}/externalAPIs/{id}', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}${ApiRoutes.EXTERNAL_APIS}/${zeroUuid}`;

    it('calls update on endpoint', async () => {
      const data = { test: 'testdata' };
      mockAxios.onPut(endpoint).reply(200, data);

      const result = await formService.externalAPIUpdate(
        zeroUuid,
        zeroUuid,
        data
      );
      expect(result).toBeTruthy();
      expect(result.data).toEqual(data);
      expect(mockAxios.history.put).toHaveLength(1);
    });

    it('calls delete on endpoint', async () => {
      mockAxios.onDelete(endpoint).reply(200);

      const result = await formService.externalAPIDelete(zeroUuid, zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.delete).toHaveLength(1);
    });
  });

  describe('createSubmission access token handling', () => {
    const formId = zeroUuid;
    const versionId = oneUuid;
    const submissionId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const endpoint = `${ApiRoutes.FORMS}/${formId}/versions/${versionId}/submissions`;

    afterEach(() => {
      sessionStorage.clear();
    });

    it('persists _accessToken to sessionStorage and strips it from the returned data', async () => {
      const token = `${submissionId}.${Date.now() + 60_000}.${'a'.repeat(64)}`;
      mockAxios.onPost(endpoint).reply(201, { id: submissionId, _accessToken: token, foo: 'bar' });

      const result = await formService.createSubmission(formId, versionId, {});

      expect(result.data.id).toBe(submissionId);
      expect(result.data.foo).toBe('bar');
      expect(result.data._accessToken).toBeUndefined();
      expect(sessionStorage.getItem(SUBMISSION_ACCESS_TOKEN_STORAGE_PREFIX + submissionId)).toBe(token);
    });

    it('does nothing to sessionStorage when the response has no _accessToken', async () => {
      mockAxios.onPost(endpoint).reply(201, { id: submissionId, foo: 'bar' });

      const result = await formService.createSubmission(formId, versionId, {});

      expect(result.data._accessToken).toBeUndefined();
      expect(sessionStorage.getItem(SUBMISSION_ACCESS_TOKEN_STORAGE_PREFIX + submissionId)).toBeNull();
    });
  });

  describe('getValidSubmissionAccessToken', () => {
    const submissionId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const key = SUBMISSION_ACCESS_TOKEN_STORAGE_PREFIX + submissionId;

    afterEach(() => {
      sessionStorage.clear();
    });

    it('returns the token when its exp segment is in the future', () => {
      const token = `${submissionId}.${Date.now() + 60_000}.${'a'.repeat(64)}`;
      sessionStorage.setItem(key, token);
      expect(getValidSubmissionAccessToken(submissionId)).toBe(token);
    });

    it('returns null when the exp segment is in the past', () => {
      sessionStorage.setItem(key, `${submissionId}.${Date.now() - 1000}.${'a'.repeat(64)}`);
      expect(getValidSubmissionAccessToken(submissionId)).toBeNull();
    });

    it('returns null when no token is stored', () => {
      expect(getValidSubmissionAccessToken(submissionId)).toBeNull();
    });

    it('returns null when the token is malformed', () => {
      sessionStorage.setItem(key, 'not-a-real-token');
      expect(getValidSubmissionAccessToken(submissionId)).toBeNull();
    });

    it('returns null when the exp segment is not a number', () => {
      sessionStorage.setItem(key, `${submissionId}.notanumber.${'a'.repeat(64)}`);
      expect(getValidSubmissionAccessToken(submissionId)).toBeNull();
    });

    it('returns null when no submissionId is provided', () => {
      expect(getValidSubmissionAccessToken(undefined)).toBeNull();
      expect(getValidSubmissionAccessToken('')).toBeNull();
    });
  });

  describe('clearSubmissionAccessToken', () => {
    const submissionId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const key = SUBMISSION_ACCESS_TOKEN_STORAGE_PREFIX + submissionId;

    afterEach(() => {
      sessionStorage.clear();
    });

    it('removes the token for the given submissionId', () => {
      sessionStorage.setItem(key, 'something');
      clearSubmissionAccessToken(submissionId);
      expect(sessionStorage.getItem(key)).toBeNull();
    });

    it('is a no-op when no token is stored', () => {
      expect(() => clearSubmissionAccessToken(submissionId)).not.toThrow();
      expect(sessionStorage.getItem(key)).toBeNull();
    });

    it('is a no-op when no submissionId is provided', () => {
      sessionStorage.setItem(key, 'something');
      clearSubmissionAccessToken(undefined);
      clearSubmissionAccessToken('');
      expect(sessionStorage.getItem(key)).toBe('something');
    });
  });

  describe('Forms/{formId}/externalAPIs lists', () => {
    const endpoint = `${ApiRoutes.FORMS}/${zeroUuid}${ApiRoutes.EXTERNAL_APIS}`;

    it('calls algorithms list endpoint', async () => {
      mockAxios.onGet(`${endpoint}/algorithms`).reply(200);

      const result = await formService.externalAPIAlgorithmList(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('calls statusCodes list endpoint', async () => {
      mockAxios.onGet(`${endpoint}/statusCodes`).reply(200);

      const result = await formService.externalAPIStatusCodes(zeroUuid);
      expect(result).toBeTruthy();
      expect(mockAxios.history.get).toHaveLength(1);
    });
  });
});
