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
    req.body.revisionNotificationEmailContent = 'Email Content';
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.changeStatusState = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusAssigned = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.changeStatusState).toHaveBeenCalledTimes(1);
    expect(emailService.statusAssigned).toHaveBeenCalledTimes(1);
    expect(emailService.statusAssigned).toHaveBeenCalledWith('123', 1, 'a@a.com', 'Email Content', 'a');
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
    req.body.revisionNotificationEmailContent = 'Email Content';
    req.body.confirmCompleted = true;
    req.body.code = Statuses.COMPLETED;
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.changeStatusState = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusCompleted = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.changeStatusState).toHaveBeenCalledTimes(1);
    expect(emailService.statusCompleted).toHaveBeenCalledTimes(1);
    expect(emailService.statusCompleted).toHaveBeenCalledWith('123', 1, 'a@a.com', 'Email Content', 'a');
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
    status: 200,
  };

  const mockTemplateReadResponse = {
    form: {
      id: '123',
    },
    submission: {
      submission: {
        submission: {
          data: {
            simpletextfield: 'fistName lastName',
            submit: true,
          },
        },
      },
    },
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

describe('deleteMutipleSubmissions', () => {
  const returnValue = {
    submission: [
      { id: 'ac4ef441-43b1-414a-a0d4-1e2f67c2a745', formVersionId: '8d8e24ce-326f-4536-9100-a0844c27d5a0', confirmationId: 'AC4EF441', draft: false, deleted: true },
      { id: '0715b1ac-4069-4778-a868-b4f71fdea18d', formVersionId: '8d8e24ce-326f-4536-9100-a0844c27d5a0', confirmationId: '0715B1AC', draft: false, deleted: true },
    ],
    version: [{ id: '8d8e24ce-326f-4536-9100-a0844c27d5a0', formId: 'a9ac13d3-340d-4b73-8920-8c8776b4eeca', version: 1, schema: {}, createdBy: 'testa@idir' }],
    form: [{ id: 'a9ac13d3-340d-4b73-8920-8c8776b4eeca', name: 'FisheriesAA', description: '', active: true, labels: null }],
  };

  const req = {
    params: {},
    body: { submissionIds: ['ac4ef441-43b1-414a-a0d4-1e2f67c2a745', '0715b1ac-4069-4778-a868-b4f71fdea18d'] },
    currentUser: {},
    headers: {},
  };
  it('should call deleteMutipleSubmissions service in controller', async () => {
    service.deleteMutipleSubmissions = jest.fn().mockReturnValue(returnValue);
    await controller.deleteMutipleSubmissions(req, {}, jest.fn());

    expect(service.deleteMutipleSubmissions).toHaveBeenCalledTimes(1);
    expect(service.deleteMutipleSubmissions).toHaveBeenCalledWith(req.body.submissionIds, req.currentUser);
  });
});

describe('restoreMutipleSubmissions', () => {
  const returnValue = {
    submission: [
      { id: 'ac4ef441-43b1-414a-a0d4-1e2f67c2a745', formVersionId: '8d8e24ce-326f-4536-9100-a0844c27d5a0', confirmationId: 'AC4EF441', draft: false, deleted: false },
      { id: '0715b1ac-4069-4778-a868-b4f71fdea18d', formVersionId: '8d8e24ce-326f-4536-9100-a0844c27d5a0', confirmationId: '0715B1AC', draft: false, deleted: false },
    ],
    version: [{ id: '8d8e24ce-326f-4536-9100-a0844c27d5a0', formId: 'a9ac13d3-340d-4b73-8920-8c8776b4eeca', version: 1, schema: {}, createdBy: 'testa@idir' }],
    form: [{ id: 'a9ac13d3-340d-4b73-8920-8c8776b4eeca', name: 'FisheriesAA', description: '', active: true, labels: null }],
  };

  const req = {
    params: {},
    body: { submissionIds: ['ac4ef441-43b1-414a-a0d4-1e2f67c2a745', '0715b1ac-4069-4778-a868-b4f71fdea18d'] },
    currentUser: {},
    headers: {},
  };
  it('should call restoreMutipleSubmissions service in controller', async () => {
    service.restoreMutipleSubmissions = jest.fn().mockReturnValue(returnValue);
    await controller.restoreMutipleSubmissions(req, {}, jest.fn());

    expect(service.restoreMutipleSubmissions).toHaveBeenCalledTimes(1);
    expect(service.restoreMutipleSubmissions).toHaveBeenCalledWith(req.body.submissionIds, req.currentUser);
  });
});
