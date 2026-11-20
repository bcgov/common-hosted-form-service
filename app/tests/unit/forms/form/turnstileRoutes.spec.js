const { Router } = require('express');
const request = require('supertest');
const { v4: uuid } = require('uuid');

const { expressHelper } = require('../../../common/helper');
const userAccess = require('../../../../src/forms/auth/middleware/userAccess');
const controller = require('../../../../src/forms/form/turnstile/controller');

const pass = (_req, _res, next) => next();
const authenticate = jest.spyOn(userAccess, 'currentUser').mockImplementation(pass);
const formPermissions = jest.fn(pass);
const submissionPermissions = jest.fn(pass);
jest.spyOn(userAccess, 'hasFormPermissions').mockReturnValue(formPermissions);
jest.spyOn(userAccess, 'hasSubmissionPermissions').mockReturnValue(submissionPermissions);

const readStatus = jest.spyOn(controller, 'readStatus').mockImplementation((_req, res) => res.sendStatus(200));
const verifyChallenge = jest.spyOn(controller, 'verifyChallenge').mockImplementation((_req, res) => res.sendStatus(204));
const readSubmissionStatus = jest.spyOn(controller, 'readSubmissionStatus').mockImplementation((_req, res) => res.sendStatus(200));
const verifySubmissionChallenge = jest.spyOn(controller, 'verifySubmissionChallenge').mockImplementation((_req, res) => res.sendStatus(204));

const router = Router();
router.use('/forms', require('../../../../src/forms/form/routes'));
router.use('/submissions', require('../../../../src/forms/submission/routes'));
const app = request(expressHelper('/', router));

it('limits verification across both route families before authentication and leaves the status budget available', async () => {
  const formPath = `/forms/${uuid()}/turnstile`;
  const submissionPath = `/submissions/${uuid()}/turnstile`;

  for (let count = 0; count < 15; count += 1) {
    const path = count % 2 === 0 ? formPath : submissionPath;
    await app.post(path).expect(204);
  }
  for (const path of [formPath, submissionPath]) {
    const response = await app.post(path).expect(429);
    expect(response.headers['retry-after']).toBeDefined();
  }
  expect(authenticate).toHaveBeenCalledTimes(15);
  expect(formPermissions).toHaveBeenCalledTimes(8);
  expect(submissionPermissions).toHaveBeenCalledTimes(7);
  expect(verifyChallenge).toHaveBeenCalledTimes(8);
  expect(verifySubmissionChallenge).toHaveBeenCalledTimes(7);

  for (let count = 0; count < 60; count += 1) {
    const path = count % 2 === 0 ? formPath : submissionPath;
    await app.get(path).expect(200);
  }
  for (const path of [formPath, submissionPath]) {
    await app.get(path).expect(429);
  }
  expect(authenticate).toHaveBeenCalledTimes(75);
  expect(readStatus).toHaveBeenCalledTimes(30);
  expect(readSubmissionStatus).toHaveBeenCalledTimes(30);
});
