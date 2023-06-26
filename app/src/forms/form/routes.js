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
 *    description: This endpoint will fetch all forms that the user has access.
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
 *              $ref: '#/components/responses/responseBody/FormListForms'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.get('/', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.listForms(req, res, next);
});

/**
 * @openapi
 * forms/:
 *  post:
 *    tags:
 *      - Forms
 *    description: This endpoint will create new form.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqCreateForm'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormCreateForm'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 */
routes.post('/', async (req, res, next) => {
  await controller.createForm(req, res, next);
});

/**
 * @openapi
 * forms/{formId}:
 *  get:
 *    tags:
 *      - Forms
 *    description: This endpoint will fetch the form with the form ID.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormReadForm'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/:formId', apiAccess, hasFormPermissions(P.FORM_READ), async (req, res, next) => {
  await controller.readForm(req, res, next);
});

/**
 * @openapi
 * forms/{formId}/export:
 *  get:
 *    tags:
 *      - Forms
 *    description: This endpoint will export submissions to either CSV or JSON.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqSubmissionExport'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          text/csv:
 *            schema:
 *              type: string
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/:formId/export', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.export(req, res, next);
});

/**
 * @openapi
 * forms/{formId}/export/fields:
 *  post:
 *    tags:
 *      - Forms
 *    description: This endpoint will export submissions to either CSV or JSON.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqSubmissionExportWithFields'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          text/csv:
 *            schema:
 *              type: string
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.post('/:formId/export/fields', middleware.publicRateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.exportWithFields(req, res, next);
});

/**
 * @openapi
 * forms/{formId}/options:
 *  get:
 *    tags:
 *      - Forms
 *    description: This endpoint will fetch form options.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormReadFormOptions'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/:formId/options', async (req, res, next) => {
  await controller.readFormOptions(req, res, next);
});

/*
Suggested for clean up
*/
routes.get('/:formId/version', apiAccess, hasFormPermissions(P.FORM_READ), async (req, res, next) => {
  await controller.readPublishedForm(req, res, next);
});

/**
 * @openapi
 * forms/{formId}:
 *  put:
 *    tags:
 *      - Forms
 *    description: This endpoint will update this form.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqUpdateForm'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormUpdateForm'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.put('/:formId', apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.updateForm(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}:
 *  delete:
 *    tags:
 *      - Forms
 *    description: This endpoint will delete this form.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.delete('/:formId', apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_DELETE]), async (req, res, next) => {
  await controller.deleteForm(req, res, next);
});

/**
 * @openapi
 * forms/{formId}/submissions:
 *  get:
 *    tags:
 *      - Forms
 *    description: This endpoint will get all submissions for this form
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: deleted
 *        schema:
 *          type: boolean
 *        description: The endpoint will fetch all the active form submissions if set to false. Otherwise,  the endpoint will fetch all the deleted form submissions.
 *        required: true
 *        example: false
 *      - in: query
 *        name: fields
 *        schema:
 *          type: string
 *        description: List of submissions fields to be fetched. If empty, all the submissions fields will be fetched.
 *        default: []
 *        example: ['firstName', 'lastName']
 *      - in: query
 *        name: createdBy
 *        schema:
 *          type: string
 *        description: The endpoint will filter the form submissions using the username in createdBy.
 *        default: ""
 *        example: ["example@idir"]
 *      - in: query
 *        name: createdAt
 *        schema:
 *          type: string
 *        description: The endpoint will filter the form submissions using the start and end date in createdAt.
 *        default: ['1973-06-18 07:02:45', '2073-06-18 07:02:45']
 *        example: ['1973-06-18 07:02:45', '2073-06-18 07:02:45']
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormListFormSubmissions'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/:formId/submissions', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.listFormSubmissions(req, res, next);
});

// routes.post('/:formId/versions', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
//   next(new Problem(410, { detail: 'This method is deprecated, use /forms/id/drafts to create form versions.' }));
// });

/**
 * @openapi
 * forms/{formId}/versions/{formVersionId}:
 *  get:
 *    tags:
 *      - Forms
 *    description: This endpoint will fetch all the submissions for the form.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormReadVersion'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 *      '422':
 *        $ref: '#/components/responses/UnprocessableEntityDB'
 */
routes.get('/:formId/versions/:formVersionId', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readVersion(req, res, next);
});

/**
 * @openapi
 * forms/{formId}/versions/{formVersionId}/fields:
 *  get:
 *    tags:
 *      - Forms
 *    description: This endpoint will fetch submission fields for the form ID and form version ID passed in the path parameter.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              description: returns submission fields for the form version ID passed in the path parameter
 *              example: ["firstName"]
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 *      '422':
 *        $ref: '#/components/responses/UnprocessableEntityDB'
 */
routes.get('/:formId/versions/:formVersionId/fields', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readVersionFields(req, res, next);
});
// routes.put('/:formId/versions/:formVersionId', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
//   next(new Problem(410, { detail: 'This method is deprecated, use /forms/id/drafts to modify form versions.' }));
// });

/**
 * @openapi
 * /forms/{formId}/versions/{formVersionId}/publish:
 *  post:
 *    tags:
 *      - Forms
 *    description: This endpoint will publish form draft
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionDraftId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version draft ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: unpublish
 *        schema:
 *          type: boolean
 *        description: Publish status
 *        required: true
 *        example: true
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormPublishVersion'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.post('/:formId/versions/:formVersionId/publish', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.publishVersion(req, res, next);
});

/*
Suggested for clean up
*/
routes.get('/:formId/versions/:formVersionId/submissions', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.listSubmissions(req, res, next);
});

/**
 * @openapi
 * forms/{formId}/versions/{formVersionId}/submissions:
 *  post:
 *    tags:
 *      - Forms
 *    description: This endpoint will create form submission
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqCreatSubmission'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormCreateFormSubmission'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 *      '422':
 *        $ref: '#/components/responses/UnprocessableEntityDB'
 */
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

/*
Suggested for clean up
*/
routes.get('/:formId/versions/:formVersionId/submissions/discover', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), (req, res, next) => {
  controller.listSubmissionFields(req, res, next);
});

// routes.get('/:formId/versions/:formVersionId/submissions/:formSubmissionId', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
//   next(new Problem(410, { detail: 'This method is deprecated, use /submissions to read a submission.' }));
// });

// routes.put('/:formId/versions/:formVersionId/submissions/:formSubmissionId', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
//   next(new Problem(410, { detail: 'This method is deprecated, use /submissions to modify a submission.' }));
// });

/**
 * @openapi
 * forms/{formId}/drafts:
 *  get:
 *    tags:
 *      - Forms
 *    description: This endpoint will fetch list of all form drafts.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormListsDraft'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/:formId/drafts', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_READ]), async (req, res, next) => {
  await controller.listDrafts(req, res, next);
});

/**
 * @openapi
 * forms/{formId}/drafts:
 *  post:
 *    tags:
 *      - Forms
 *    description: This endpoint will create form draft from published form version.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqCreateDraft'
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *               $ref: '#/components/responses/responseBody/FormCreateDraft'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.post('/:formId/drafts', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.createDraft(req, res, next);
});

/**
 * @openapi
 * forms/{formId}/draft/{formVersionDraftId}:
 *  get:
 *    tags:
 *      - Forms
 *    description: This endpoint will fetch form draft.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionDraftId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form draft.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormReadDraft'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/:formId/drafts/:formVersionDraftId', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_READ]), async (req, res, next) => {
  await controller.readDraft(req, res, next);
});

/**
 * @openapi
 * forms/{formId}/draft/{formVersionDraftId}:
 *  put:
 *    tags:
 *      - Forms
 *    description: This endpoint will fetch form draft.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionDraftId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version draft ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqUpdateDraft'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormUpdateDraft'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.put('/:formId/drafts/:formVersionDraftId', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_UPDATE]), async (req, res, next) => {
  await controller.updateDraft(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/drafts/{formVersionDraftId}:
 *  delete:
 *    tags:
 *      - Forms
 *    description: This endpoint will delete the form draft.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionDraftId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version draft ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.delete('/:formId/drafts/:formVersionDraftId', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_DELETE]), async (req, res, next) => {
  await controller.deleteDraft(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/drafts/{formVersionDraftId}/publish:
 *  post:
 *    tags:
 *      - Forms
 *    description: This endpoint will publish the form draft.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionDraftId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version draft ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqPublishDraft'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormPublishDraft'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.post('/:formId/drafts/:formVersionDraftId/publish', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.publishDraft(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/statusCodes:
 *  get:
 *    tags:
 *      - Forms
 *    description: This endpoint will fetch Form API Key details.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormGetStatusCodes'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/:formId/statusCodes', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.getStatusCodes(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/apiKey:
 *  get:
 *    tags:
 *      - Forms
 *    description: This endpoint will fetch Form API Key details.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormReadAPIkey'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/:formId/apiKey', hasFormPermissions(P.FORM_API_READ), async (req, res, next) => {
  await controller.readApiKey(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/apiKey:
 *  put:
 *    tags:
 *      - Forms
 *    description: This endpoint will create Form API Key.
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormCreateOrReplaceApiKey'
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.put('/:formId/apiKey', hasFormPermissions(P.FORM_API_CREATE), async (req, res, next) => {
  await controller.createOrReplaceApiKey(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/apiKey:
 *  delete:
 *    tags:
 *      - Forms
 *    description: This endpoint will delete the Form API Key
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.delete('/:formId/apiKey', hasFormPermissions(P.FORM_API_DELETE), async (req, res, next) => {
  await controller.deleteApiKey(req, res, next);
});

/**
 * @openapi
 * /forms/formcomponents/proactivehelp/list:
 *  get:
 *   tags:
 *    - Forms
 *   description: This endpoint will fetch the list of all the proactive help details.
 *   security:
 *    - bearerAuth: []
 *    - basicAuth: []
 *    - openId: []
 *   responses:
 *    '200':
 *      description: Success
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/responses/responseBody/FormProactiveHelpList'
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 */
routes.get('/formcomponents/proactivehelp/list', async (req, res, next) => {
  await controller.listFormComponentsProactiveHelp(req, res, next);
});

/*
Suggested for clean up
*/
routes.get('/:formId/csvexport/fields', middleware.publicRateLimiter, apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readFieldsForCSVExport(req, res, next);
});

/**
 * @openapi
 * /forms/formcomponents/proactivehelp/imageUrl/{componentId}:
 *  get:
 *   tags:
 *    - Forms
 *   description: This endpoint will get the image of the form.io component proactive help.
 *   security:
 *    - bearerAuth: []
 *    - basicAuth: []
 *    - openId: []
 *   parameters:
 *    - in: path
 *      name: componentId
 *      schema:
 *        type: string
 *      description: Id of the Form.io component. This is a database generated Id.
 *      required: true
 *      example: true
 *   responses:
 *    '200':
 *      description: Success
 *      content:
 *        image/png:
 *          schema:
 *            type: object
 *            properties:
 *              url:
 *                type: string
 *                format: binary
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 *    '422':
 *      $ref: '#/components/responses/UnprocessableEntityDB'
 */
routes.get('/formcomponents/proactivehelp/imageUrl/:componentId', async (req, res, next) => {
  await controller.getFCProactiveHelpImageUrl(req, res, next);
});

module.exports = routes;
