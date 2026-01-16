const controller = require('../../../../../src/webcomponents/v1/print/controller');
const cdogsService = require('../../../../../src/components/cdogsService');
const submissionService = require('../../../../../src/forms/submission/service');
const printConfigService = require('../../../../../src/forms/form/printConfig/service');
const documentTemplateService = require('../../../../../src/forms/form/documentTemplate/service');
const formService = require('../../../../../src/forms/form/service');
const { PrintConfigTypes } = require('../../../../../src/forms/common/constants');

describe('webcomponents/v1/print controller', () => {
  const res = () => {
    const resMock = {
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    return resMock;
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('printSubmission', () => {
    it('renders existing submission using direct print config', async () => {
      const req = {
        params: { formId: 'form-1', formSubmissionId: 'sub-1' },
      };
      const response = res();
      const next = jest.fn();

      jest.spyOn(printConfigService, 'readPrintConfig').mockResolvedValue({ code: PrintConfigTypes.DIRECT, templateId: 'tmpl-1', outputFileType: 'pdf' });
      jest.spyOn(submissionService, 'read').mockResolvedValue({
        submission: {
          id: 'sub-1',
          confirmationId: 'conf-1',
          draft: false,
          deleted: false,
          createdBy: 'user',
          createdAt: 'now',
          updatedBy: 'user',
          updatedAt: 'now',
          submission: { data: { field: 'value' } },
        },
        version: { version: 3 },
        form: { name: 'Form Name' },
      });
      jest.spyOn(documentTemplateService, 'documentTemplateRead').mockResolvedValue({
        filename: 'template.docx',
        template: Buffer.from('file'),
      });
      jest.spyOn(cdogsService, 'templateUploadAndRender').mockResolvedValue({
        data: Buffer.from('pdf'),
        headers: {
          'content-disposition': 'attachment; filename="file.pdf"',
          'content-type': 'application/pdf',
        },
        status: 200,
      });

      await controller.printSubmission(req, response, next);

      expect(printConfigService.readPrintConfig).toHaveBeenCalledWith('form-1');
      expect(submissionService.read).toHaveBeenCalledWith('sub-1');
      expect(documentTemplateService.documentTemplateRead).toHaveBeenCalledWith('tmpl-1');
      expect(cdogsService.templateUploadAndRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({ reportName: 'Form Name', convertTo: 'pdf' }),
          template: expect.objectContaining({ encodingType: 'base64', fileType: 'docx' }),
          data: expect.objectContaining({
            field: 'value',
            chefs: expect.objectContaining({
              submissionId: 'sub-1',
              confirmationId: 'conf-1',
            }),
          }),
        })
      );
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.set).toHaveBeenCalledWith({
        'Content-Disposition': 'attachment; filename="file.pdf"',
        'Content-Type': 'application/pdf',
      });
      expect(response.send).toHaveBeenCalledWith(Buffer.from('pdf'));
      expect(next).not.toHaveBeenCalled();
    });

    it('falls back to form name when submission form name is missing', async () => {
      const req = {
        params: { formId: 'form-1', formSubmissionId: 'sub-1' },
      };
      const response = res();
      const next = jest.fn();

      jest.spyOn(printConfigService, 'readPrintConfig').mockResolvedValue({ code: PrintConfigTypes.DIRECT, templateId: 'tmpl-1', outputFileType: 'pdf' });
      jest.spyOn(submissionService, 'read').mockResolvedValue({
        submission: {
          id: 'sub-1',
          confirmationId: 'conf-1',
          draft: false,
          deleted: false,
          createdBy: 'user',
          createdAt: 'now',
          updatedBy: 'user',
          updatedAt: 'now',
          submission: { data: {} },
        },
        version: { version: 3 },
        form: null,
      });
      jest.spyOn(formService, 'readPublishedForm').mockResolvedValue({ name: 'Fallback Form' });
      jest.spyOn(documentTemplateService, 'documentTemplateRead').mockResolvedValue({
        filename: 'template.docx',
        template: Buffer.from('file'),
      });
      jest.spyOn(cdogsService, 'templateUploadAndRender').mockResolvedValue({
        data: Buffer.from('pdf'),
        headers: {
          'content-disposition': 'attachment; filename="file.pdf"',
          'content-type': 'application/pdf',
        },
        status: 200,
      });

      await controller.printSubmission(req, response, next);

      expect(formService.readPublishedForm).toHaveBeenCalledWith('form-1');
      expect(cdogsService.templateUploadAndRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({ reportName: 'Fallback Form' }),
        })
      );
      expect(response.status).toHaveBeenCalledWith(200);
    });

    it('calls next with Problem when direct print config missing', async () => {
      const req = {
        params: { formId: 'form-1', formSubmissionId: 'sub-1' },
      };
      const response = res();
      const next = jest.fn();

      jest.spyOn(printConfigService, 'readPrintConfig').mockResolvedValue({ code: 'OTHER' });

      await controller.printSubmission(req, response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const err = next.mock.calls[0][0];
      expect(err.status || err.statusCode || err.httpCode || err.code).toBe(400);
    });
  });

  describe('printDraft', () => {
    it('renders draft submission using direct print config and form name', async () => {
      const req = {
        params: { formId: 'form-1' },
        body: { submission: { data: { draft: true } } },
      };
      const response = res();
      const next = jest.fn();

      jest.spyOn(printConfigService, 'readPrintConfig').mockResolvedValue({ code: PrintConfigTypes.DIRECT, templateId: 'tmpl-1', outputFileType: 'pdf' });
      jest.spyOn(documentTemplateService, 'documentTemplateRead').mockResolvedValue({
        filename: 'template.docx',
        template: Buffer.from('file'),
      });
      jest.spyOn(formService, 'readPublishedForm').mockResolvedValue({ name: 'Form Name' });
      jest.spyOn(cdogsService, 'templateUploadAndRender').mockResolvedValue({
        data: Buffer.from('pdf'),
        headers: {
          'content-disposition': 'attachment; filename="file.pdf"',
          'content-type': 'application/pdf',
        },
        status: 200,
      });

      await controller.printDraft(req, response, next);

      expect(printConfigService.readPrintConfig).toHaveBeenCalledWith('form-1');
      expect(documentTemplateService.documentTemplateRead).toHaveBeenCalledWith('tmpl-1');
      expect(formService.readPublishedForm).toHaveBeenCalledWith('form-1');
      expect(cdogsService.templateUploadAndRender).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({ reportName: 'Form Name', convertTo: 'pdf' }),
          template: expect.objectContaining({ encodingType: 'base64', fileType: 'docx' }),
          data: expect.objectContaining({ draft: true }),
        })
      );
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.set).toHaveBeenCalledWith({
        'Content-Disposition': 'attachment; filename="file.pdf"',
        'Content-Type': 'application/pdf',
      });
      expect(response.send).toHaveBeenCalledWith(Buffer.from('pdf'));
      expect(next).not.toHaveBeenCalled();
    });
  });
});
