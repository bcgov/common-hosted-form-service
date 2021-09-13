const controller = require('../../../../src/forms/submission/controller');
const emailService = require('../../../../src/forms/email/emailService');
const service = require('../../../../src/forms/submission/service');
const cdogsService = require('../../../../src/components/cdogsService');

describe('addStatus', () => {
  const req = {
    params: { formSubmissionId: '1' },
    body: {},
    currentUser: {},
    headers: { referer: 'a' },
  };
  it('should not call email service if no email specified', async () => {
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.createStatus = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusAssigned = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.createStatus).toHaveBeenCalledTimes(1);
    expect(emailService.statusAssigned).toHaveBeenCalledTimes(0);
  });

  it('should call email service if an email specified', async () => {
    req.body.assignmentNotificationEmail = 'a@a.com';
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.createStatus = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusAssigned = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.createStatus).toHaveBeenCalledTimes(1);
    expect(emailService.statusAssigned).toHaveBeenCalledTimes(1);
    expect(emailService.statusAssigned).toHaveBeenCalledWith('123', 1, 'a@a.com', 'a');
  });
});

describe('templateUploadAndRender', () => {
  const parsedContext = {
    'firstName': 'Jane',
    'lastName': 'Smith'
  };
  const content = 'SGVsbG8ge2Quc2ltcGxldGV4dGZpZWxkfSEK';
  const contentFileType = 'txt';
  const outputFileName = 'template_hello_world';
  const outputFileType = 'pdf';

  const req = {
    body: {
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
    }
  };

  const mockCdogsResponse = {
    data: {},
    headers: {},
    status: 200
  };

  mockCdogsResponse.headers['content-disposition'] = 'attachment; filename=template_hello_world.pdf';

  it('should call cdogs service if a body specified', async () => {
    cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(mockCdogsResponse);
    await controller.templateUploadAndRender(req, {}, jest.fn());

    expect(cdogsService.templateUploadAndRender).toHaveBeenCalledTimes(1);
    expect(cdogsService.templateUploadAndRender).toHaveBeenCalledWith(req.body);
  });
});
