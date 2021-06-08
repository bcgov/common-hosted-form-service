const chesService = require('../../../../src/components/chesService');
const emailService = require('../../../../src/forms/email/emailService');
const formService = require('../../../../src/forms/form/service');
const fs = require('fs');
const mockedReadFileSync = jest.spyOn(fs, 'readFileSync');

const referer = 'https://chefs.nrs.gov.bc.ca';

describe('_appUrl', () => {
  it('should format the url', () => {
    expect(
      emailService._appUrl(
        'https://chefs-dev.apps.silver.devops.gov.bc.ca/pr-139/form/success?s=13978f3b-056b-4022-9a30-60d3b63ec459'
      )
    ).toEqual('https://chefs-dev.apps.silver.devops.gov.bc.ca/pr-139');
    expect(
      emailService._appUrl(
        'https://chefs.nrs.gov.bc.ca/app/form/success?s=13978f3b-056b-4022-9a30-60d3b63ec459'
      )
    ).toEqual('https://chefs.nrs.gov.bc.ca/app');
  });

  it('should rethrow exceptions', () => {
    expect(() => emailService._appUrl('notaurl')).toThrow(
      'Invalid URL: notaurl'
    );
  });
});

describe('_mergeEmailTemplate', () => {
  it('should merge two html files', () => {
    mockedReadFileSync
      .mockReturnValueOnce('<!-- BODY END -->')
      .mockReturnValueOnce('<h1>New Body</h1>');

    const result = emailService._mergeEmailTemplate('test-file.html');

    expect(result).toMatch('<h1>New Body</h1><!-- BODY END -->');
    mockedReadFileSync.mockRestore();
  });
});

describe('_sendEmailTemplate', () => {
  const submission = {
    confirmationId: 'abc',
    id: '123',
  };
  const configData = {
    assignmentNotificationEmail: 'a@b.com',
    body: {
      to: 'c@d.com',
    },
    form: {
      showSubmissionConfirmation: 'confirmation',
      submissionReceivedEmails: {
        1: 'x@y.com',
        2: 'a@b.com',
      },
    },
  };

  beforeEach(() => {
    mockedReadFileSync
      .mockReturnValueOnce('<!-- BODY END -->')
      .mockReturnValueOnce('<h1>New Body</h1>');
  });

  it('should call chesService to send an email with type sendStatusAssigned', () => {
    chesService.merge = jest.fn().mockReturnValue('sent');
    emailService._mergeEmailTemplate = jest.fn().mockReturnValue('merged');

    const result = emailService._sendEmailTemplate(
      'sendStatusAssigned',
      configData,
      submission,
      referer
    );

    expect(result).toBeTruthy();
    expect(chesService.merge).toHaveBeenCalledTimes(1);
    mockedReadFileSync.mockRestore();
  });

  it('should call chesService to send an email with type sendSubmissionConfirmation', () => {
    chesService.merge = jest.fn().mockReturnValue('sent');
    emailService._mergeEmailTemplate = jest.fn().mockReturnValue('merged');

    const result = emailService._sendEmailTemplate(
      'sendSubmissionConfirmation',
      configData,
      submission,
      referer
    );

    expect(result).toBeTruthy();
    expect(chesService.merge).toHaveBeenCalledTimes(1);
    mockedReadFileSync.mockRestore();
  });

  it('should call chesService to send an email with type sendSubmissionReceived', () => {
    chesService.merge = jest.fn().mockReturnValue('sent');
    emailService._mergeEmailTemplate = jest.fn().mockReturnValue('merged');

    const result = emailService._sendEmailTemplate(
      'sendSubmissionReceived',
      configData,
      submission,
      referer
    );

    expect(result).toBeTruthy();
    expect(chesService.merge).toHaveBeenCalledTimes(1);
    mockedReadFileSync.mockRestore();
  });
});

describe('public methods', () => {
  const currentStatus = {
    submissionId: '456',
  };
  const form = {
    id: 'xxx-yyy',
    showSubmissionConfirmation: true,
    name: '123',
    submissionReceivedEmails: ['a@b.com','z@y.com']
  };
  const submission = {
    confirmationId: 'abc',
    id: '123',
  };
  const assignmentNotificationEmail = 'x@y.com';
  const body = { to: 'a@b.com' };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('statusAssigned should call send a status email', async () => {
    formService.readForm = jest.fn().mockReturnValue(form);
    formService.readSubmission = jest.fn().mockReturnValue(submission);
    emailService._sendEmailTemplate = jest.fn().mockReturnValue('ret');

    const result = await emailService.statusAssigned(
      '123',
      currentStatus,
      assignmentNotificationEmail,
      referer
    );
    expect(result).toEqual('ret');
    expect(formService.readSubmission).toHaveBeenCalledTimes(1);
    expect(formService.readSubmission).toHaveBeenCalledWith(
      currentStatus.submissionId
    );
    expect(emailService._sendEmailTemplate).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith(
      'sendStatusAssigned',
      expect.objectContaining({
        bodyTemplate: 'send-status-assigned-email-body.html',
        title: `${form.name} Submission Assignment`,
        subject: 'Form Submission Assignment',
        messageLinkText: 'You have been assigned to review this submission.',
        priority: 'normal',
        assignmentNotificationEmail,
      }),
      submission,
      referer
    );
  });

  it('submissionConfirmation should call send a conf email', async () => {
    formService.readForm = jest.fn().mockReturnValue(form);
    formService.readSubmission = jest.fn().mockReturnValue(submission);
    emailService._sendEmailTemplate = jest.fn().mockReturnValue('ret');

    const result = await emailService.submissionConfirmation(
      form.id,
      submission.id,
      body,
      referer
    );
    expect(result).toEqual('ret');
    expect(formService.readForm).toHaveBeenCalledTimes(1);
    expect(formService.readForm).toHaveBeenCalledWith(form.id);
    expect(formService.readSubmission).toHaveBeenCalledTimes(1);
    expect(formService.readSubmission).toHaveBeenCalledWith(submission.id);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith(
      'sendSubmissionConfirmation',
      expect.objectContaining({
        bodyTemplate: 'submission-confirmation.html',
        title: `${form.name} Submission`,
        subject: `${form.name} Submission`,
        priority: 'normal',
        body,
        form,
      }),
      submission,
      referer
    );
  });

  it('submissionReceived should call send a submission email', async () => {
    formService.readForm = jest.fn().mockReturnValue(form);
    formService.readSubmission = jest.fn().mockReturnValue(submission);
    emailService._sendEmailTemplate = jest.fn().mockReturnValue('ret');

    const result = await emailService.submissionReceived(
      form.id,
      submission.id,
      referer
    );
    expect(result).toEqual('ret');
    expect(formService.readForm).toHaveBeenCalledTimes(1);
    expect(formService.readForm).toHaveBeenCalledWith(form.id);
    expect(formService.readSubmission).toHaveBeenCalledTimes(1);
    expect(formService.readSubmission).toHaveBeenCalledWith(submission.id);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledTimes(1);
    expect(form.submissionReceivedEmails).toBeInstanceOf(Array);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith(
      'sendSubmissionReceived',
      expect.objectContaining({
        bodyTemplate: 'submission-received-confirmation.html',
        title: `${form.name} Accepted`,
        subject: `${form.name} Accepted`,
        priority: 'normal',
        messageLinkText: `Please login to view the details of this ${form.name} submission`,
        form,
      }),
      submission,
      referer
    );
  });
});
