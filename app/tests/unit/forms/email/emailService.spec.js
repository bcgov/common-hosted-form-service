const { MockModel, MockTransaction } = require('../../../common/dbHelper');

jest.mock(
  '../../../../src/forms/common/models/tables/form',
  () => MockModel
);
jest.mock(
  '../../../../src/forms/common/models/tables/formSubmission',
  () => MockModel
);

const chesService = require('../../../../src/components/chesService');
const emailService = require('../../../../src/forms/email/emailService');
const fs = require('fs');
const mockedReadFileSync = jest.spyOn(fs, 'readFileSync');

const referer = 'https://chefs.nrs.gov.bc.ca';

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

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
      'Invalid URL'
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
      submissionReceivedEmails: ['x@y.com', 'a@b.com'],
    },
  };

  beforeEach(() => {
    mockedReadFileSync
      .mockReturnValueOnce('<!-- BODY END -->')
      .mockReturnValueOnce('<h1>New Body</h1>');
  });

  afterEach(() => {
    mockedReadFileSync.mockRestore();
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
  });
});

describe('public methods', () => {
  const currentStatus = {
    submissionId: '456',
    formSubmissionId: '123',
  };
  const form = {
    id: 'xxx-yyy',
    showSubmissionConfirmation: true,
    name: '123',
    submissionReceivedEmails: ['a@b.com','z@y.com'],
    identityProviders: [
      {
        idp: 'public',
      }
    ],
  };
  const submission = {
    confirmationId: 'abc',
    id: '123',
  };
  const assignmentNotificationEmail = 'x@y.com';
  const body = { to: 'a@b.com' };
  const emailContent = 'Email Content';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('statusAssigned should call send a status email', async () => {
    let mockQuery = jest.spyOn(emailService, 'readForm');
    mockQuery.mockImplementation(() => form);
    let mockSubmission = jest.spyOn(emailService, 'readSubmission');
    mockSubmission.mockImplementation(() => submission);
    emailService._sendEmailTemplate = jest.fn().mockReturnValue('ret');
    const result = await emailService.statusAssigned(
      '123',
      currentStatus,
      assignmentNotificationEmail,
      emailContent,
      referer
    );
    const configData = {
      bodyTemplate: 'send-status-assigned-email-body.html',
      title: `${form.name} Submission Assignment`,
      subject: 'Form Submission Assignment',
      messageLinkText: `You have been assigned to a ${form.name} submission. Please login to review it.`,
      priority: 'normal',
      form,
    };

    const contexts = [{
      context: {
        allFormSubmissionUrl: 'https://user/submissions?f=xxx-yyy',
        confirmationNumber: 'abc',
        form: form,
        messageLinkText: 'You have been assigned to a 123 submission. Please login to review it.',
        messageLinkUrl: 'https://form/view?s=123',
        emailContent: 'Email Content',
        title: '123 Submission Assignment'
      },
      to: ['x@y.com']
    }];

    expect(result).toEqual('ret');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockSubmission).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith(configData, contexts);
    mockQuery.mockRestore();
    mockSubmission.mockRestore();
  });

  it('statusRevising should send a status email', async () => {
    let mockQuery = jest.spyOn(emailService, 'readForm');
    mockQuery.mockImplementation(() => form);
    let mockSubmission = jest.spyOn(emailService, 'readSubmission');
    mockSubmission.mockImplementation(() => submission);
    emailService._sendEmailTemplate = jest.fn().mockReturnValue('ret');
    const result = await emailService.statusRevising(
      '123',
      currentStatus,
      assignmentNotificationEmail,
      emailContent,
      referer
    );
    const configData = {
      bodyTemplate: 'send-status-revising-email-body.html',
      title: `${form.name} Submission Revision Requested`,
      subject: 'Form Submission Revision Request',
      messageLinkText: `You have been asked to revise a ${form.name} submission. Please login to review it.`,
      priority: 'normal',
      form,
    };

    const contexts = [{
      context: {
        allFormSubmissionUrl: 'https://user/submissions?f=xxx-yyy',
        confirmationNumber: 'abc',
        form: form,
        messageLinkText: `You have been asked to revise a ${form.name} submission. Please login to review it.`,
        messageLinkUrl: `https://user/view?s=${form.name}`,
        emailContent: 'Email Content',
        title: `${form.name} Submission Revision Requested`
      },
      to: ['x@y.com']
    }];

    expect(result).toEqual('ret');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockSubmission).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith(configData, contexts);
    mockQuery.mockRestore();
    mockSubmission.mockRestore();
  });

  it('statusCompleted should send a status email', async () => {
    let mockQuery = jest.spyOn(emailService, 'readForm');
    mockQuery.mockImplementation(() => form);
    let mockSubmission = jest.spyOn(emailService, 'readSubmission');
    mockSubmission.mockImplementation(() => submission);
    emailService._sendEmailTemplate = jest.fn().mockReturnValue('ret');
    const result = await emailService.statusCompleted(
      '123',
      currentStatus,
      assignmentNotificationEmail,
      emailContent,
      referer
    );
    const configData = {
      bodyTemplate: 'submission-completed.html',
      title: `${form.name} Has Been Completed`,
      subject: 'Form Has Been Completed',
      messageLinkText: `Your submission from ${form.name} has been Completed.`,
      priority: 'normal',
      form,
    };

    const contexts = [{
      context: {
        allFormSubmissionUrl: 'https://user/submissions?f=xxx-yyy',
        confirmationNumber: 'abc',
        form: form,
        messageLinkText: `Your submission from ${form.name} has been Completed.`,
        messageLinkUrl: `https://user/view?s=${form.name}`,
        emailContent: 'Email Content',
        title: `${form.name} Has Been Completed`
      },
      to: ['x@y.com']
    }];

    expect(result).toEqual('ret');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockSubmission).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith(configData, contexts);
    mockQuery.mockRestore();
    mockSubmission.mockRestore();
  });

  it('submissionConfirmation should call send a conf email', async () => {
    let mockQuery = jest.spyOn(emailService, 'readForm');
    mockQuery.mockImplementation(() => form);
    let mockSubmission = jest.spyOn(emailService, 'readSubmission');
    mockSubmission.mockImplementation(() => submission);
    emailService._sendEmailTemplate = jest.fn().mockReturnValue('ret');

    const result = await emailService.submissionConfirmation(
      form.id,
      submission.id,
      body,
      referer
    );

    const configData = {
      bodyTemplate: 'submission-received-confirmation-public.html',
      subject: `${form.name} Accepted`,
      priority: 'normal',
      messageLinkText: `Thank you for your ${form.name} submission. You can view your submission details by visiting the following links:`,
      title: `${form.name} Accepted`,
      form,
    };

    const contexts = [{
      context: {
        allFormSubmissionUrl: 'https://user/submissions?f=xxx-yyy',
        confirmationNumber: 'abc',
        form: form,
        messageLinkText: `Thank you for your ${form.name} submission. You can view your submission details by visiting the following links:`,
        messageLinkUrl: `https://form/success?s=${form.name}`,
        revisionNotificationEmailContent: undefined,
        title: `${form.name} Accepted`
      },
      to: ['a@b.com']
    }];

    expect(result).toEqual('ret');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockSubmission).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith(configData, contexts);
    mockQuery.mockRestore();
    mockSubmission.mockRestore();
  });

  it('submissionReceived should call send a submission email', async () => {
    let mockQuery = jest.spyOn(emailService, 'readForm');
    mockQuery.mockImplementation(() => form);
    let mockSubmission = jest.spyOn(emailService, 'readSubmission');
    mockSubmission.mockImplementation(() => submission);
    emailService._sendEmailTemplate = jest.fn().mockReturnValue('ret');

    const result = await emailService.submissionReceived(
      form.id,
      submission.id,
      body,
      referer
    );

    const configData = {
      bodyTemplate: 'submission-confirmation.html',
      title: `${form.name} Submission`,
      subject: `${form.name} Submission`,
      messageLinkText: `There is a new ${form.name} submission. Please login to review it.`,
      priority: 'normal',
      body,
      form,
    };

    const contexts = [{
      context: {
        allFormSubmissionUrl: 'https://user/submissions?f=xxx-yyy',
        confirmationNumber: 'abc',
        form: form,
        messageLinkText: `There is a new ${form.name} submission. Please login to review it.`,
        messageLinkUrl: `https://form/view?s=${form.name}`,
        revisionNotificationEmailContent: undefined,
        title: `${form.name} Submission`
      },
      to: ['a@b.com', 'z@y.com']
    }];

    expect(result).toEqual('ret');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockSubmission).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledTimes(1);
    expect(form.submissionReceivedEmails).toBeInstanceOf(Array);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith(configData, contexts);
    mockQuery.mockRestore();
    mockSubmission.mockRestore();
  });

  it('submissionUnassigned should send a uninvited email', async () => {
    let mockQuery = jest.spyOn(emailService, 'readForm');
    mockQuery.mockImplementation(() => form);
    let mockSubmission = jest.spyOn(emailService, 'readSubmission');
    mockSubmission.mockImplementation(() => submission);
    emailService._sendEmailTemplate = jest.fn().mockReturnValue('ret');

    const result = await emailService.submissionUnassigned(
      form.id,
      currentStatus,
      assignmentNotificationEmail,
      referer
    );

    const configData = {
      bodyTemplate: 'submission-unassigned.html',
      title: `Uninvited From ${form.name} Draft`,
      subject: 'Uninvited From Submission Draft',
      messageLinkText: `You have been uninvited from ${form.name} submission draft.`,
      priority: 'normal',
      form,
    };

    const contexts = [{
      context: {
        allFormSubmissionUrl: 'https://user/submissions?f=xxx-yyy',
        confirmationNumber: 'abc',
        form: form,
        messageLinkText: `You have been uninvited from ${form.name} submission draft.`,
        messageLinkUrl: `https://user/view?s=${form.name}`,
        revisionNotificationEmailContent: undefined,
        title: `Uninvited From ${form.name} Draft`
      },
      to: ['x@y.com']
    }];

    expect(result).toEqual('ret');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockSubmission).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith(configData, contexts);
    mockQuery.mockRestore();
    mockSubmission.mockRestore();
  });

  it('submissionAssigned should send a uninvited email', async () => {
    let mockQuery = jest.spyOn(emailService, 'readForm');
    mockQuery.mockImplementation(() => form);
    let mockSubmission = jest.spyOn(emailService, 'readSubmission');
    mockSubmission.mockImplementation(() => submission);
    emailService._sendEmailTemplate = jest.fn().mockReturnValue('ret');

    const result = await emailService.submissionAssigned(
      form.id,
      currentStatus,
      assignmentNotificationEmail,
      referer
    );

    const configData = {
      bodyTemplate: 'submission-assigned.html',
      title: `Invited to ${form.name} Draft`,
      subject: 'Invited to Submission Draft',
      messageLinkText: `You have been invited to a ${form.name} submission draft. You can review your submission draft details by visiting the following links:`,
      priority: 'normal',
      form,
    };

    const contexts = [{
      context: {
        allFormSubmissionUrl: 'https://user/submissions?f=xxx-yyy',
        confirmationNumber: 'abc',
        form: form,
        messageLinkText: `You have been invited to a ${form.name} submission draft. You can review your submission draft details by visiting the following links:`,
        messageLinkUrl: `https://user/view?s=${form.name}`,
        revisionNotificationEmailContent: undefined,
        title: `Invited to ${form.name} Draft`
      },
      to: ['x@y.com']
    }];

    expect(result).toEqual('ret');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockSubmission).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith(configData, contexts);
    mockQuery.mockRestore();
    mockSubmission.mockRestore();
  });

  it('submissionsExportReady should send a submissions export ready email', async () => {
    const reservation = {
      id: '0',
      fileId: '0',
    };
    let mockQuery = jest.spyOn(emailService, 'readForm');
    mockQuery.mockImplementation(() => form);
    emailService._sendEmailTemplate = jest.fn().mockReturnValue('ret');

    const result = await emailService.submissionsExportReady(
      form.id,
      reservation,
      body,
      referer
    );

    const configData = {
      bodyTemplate: 'file-download-ready.html',
      title: `${form.name} submissions export`,
      subject: `${form.name} submissions export`,
      priority: 'normal',
      messageLinkText: 'You can download your submissions exports by visiting the following links:',
      form,
    };

    const contexts = [{
      context: {
        form: configData.form,
        messageLinkText: configData.messageLinkText,
        messageLinkUrl: `https://file/download?id=${reservation.fileId}`,
        title: configData.title
      },
      to: ['a@b.com']
    }];

    expect(result).toEqual('ret');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledTimes(1);
    expect(emailService._sendEmailTemplate).toHaveBeenCalledWith(configData, contexts);

    mockQuery.mockRestore();
  });
});
