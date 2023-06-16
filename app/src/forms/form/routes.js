const config = require('config');
const routes = require('express').Router();
const middleware = require('../common/middleware');
const apiAccess = require('../auth/middleware/apiAccess');
const { currentUser, hasFormPermissions } = require('../auth/middleware/userAccess');
const P = require('../common/constants').Permissions;

const keycloak = require('../../components/keycloak');
const controller = require('./controller');

routes.use(currentUser);

/**
 * @openapi
 * forms/:
 *  get:
 *    tags:
 *      - Forms
 *    description: Get All Forms
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    format: uuid
 *                    description: ID of the form
 *                  name:
 *                    type: string
 *                    example: Ministry Survey
 *                    description: Name of the form
 *                  description:
 *                    type: string
 *                    example: ''
 *                    description: A summary of the form
 *                  active:
 *                    type: boolean
 *                    example: true,
 *                    description: This is used to determine if the form is deleted. A value of false means the form is deleted
 *                  label:
 *                    type: string
 *                    example: ''
 *                  createdBy:
 *                    type: string
 *                    description: The username of the user that created this form
 *                    example: 'ADOGE@idir'
 *                  createdAt:
 *                    type: string
 *                    format: timestamp
 *                    description: The timestamp the form was created
 *                    example: 2023-06-04T02:46:50.983Z
 *                  updatedBy:
 *                    type: string
 *                    description: The username of the latest user that updated the form,
 *                    example: 'ADOGE@idir'
 *                  updatedAt:
 *                    type: string
 *                    format: timestamp
 *                    description: The timestamp the form was last updated
 *                    example: 2023-05-28T01:48:04.363Z
 *                  showSubmissionConfirmation:
 *                    type: boolean
 *                    example: true
 *                    description: ''
 *                  submissionReceivedEmails:
 *                    type: array
 *                    example: []
 *                  enableStatusUpdates:
 *                    type: boolean
 *                    example: true
 *                    description: Enables or disables form reviewers from updating this form status (i.e. Submitted, Assigned, Completed)
 *                  enableSubmitterDraft:
 *                    type: boolean
 *                    example: true
 *                    description: Enables or disables form submitters from saving or editing this form draft
 *                  schedule:
 *                    type: object
 *                    example: {}
 *                  reminder_enabled:
 *                    type: boolean
 *                    example: true
 *                    description: Enables or disables form submission reminder
 *                  enableCopyExistingSubmission:
 *                    type: boolean
 *                    example: true
 *                    description: Enables or disables form copying of existing submission
 *                  allowSubmitterToUploadFile:
 *                    type: boolean
 *                    example: true
 *                    description: If enabled, submitters can upload files with their submissions
 *                  identityProviders:
 *                    type: array
 *                    example: ['idir', 'Bceid']
 *                    description: List of identity providers that can be used to login to the form
 *                  versions:
 *                    type: array
 *                    example: [id: '33707cbd-7e69-4c66-bd2e-88596896a670', formId: '306040aa-c045-46d9-8a5a-78bd6fc7c644', version: 2, published: true, createdBy: 'AIDOWU@idir', createdAt: '2023-05-18T20:11:41.329Z', updatedBy: null, updatedAt: '2023-05-18T20:11:41.241Z']
 *                    description: List of form versions
 *                  snake:
 *                    type: string
 *                    example: Ministry Survey
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.get('/', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.listForms(req, res, next);
});

routes.post('/', async (req, res, next) => {
  await controller.createForm(req, res, next);
});

routes.get('/:formId', apiAccess, hasFormPermissions(P.FORM_READ), async (req, res, next) => {
  await controller.readForm(req, res, next);
});

routes.get('/:formId/export', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.export(req, res, next);
});

routes.post('/:formId/export/fields', middleware.publicRateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.exportWithFields(req, res, next);
});

routes.get('/:formId/options', async (req, res, next) => {
  await controller.readFormOptions(req, res, next);
});

routes.get('/:formId/version', apiAccess, hasFormPermissions(P.FORM_READ), async (req, res, next) => {
  await controller.readPublishedForm(req, res, next);
});

routes.put('/:formId', apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.updateForm(req, res, next);
});

routes.delete('/:formId', apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_DELETE]), async (req, res, next) => {
  await controller.deleteForm(req, res, next);
});

routes.get('/:formId/submissions', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.listFormSubmissions(req, res, next);
});

// routes.post('/:formId/versions', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
//   next(new Problem(410, { detail: 'This method is deprecated, use /forms/id/drafts to create form versions.' }));
// });

routes.get('/:formId/versions/:formVersionId', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readVersion(req, res, next);
});

routes.get('/:formId/versions/:formVersionId/fields', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readVersionFields(req, res, next);
});
// routes.put('/:formId/versions/:formVersionId', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
//   next(new Problem(410, { detail: 'This method is deprecated, use /forms/id/drafts to modify form versions.' }));
// });
routes.post('/:formId/versions/:formVersionId/publish', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.publishVersion(req, res, next);
});

routes.get('/:formId/versions/:formVersionId/submissions', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.listSubmissions(req, res, next);
});

routes.post('/:formId/versions/:formVersionId/submissions', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_CREATE]), async (req, res, next) => {
  await controller.createSubmission(req, res, next);
});

routes.post(
  '/:formId/versions/:formVersionId/multiSubmission',
  middleware.publicRateLimiter,
  apiAccess,
  hasFormPermissions([P.FORM_READ, P.SUBMISSION_CREATE]),
  async (req, res, next) => {
    await controller.createMultiSubmission(req, res, next);
  }
);

routes.get('/:formId/versions/:formVersionId/submissions/discover', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), (req, res, next) => {
  controller.listSubmissionFields(req, res, next);
});

// routes.get('/:formId/versions/:formVersionId/submissions/:formSubmissionId', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
//   next(new Problem(410, { detail: 'This method is deprecated, use /submissions to read a submission.' }));
// });

// routes.put('/:formId/versions/:formVersionId/submissions/:formSubmissionId', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
//   next(new Problem(410, { detail: 'This method is deprecated, use /submissions to modify a submission.' }));
// });

routes.get('/:formId/drafts', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_READ]), async (req, res, next) => {
  await controller.listDrafts(req, res, next);
});

routes.post('/:formId/drafts', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.createDraft(req, res, next);
});

routes.get('/:formId/drafts/:formVersionDraftId', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_READ]), async (req, res, next) => {
  await controller.readDraft(req, res, next);
});

routes.put('/:formId/drafts/:formVersionDraftId', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_UPDATE]), async (req, res, next) => {
  await controller.updateDraft(req, res, next);
});

routes.delete('/:formId/drafts/:formVersionDraftId', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_DELETE]), async (req, res, next) => {
  await controller.deleteDraft(req, res, next);
});

routes.post('/:formId/drafts/:formVersionDraftId/publish', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.publishDraft(req, res, next);
});

routes.get('/:formId/statusCodes', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.getStatusCodes(req, res, next);
});

routes.get('/:formId/apiKey', hasFormPermissions(P.FORM_API_READ), async (req, res, next) => {
  await controller.readApiKey(req, res, next);
});

routes.put('/:formId/apiKey', hasFormPermissions(P.FORM_API_CREATE), async (req, res, next) => {
  await controller.createOrReplaceApiKey(req, res, next);
});

routes.delete('/:formId/apiKey', hasFormPermissions(P.FORM_API_DELETE), async (req, res, next) => {
  await controller.deleteApiKey(req, res, next);
});

routes.get('/formcomponents/proactivehelp/list', async (req, res, next) => {
  await controller.listFormComponentsProactiveHelp(req, res, next);
});

routes.get('/:formId/csvexport/fields', middleware.publicRateLimiter, apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readFieldsForCSVExport(req, res, next);
});

routes.get('/formcomponents/proactivehelp/imageUrl/:componentId', async (req, res, next) => {
  await controller.getFCProactiveHelpImageUrl(req, res, next);
});

module.exports = routes;
