const chesService = require('../../../../src/components/chesService');
const emailService = require('../../../../src/forms/email/emailService');
const formService = require('../../../../src/forms/form/service');

const referer = 'https://chefs.nrs.gov.bc.ca';

describe('_appUrl', () => {

  it('should format the url', () => {
    expect(emailService._appUrl('https://chefs-dev.apps.silver.devops.gov.bc.ca/pr-139/form/success?s=13978f3b-056b-4022-9a30-60d3b63ec459')).toEqual('https://chefs-dev.apps.silver.devops.gov.bc.ca/pr-139');
    expect(emailService._appUrl('https://chefs.nrs.gov.bc.ca/app/form/success?s=13978f3b-056b-4022-9a30-60d3b63ec459')).toEqual('https://chefs.nrs.gov.bc.ca/app');
  });

  it('should rethrow exceptions', () => {
    expect(() => emailService._appUrl('notaurl')).toThrow('Invalid URL: notaurl');
  });

});

describe('_sendStatusAssigned', () => {
  const assignmentNotificationEmail = 'a@a.com';
  const submission = {
    confirmationId: 'abc',
    id: '123'
  };

  it('should call chesService to send an email', async () => {
    chesService.merge = jest.fn().mockReturnValue('sent');

    const result = await emailService._sendStatusAssigned(assignmentNotificationEmail, submission, referer);
    expect(result).toBeTruthy();
    expect(chesService.merge).toHaveBeenCalledTimes(1);
  });


});

describe('_sendSubmissionConfirmation', () => {
  const form = {
    showSubmissionConfirmation: true,
    name: '123'
  };
  const submission = {
    confirmationId: 'abc',
    id: '123'
  };
  const body = { to: 'a@b.com' };

  it('should call chesService to send an email', async () => {
    chesService.merge = jest.fn().mockReturnValue('sent');

    const result = await emailService._sendSubmissionConfirmation(form, submission, body, referer);
    expect(result).toBeTruthy();
    expect(chesService.merge).toHaveBeenCalledTimes(1);
  });

  it('should not call chesService if the flag is false', async () => {
    form.showSubmissionConfirmation = false;
    chesService.merge = jest.fn().mockReturnValue('sent');

    await emailService._sendSubmissionConfirmation(form, submission, body, referer);
    expect(chesService.merge).toHaveBeenCalledTimes(0);
  });
});

describe('_sendSubmissionReceived', () => {
  const form = {
    submissionReceivedEmails: ['a@c.com', 'd@f.com'],
    name: 'xyz',
    id: '456'
  };
  const submission = {
    confirmationId: 'abc',
    id: '123'
  };

  it('should call chesService to send an email', async () => {
    chesService.merge = jest.fn().mockReturnValue('sent');

    const result = await emailService._sendSubmissionReceived(form, submission, referer);
    expect(result).toBeTruthy();
    expect(chesService.merge).toHaveBeenCalledTimes(1);
  });

  it('should not call chesService if there are no emails', async () => {
    form.submissionReceivedEmails = undefined;
    chesService.merge = jest.fn().mockReturnValue('sent');

    await emailService._sendSubmissionReceived(form, submission, referer);
    expect(chesService.merge).toHaveBeenCalledTimes(0);
  });

  it('should not call chesService if there is a blank array', async () => {
    form.submissionReceivedEmails = [];
    chesService.merge = jest.fn().mockReturnValue('sent');

    await emailService._sendSubmissionReceived(form, submission, referer);
    expect(chesService.merge).toHaveBeenCalledTimes(0);
  });
});

describe('public methods', () => {
  const currentStatus = {
    submissionId: '456'
  };
  const form = {
    id: 'xxx-yyy',
    showSubmissionConfirmation: true,
    name: '123'
  };
  const submission = {
    confirmationId: 'abc',
    id: '123'
  };
  const assignmentNotificationEmail = 'x@y.com';
  const body = { to: 'a@b.com' };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('statusAssigned should call send a status email', async () => {
    formService.readSubmission = jest.fn().mockReturnValue(submission);
    emailService._sendStatusAssigned = jest.fn().mockReturnValue('ret');

    const result = await emailService.statusAssigned(currentStatus, assignmentNotificationEmail, referer);
    expect(result).toEqual('ret');
    expect(formService.readSubmission).toHaveBeenCalledTimes(1);
    expect(formService.readSubmission).toHaveBeenCalledWith(currentStatus.submissionId);
    expect(emailService._sendStatusAssigned).toHaveBeenCalledTimes(1);
    expect(emailService._sendStatusAssigned).toHaveBeenCalledWith(assignmentNotificationEmail, submission, referer);
  });

  it('submissionConfirmation should call send a conf email', async () => {
    formService.readForm = jest.fn().mockReturnValue(form);
    formService.readSubmission = jest.fn().mockReturnValue(submission);
    emailService._sendSubmissionConfirmation = jest.fn().mockReturnValue('ret');

    const result = await emailService.submissionConfirmation(form.id, submission.id, body, referer);
    expect(result).toEqual('ret');
    expect(formService.readForm).toHaveBeenCalledTimes(1);
    expect(formService.readForm).toHaveBeenCalledWith(form.id);
    expect(formService.readSubmission).toHaveBeenCalledTimes(1);
    expect(formService.readSubmission).toHaveBeenCalledWith(submission.id);
    expect(emailService._sendSubmissionConfirmation).toHaveBeenCalledTimes(1);
    expect(emailService._sendSubmissionConfirmation).toHaveBeenCalledWith(form, submission, body, referer);
  });

  it('submissionReceived should call send a submission email', async () => {
    formService.readForm = jest.fn().mockReturnValue(form);
    formService.readSubmission = jest.fn().mockReturnValue(submission);
    emailService._sendSubmissionReceived = jest.fn().mockReturnValue('ret');

    const result = await emailService.submissionReceived(form.id, submission.id, referer);
    expect(result).toEqual('ret');
    expect(formService.readForm).toHaveBeenCalledTimes(1);
    expect(formService.readForm).toHaveBeenCalledWith(form.id);
    expect(formService.readSubmission).toHaveBeenCalledTimes(1);
    expect(formService.readSubmission).toHaveBeenCalledWith(submission.id);
    expect(emailService._sendSubmissionReceived).toHaveBeenCalledTimes(1);
    expect(emailService._sendSubmissionReceived).toHaveBeenCalledWith(form, submission, referer);
  });
});
