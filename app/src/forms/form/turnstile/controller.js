const authService = require('../../auth/service');
const formService = require('../service');
const service = require('./service');

const loadForm = (req) => formService.readFormIdentityProviders(req.params.formId);
const loadSubmissionForm = async (req) => (await authService.getSubmissionForm(req.params.formSubmissionId)).form;

async function readStatus(req, res, next, getForm = loadForm) {
  try {
    res.set('Cache-Control', 'no-store');
    const form = await getForm(req);
    res.json(await service.readStatus(req, form));
  } catch (error) {
    next(error);
  }
}

async function verifyChallenge(req, res, next, getForm = loadForm) {
  try {
    res.set('Cache-Control', 'no-store');
    const form = await getForm(req);
    const cookie = await service.verifyChallenge(req, form);
    if (cookie) res.cookie(cookie.name, cookie.value, cookie.options);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  readStatus,
  verifyChallenge,
  readSubmissionStatus: (req, res, next) => readStatus(req, res, next, loadSubmissionForm),
  verifySubmissionChallenge: (req, res, next) => verifyChallenge(req, res, next, loadSubmissionForm),
};
