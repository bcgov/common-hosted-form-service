const { getMockReq, getMockRes } = require('@jest-mock/express');

const { Statuses } = require('../../../../src/forms/common/constants');
const controller = require('../../../../src/forms/submission/controller');
const formService = require('../../../../src/forms/form/service');
const emailService = require('../../../../src/forms/email/emailService');
const service = require('../../../../src/forms/submission/service');
const cdogsService = require('../../../../src/components/cdogsService');

describe('addStatus', () => {
  const req = {
    params: { formSubmissionId: '1' },
    body: { code: Statuses.ASSIGNED },
    currentUser: {},
    headers: { referer: 'a' },
  };

  it('should not call email service if no email specified', async () => {
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.changeStatusState = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusAssigned = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.changeStatusState).toBeCalledTimes(1);
    expect(emailService.statusAssigned).toBeCalledTimes(0);
  });

  it('should call email service if an email specified', async () => {
    req.body.assignmentNotificationEmail = 'a@a.com';
    req.body.revisionNotificationEmailContent = 'Email Content';
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.changeStatusState = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusAssigned = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.changeStatusState).toBeCalledTimes(1);
    expect(emailService.statusAssigned).toBeCalledTimes(1);
    expect(emailService.statusAssigned).toBeCalledWith('123', 1, 'a@a.com', 'Email Content', 'a');
  });

  it('should call statusRevising if email specified', async () => {
    req.body.submissionUserEmails = ['a@a.com'];
    req.body.revisionNotificationEmailContent = 'Email content';
    req.body.code = Statuses.REVISING;
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.changeStatusState = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusRevising = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.changeStatusState).toBeCalledTimes(1);
    expect(emailService.statusRevising).toBeCalledTimes(1);
    expect(emailService.statusRevising).toBeCalledWith('123', 1, ['a@a.com'], 'Email content', 'a');
  });

  it('should call statusCompleted if email specified', async () => {
    req.body.submissionUserEmails = ['a@a.com'];
    req.body.revisionNotificationEmailContent = 'Email Content';
    req.body.confirmCompleted = true;
    req.body.code = Statuses.COMPLETED;
    service.read = jest.fn().mockReturnValue({ form: { id: '123' } });
    service.changeStatusState = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusCompleted = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.changeStatusState).toBeCalledTimes(1);
    expect(emailService.statusCompleted).toBeCalledTimes(1);
    expect(emailService.statusCompleted).toBeCalledWith('123', 1, ['a@a.com'], 'Email Content', 'a');
  });
});

describe('template rendering', () => {
  // Define some valid request and response data. The repetition here, rather
  // than pulling data from other objects, is to improve readability.

  const validCdogsTemplate = {
    options: {
      convertTo: 'pdf',
      overwrite: true,
      reportName: 'template_hello_world',
    },
    template: {
      content: btoa('Hello {d.simpletextfield}!'),
      encodingType: 'base64',
      fileType: 'txt',
    },
  };

  const validSubmission = {
    submission: {
      confirmationId: '0763A618',
      id: '0763a618-de57-454b-99cc-3a7c5e992b77',
      submission: {
        data: {
          simpletextfield: 'firstName lastName',
          submit: true,
        },
      },
    },
    version: {
      version: 1,
    },
  };

  const validCdogsRequest = {
    data: {
      chefs: {
        confirmationId: '0763A618',
        formVersion: 1,
        submissionId: '0763a618-de57-454b-99cc-3a7c5e992b77',
      },
      simpletextfield: 'firstName lastName',
      submit: true,
    },
    options: {
      convertTo: 'pdf',
      overwrite: true,
      reportName: 'template_hello_world',
    },
    template: {
      content: btoa('Hello {d.simpletextfield}!'),
      encodingType: 'base64',
      fileType: 'txt',
    },
  };

  const validDocumentTemplate = {
    filename: 'template_hello_world.txt',
    template: btoa('Hello {d.simpletextfield}!'),
  };

  const mockCdogsResponse = {
    data: {},
    headers: {
      'content-disposition': 'attachment; filename=template_hello_world.pdf',
    },
    status: 200,
  };

  describe('draftTemplateUploadAndRender', () => {
    // A draft submission won't have an id or confirmationId.
    const validDraftSubmission = structuredClone(validSubmission);
    delete validDraftSubmission.submission.confirmationId;
    delete validDraftSubmission.submission.id;

    // A draft request won't have the custom "chefs" data.
    const validDraftCdogsRequest = structuredClone(validCdogsRequest);
    delete validDraftCdogsRequest.data.chefs;

    const validRequest = {
      body: {
        template: {
          ...validCdogsTemplate,
        },
        ...validDraftSubmission.submission,
      },
    };

    describe('error response when', () => {
      test('request is missing body', async () => {
        cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(mockCdogsResponse);
        const req = getMockReq();
        const { res, next } = getMockRes();

        await controller.draftTemplateUploadAndRender(req, res, next);

        expect(cdogsService.templateUploadAndRender).toBeCalledTimes(0);
        expect(res.send).toBeCalledTimes(0);
        expect(res.set).toBeCalledTimes(0);
        expect(res.status).toBeCalledTimes(0);
        expect(next).toBeCalledWith(expect.any(TypeError));
      });
    });

    describe('200 response when', () => {
      test('request is valid', async () => {
        cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(mockCdogsResponse);
        const req = getMockReq(validRequest);
        const { res, next } = getMockRes();

        await controller.draftTemplateUploadAndRender(req, res, next);

        expect(cdogsService.templateUploadAndRender).toBeCalledTimes(1);
        expect(cdogsService.templateUploadAndRender).toBeCalledWith(validDraftCdogsRequest);
        expect(res.send).toBeCalledTimes(1);
        expect(res.set).toBeCalledWith(
          expect.objectContaining({
            'Content-Disposition': 'attachment; filename=template_hello_world.pdf',
          })
        );
        expect(res.status).toBeCalledWith(200);
      });

      test('cdogs response has no content disposition', async () => {
        const cdogsResponse = structuredClone(mockCdogsResponse);
        delete cdogsResponse.headers['content-disposition'];
        cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(cdogsResponse);
        const req = getMockReq(validRequest);
        const { res, next } = getMockRes();

        await controller.draftTemplateUploadAndRender(req, res, next);

        expect(cdogsService.templateUploadAndRender).toBeCalledTimes(1);
        expect(cdogsService.templateUploadAndRender).toBeCalledWith(validDraftCdogsRequest);
        expect(res.send).toBeCalledTimes(1);
        expect(res.set).toBeCalledWith(
          expect.objectContaining({
            'Content-Disposition': 'attachment',
          })
        );
        expect(res.status).toBeCalledWith(200);
      });
    });
  });

  describe('templateRender', () => {
    const validRequest = {
      body: {
        ...validCdogsTemplate,
      },
      params: {
        formSubmissionId: validSubmission.submission.id,
      },
    };

    describe('error response when', () => {
      test('unsuccessful service call', async () => {
        const error = new Error();
        service.read = jest.fn().mockRejectedValue(error);
        cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(mockCdogsResponse);
        const req = getMockReq(validRequest);
        const { res, next } = getMockRes();

        await controller.templateRender(req, res, next);

        expect(cdogsService.templateUploadAndRender).toBeCalledTimes(0);
        expect(res.send).toBeCalledTimes(0);
        expect(res.set).toBeCalledTimes(0);
        expect(res.status).toBeCalledTimes(0);
        expect(next).toBeCalledWith(error);
      });
    });

    describe('200 response when', () => {
      test('request is valid', async () => {
        service.read = jest.fn().mockReturnValue(validSubmission);
        formService.documentTemplateRead = jest.fn().mockReturnValue(validDocumentTemplate);
        cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(mockCdogsResponse);
        const req = getMockReq(validRequest);
        const { res, next } = getMockRes();

        await controller.templateRender(req, res, next);

        expect(cdogsService.templateUploadAndRender).toBeCalledTimes(1);
        expect(cdogsService.templateUploadAndRender).toBeCalledWith(validCdogsRequest);
        expect(res.send).toBeCalledTimes(1);
        expect(res.set).toBeCalledWith(
          expect.objectContaining({
            'Content-Disposition': 'attachment; filename=template_hello_world.pdf',
          })
        );
        expect(res.status).toBeCalledWith(200);
      });

      test('cdogs response has no content disposition', async () => {
        service.read = jest.fn().mockReturnValue(validSubmission);
        formService.documentTemplateRead = jest.fn().mockReturnValue(validDocumentTemplate);
        const cdogsResponse = structuredClone(mockCdogsResponse);
        delete cdogsResponse.headers['content-disposition'];
        cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(cdogsResponse);
        const req = getMockReq(validRequest);
        const { res, next } = getMockRes();

        await controller.templateRender(req, res, next);

        expect(cdogsService.templateUploadAndRender).toBeCalledTimes(1);
        expect(cdogsService.templateUploadAndRender).toBeCalledWith(validCdogsRequest);
        expect(res.send).toBeCalledTimes(1);
        expect(res.set).toBeCalledWith(
          expect.objectContaining({
            'Content-Disposition': 'attachment',
          })
        );
        expect(res.status).toBeCalledWith(200);
      });
    });
  });

  describe('templateUploadAndRender', () => {
    const validRequest = {
      body: {
        ...validCdogsTemplate,
      },
      params: {
        formSubmissionId: validSubmission.submission.id,
      },
    };

    describe('error response when', () => {
      test('unsuccessful service call', async () => {
        const error = new Error();
        service.read = jest.fn().mockRejectedValue(error);
        cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(mockCdogsResponse);
        const req = getMockReq(validRequest);
        const { res, next } = getMockRes();

        await controller.templateUploadAndRender(req, res, next);

        expect(cdogsService.templateUploadAndRender).toBeCalledTimes(0);
        expect(res.send).toBeCalledTimes(0);
        expect(res.set).toBeCalledTimes(0);
        expect(res.status).toBeCalledTimes(0);
        expect(next).toBeCalledWith(error);
      });
    });

    describe('200 response when', () => {
      test('request is valid', async () => {
        service.read = jest.fn().mockReturnValue(validSubmission);
        cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(mockCdogsResponse);
        const req = getMockReq(validRequest);
        const { res, next } = getMockRes();

        await controller.templateUploadAndRender(req, res, next);

        expect(cdogsService.templateUploadAndRender).toBeCalledTimes(1);
        expect(cdogsService.templateUploadAndRender).toBeCalledWith(validCdogsRequest);
        expect(res.send).toBeCalledTimes(1);
        expect(res.set).toBeCalledWith(
          expect.objectContaining({
            'Content-Disposition': 'attachment; filename=template_hello_world.pdf',
          })
        );
        expect(res.status).toBeCalledWith(200);
      });

      test('cdogs response has no content disposition', async () => {
        service.read = jest.fn().mockReturnValue(validSubmission);
        const cdogsResponse = structuredClone(mockCdogsResponse);
        delete cdogsResponse.headers['content-disposition'];
        cdogsService.templateUploadAndRender = jest.fn().mockReturnValue(cdogsResponse);
        const req = getMockReq(validRequest);
        const { res, next } = getMockRes();

        await controller.templateUploadAndRender(req, res, next);

        expect(cdogsService.templateUploadAndRender).toBeCalledTimes(1);
        expect(cdogsService.templateUploadAndRender).toBeCalledWith(validCdogsRequest);
        expect(res.send).toBeCalledTimes(1);
        expect(res.set).toBeCalledWith(
          expect.objectContaining({
            'Content-Disposition': 'attachment',
          })
        );
        expect(res.status).toBeCalledWith(200);
      });
    });
  });
});

describe('deleteMultipleSubmissions', () => {
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
  it('should call deleteMultipleSubmissions service in controller', async () => {
    service.deleteMultipleSubmissions = jest.fn().mockReturnValue(returnValue);
    await controller.deleteMultipleSubmissions(req, {}, jest.fn());

    expect(service.deleteMultipleSubmissions).toBeCalledTimes(1);
    expect(service.deleteMultipleSubmissions).toBeCalledWith(req.body.submissionIds, req.currentUser);
  });
});

describe('restoreMultipleSubmissions', () => {
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
  it('should call restoreMultipleSubmissions service in controller', async () => {
    service.restoreMultipleSubmissions = jest.fn().mockReturnValue(returnValue);
    await controller.restoreMultipleSubmissions(req, {}, jest.fn());

    expect(service.restoreMultipleSubmissions).toBeCalledTimes(1);
    expect(service.restoreMultipleSubmissions).toBeCalledWith(req.body.submissionIds, req.currentUser);
  });
});
