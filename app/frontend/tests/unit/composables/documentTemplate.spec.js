// @vitest-environment happy-dom
// happy-dom is required to access window.URL
import { beforeEach, vi } from 'vitest';
import {
  fetchDocumentTemplates,
  getDocumentTemplate,
  readFile,
} from '~/composables/documentTemplate';
import { formService } from '~/services';

describe('documentTemplate.js', () => {
  describe('fetchDocumentTemplates', () => {
    const documentTemplateListSpy = vi.spyOn(
      formService,
      'documentTemplateList'
    );

    let mockDatabase;

    beforeEach(() => {
      mockDatabase = [
        {
          filename: 'test.txt',
          createdAt: '2024-06-03',
          id: '1',
        },
      ];
    });

    it('should return an array of document templates from the form service', async () => {
      documentTemplateListSpy.mockImplementationOnce(async () => {
        return {
          data: Array.from(mockDatabase),
        };
      });

      const documentTemplates = await fetchDocumentTemplates('1');
      expect(documentTemplates).toEqual(
        mockDatabase.map((template) => {
          return {
            filename: template.filename,
            createdAt: template.createdAt,
            templateId: template.id,
            actions: '',
          };
        })
      );
    });
  });

  describe('getDocumentTemplate', () => {
    let createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');

    it('should throw an error if there was no data in the document', async () => {
      const documentTemplateReadSpy = vi.spyOn(
        formService,
        'documentTemplateRead'
      );
      documentTemplateReadSpy.mockImplementationOnce(async () => {
        return {};
      });

      await expect(
        getDocumentTemplate('1', '1', 'filename.txt')
      ).rejects.toThrowError('There was no data in the document.');
    });

    it('should create a valid url with valid data', async () => {
      const documentTemplateReadSpy = vi.spyOn(
        formService,
        'documentTemplateRead'
      );
      documentTemplateReadSpy.mockImplementationOnce(async () => {
        return {
          data: {
            active: true,
            createdAt: '2024-06-03',
            createdBy: 'TESTIDIR',
            filename: 'cdogs.txt',
            formId: '1',
            id: '1',
            template: {
              type: 'Buffer',
              data: [
                83, 71, 86, 115, 98, 71, 56, 103, 101, 50, 81, 117, 90, 109,
                108, 121, 99, 51, 82, 79, 89, 87, 49, 108, 102, 83, 52, 61,
              ],
            },
            updatedAt: '2024-06-03',
            updatedBy: null,
          },
        };
      });
      createObjectURLSpy.mockImplementation((data) => data);

      const url = await getDocumentTemplate('1', '1', 'cdogs.txt');
      const base64EncodedData = [
        83, 71, 86, 115, 98, 71, 56, 103, 101, 50, 81, 117, 90, 109, 108, 121,
        99, 51, 82, 79, 89, 87, 49, 108, 102, 83, 52, 61,
      ]
        .map((byte) => String.fromCharCode(byte))
        .join('');
      // Decode the base64 string to binary data
      const binaryString = atob(base64EncodedData);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      expect(url).toEqual(new Blob([bytes], { type: 'text/plain' }));
    });
  });

  describe('readFile', () => {
    it('should return a valid file', async () => {
      // no data
      const mockInputElement = document.createElement('input');
      mockInputElement.type = 'file';
      const file = await readFile(mockInputElement);
      expect(file).toEqual('');
    });

    it('should reject if there was an error reading the file', async () => {
      // This needs to be implemented
    });
  });
});
