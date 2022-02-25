const { Statuses } = require('../../../../src/forms/common/constants');
const controller = require('../../../../src/forms/submission/controller');
const emailService = require('../../../../src/forms/email/emailService');
const service = require('../../../../src/forms/submission/service');
const cdogsService = require('../../../../src/components/cdogsService');

const req = {
  params: { formSubmissionId: '1' },
  body: { code: Statuses.ASSIGNED },
  currentUser: {},
  headers: { referer: 'a' },
};

describe('addStatus', () => {
  it('should not call email service if no email specified', async () => {
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.changeStatusState = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusAssigned = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.changeStatusState).toHaveBeenCalledTimes(1);
    expect(emailService.statusAssigned).toHaveBeenCalledTimes(0);
  });

  it('should call email service if an email specified', async () => {
    req.body.assignmentNotificationEmail = 'a@a.com';
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.changeStatusState = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusAssigned = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.changeStatusState).toHaveBeenCalledTimes(1);
    expect(emailService.statusAssigned).toHaveBeenCalledTimes(1);
    expect(emailService.statusAssigned).toHaveBeenCalledWith('123', 1, 'a@a.com', 'a');
  });

  it('should call statusRevising if email specified', async () => {
    req.body.submissionUserEmail = 'a@a.com';
    req.body.revisionNotificationEmailContent = 'Email content';
    req.body.code = Statuses.REVISING;
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.changeStatusState = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusRevising = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.changeStatusState).toHaveBeenCalledTimes(1);
    expect(emailService.statusRevising).toHaveBeenCalledTimes(1);
    expect(emailService.statusRevising).toHaveBeenCalledWith('123', 1, 'a@a.com', 'Email content', 'a');
  });

  it('should call statusCompleted if email specified', async () => {
    req.body.submissionUserEmail = 'a@a.com';
    req.body.confirmCompleted = true;
    req.body.code = Statuses.COMPLETED;
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.changeStatusState = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusCompleted = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.changeStatusState).toHaveBeenCalledTimes(1);
    expect(emailService.statusCompleted).toHaveBeenCalledTimes(1);
    expect(emailService.statusCompleted).toHaveBeenCalledWith('123', 1, 'a@a.com', 'a');
  });
});

describe('templateUploadAndRender', () => {
  const content = 'SGVsbG8ge2Quc2ltcGxldGV4dGZpZWxkfSEK';
  const contentFileType = 'txt';
  const outputFileName = 'template_hello_world';
  const outputFileType = 'pdf';

  const templateBody = {
    body: {
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
    },
  };

  const templateReq = { ...req, ...templateBody };

  const mockCdogsResponse = {
    data: {},
    headers: {},
    status: 200
  };

  const mockTemplateReadResponse = {
    form: {
      id: '123'
    },
    submission: {
      submission: {
        submission: {
          data: {
            simpletextfield: 'fistName lastName',
            submit: true
          }
        }
      }
    }
  };

  mockCdogsResponse.headers['content-disposition'] = 'attachment; filename=template_hello_world.pdf';

  it('should call cdogs service if a body specified', async () => {
    service.read = jest.fn().mockReturnValue(mockTemplateReadResponse);
    cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(mockCdogsResponse);
    await controller.templateUploadAndRender(templateReq, {}, jest.fn());

    expect(cdogsService.templateUploadAndRender).toHaveBeenCalledTimes(1);
    expect(cdogsService.templateUploadAndRender).toHaveBeenCalledWith(templateReq.body);
  });
});
