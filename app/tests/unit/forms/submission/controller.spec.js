const controller = require('../../../../src/forms/submission/controller');
const emailService = require('../../../../src/forms/email/emailService');
const service = require('../../../../src/forms/submission/service');

describe('addStatus', () => {

  const req = {
    params: { formSubmissionId: '1' }, body: {}, currentUser: {}, headers: { referer: 'a' }
  };
  it('should not call email service if no email specified', async () => {
    service.createStatus = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusAssigned = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.createStatus).toHaveBeenCalledTimes(1);
    expect(emailService.statusAssigned).toHaveBeenCalledTimes(0);
  });

  it('should call email service if an email specified', async () => {
    req.body.assignmentNotificationEmail = 'a@a.com';
    service.createStatus = jest.fn().mockReturnValue([1, 2, 3]);
    emailService.statusAssigned = jest.fn().mockReturnValue(true);
    await controller.addStatus(req, {}, jest.fn());

    expect(service.createStatus).toHaveBeenCalledTimes(1);
    expect(emailService.statusAssigned).toHaveBeenCalledTimes(1);
    expect(emailService.statusAssigned).toHaveBeenCalledWith(1, 'a@a.com', 'a');
  });
});
