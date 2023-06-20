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
 *              $ref: '#/components/schemas/response/FormListForms'
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
 *            $ref: '#/components/schemas/request/FormReqCreateForm'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/response/FormCreateForm'
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
 *              $ref: '#/components/schemas/response/FormReadForm'
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
 *            $ref: '#/components/schemas/request/FormReqSubmissionExport'
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
 *    description: Get form
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
 *            $ref: '#/components/schemas/request/FormReqSubmissionExportWithFields'
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
 *    description: Get form options
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
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  format: uuid
 *                  description: ID of the form
 *                name:
 *                  type: string
 *                  example: Ministry Survey
 *                  description: Name of the form
 *                description:
 *                  type: string
 *                  example: ''
 *                  description: A summary of the form
 *                idpHints:
 *                  type: array
 *                  description: Form access options. Options are "public", "bceid-basic", and "bceid-business"
 *                  example: ["public"]
 *                snake:
 *                  type: string
 *                  example: Ministry Survey
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
 *    description: update form
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
 *            type: object
 *            properties:
 *              $ref: '#/components/schemas/CreateForm'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              UpdateFormEx:
 *                $ref: '#/components/examples/UpdateFormEx'
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    format: uuid
 *                    description: Database generated form Id
 *                  name:
 *                    type: string
 *                    description: Name or title of the form
 *                  description:
 *                    type: string
 *                    description: short description of the form
 *                  active:
 *                    type: boolean
 *                    description: toggle that determines if the form is deleted
 *                  labels:
 *                    type: string
 *                  createdBy:
 *                    type: string
 *                    description: The username of user that created the form
 *                  createdAt:
 *                    type: string
 *                    format: date-time
 *                    description: Date the form was initially created
 *                  updatedBy:
 *                    type: string
 *                    description: The username of the user that last updated the form
 *                  updatedAt:
 *                    type: string
 *                    format: date-time
 *                    description: Date the form was last updated
 *                  showSubmissionConfirmation:
 *                    type: boolean
 *                    description: toggle to set if submission confirmation should shown when the form submission is submitted
 *                  submissionReceivedEmails:
 *                    type: string
 *                    format: email
 *                    description: List emails where submissions notifications will be sent
 *                  enableStatusUpdates:
 *                    type: boolean
 *                    description: Setting this to true will enabled submission status to be updated
 *                  enableSubmitterDraft:
 *                    type: boolean
 *                    description: Setting this to true will allow submitters to be able to save submissions as drafts
 *                    default: false
 *                  schedule:
 *                    type: object
 *                    description: submission s
 *                  reminder_enabled:
 *                    type: boolean
 *                    description: If enabled, a reminder notification will be sent to users before the submissions deadline
 *                    default: false
 *                  enableCopyExistingSubmission:
 *                    type: boolean
 *                    description: If enabled, users can copy or duplicate submissions
 *                    default: false
 *                  allowSubmitterToUploadFile:
 *                    type: boolean
 *                    description: If enabled, Submitters can upload when submitting submissions
 *                    default: false
 *                  identityProviders:
 *                    type: array
 *                    description: List of identity providers that can be used to login to the form
 *                  versions:
 *                    type: array
 *                    description: List of form versions
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
 *    description: Delete the form
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
 *    description: Get all submissions for the form
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
 *        description: The endpoint will fetch all the active form submissions if set to false. Otherwise,  the endpoint will fetch all the deleted form submissions
 *        required: true
 *        example: false
 *      - in: query
 *        name: fields
 *        schema:
 *          type: string
 *        description: List of submissions fields to be fetched. If empty, all the submissions fields will be fetched
 *        default: []
 *        example: ['firstName', 'lastName']
 *      - in: query
 *        name: createdBy
 *        schema:
 *          type: string
 *        description: The endpoint will filter the form submissions using the username in createdBy
 *        default: ""
 *        example: ["example@idir"]
 *      - in: query
 *        name: createdAt
 *        schema:
 *          type: string
 *        description: The endpoint will filter the form submissions using the start and end date in createdAt
 *        default: ['1973-06-18 07:02:45', '2073-06-18 07:02:45']
 *        example: ['1973-06-18 07:02:45', '2073-06-18 07:02:45']
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
 *                  confirmationId:
 *                    type: string
 *                    description: Submission confirmation ID
 *                    example: 9100A7D1
 *                  formId:
 *                    type: string
 *                    description: Form ID
 *                    format: uuid
 *                    example: e37705ee-1c01-44eb-ae8a-e7d96002ae67
 *                  formSubmissionStatusCode:
 *                    type: string
 *                    description: Code for the submission status
 *                    example: "ASSIGNED"
 *                  submissionId:
 *                    type: string
 *                    format: uuid
 *                    description: Submission ID
 *                    example: 9100a7d1-7017-4c07-bf10-9e19ea41777c
 *                  deleted:
 *                    type: boolean
 *                    description: toggle that determines if the form is deleted
 *                    example: true
 *                  formVersionId:
 *                    type: string
 *                    description: Form version ID
 *                    format: uuid
 *                    example: be1aac0a-8149-4987-bef8-470d538304a8
 *                  createdBy:
 *                    type: string
 *                    description: The username of user that submitted the submissions
 *                    example: "example@idir"
 *                  createdAt:
 *                    type: string
 *                    format: date-time
 *                    description: Date the form was initially submitted
 *                    example: 2023-06-18T04:47:56.622Z
 *                  lateEntry:
 *                    type: boolean
 *                    description: toggle that determines if the submission was submitted after the submission deadline
 *                    example: true
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
 *    description: Get all submissions for the form
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
 *            examples:
 *              FormVersionEx:
 *                $ref: '#/components/examples/FormVersionEx'
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    format: uuid
 *                    description: Database generated form Id
 *                  formId:
 *                    type: string
 *                    description: Form ID
 *                    format: uuid
 *                  versions:
 *                    type: number
 *                    description: Form version number
 *                  schema:
 *                    type: object
 *                    description: Form schema created by Form Designer
 *                  updatedBy:
 *                    type: string
 *                    description: The username of the user that last updated the form
 *                  updatedAt:
 *                    type: string
 *                    format: date-time
 *                    description: Date the form was last updated
 *                  createdBy:
 *                    type: string
 *                    description: The username of user that submitted the submissions
 *                  createdAt:
 *                    type: string
 *                    format: date-time
 *                    description: Date the form was initially submitted
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
 *    description: Get submission fields for the form ID and form version ID passed in the path parameter
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
 *    description: Publish form draft
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
 *            examples:
 *              PublishFormVersionEx:
 *                $ref: '#/components/examples/PublishFormVersionEx'
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  format: uuid
 *                  description: Database generated form Id
 *                name:
 *                  type: string
 *                  description: Name or title of the form
 *                description:
 *                  type: string
 *                  description: short description of the form
 *                active:
 *                  type: boolean
 *                  description: toggle that determines if the form is deleted
 *                labels:
 *                  type: string
 *                createdBy:
 *                  type: string
 *                  description: The username of user that created the form
 *                createdAt:
 *                  type: string
 *                  format: date-time
 *                  description: Date the form was initially created
 *                updatedBy:
 *                  type: string
 *                  description: The username of the user that last updated the form
 *                updatedAt:
 *                  type: string
 *                  format: date-time
 *                  description: Date the form was last updated
 *                showSubmissionConfirmation:
 *                  type: boolean
 *                  description: toggle to set if submission confirmation should shown when the form submission is submitted
 *                submissionReceivedEmails:
 *                  type: string
 *                  format: email
 *                  description: List emails where submissions notifications will be sent
 *                enableStatusUpdates:
 *                  type: boolean
 *                  description: Setting this to true will enabled submission status to be updated
 *                enableSubmitterDraft:
 *                  type: boolean
 *                  description: Setting this to true will allow submitters to be able to save submissions as drafts
 *                  default: false
 *                schedule:
 *                  type: object
 *                  description: submission s
 *                reminder_enabled:
 *                  type: boolean
 *                  description: If enabled, a reminder notification will be sent to users before the submissions deadline
 *                  default: false
 *                enableCopyExistingSubmission:
 *                  type: boolean
 *                  description: If enabled, users can copy or duplicate submissions
 *                  default: false
 *                allowSubmitterToUploadFile:
 *                  type: boolean
 *                  description: If enabled, Submitters can upload when submitting submissions
 *                  default: false
 *                identityProviders:
 *                  type: array
 *                  description: List of identity providers that can be used to login to the form
 *                versions:
 *                  type: array
 *                  description: List of form versions
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
 *    description: Create form submission
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
 *            type: object
 *            properties:
 *              draft:
 *                type: boolean
 *                description: This will be true if the submission is a draft
 *                default: true
 *                example: true
 *              submission:
 *                type: object
 *                properties:
 *                  data:
 *                    type: object
 *                    descritpion: submission data (submission entries)
 *                    example: {firstName: "Testd", lateEntry: false, middleName: "Ghust", submit: true}
 *                  metadata:
 *                    type: object
 *                    description: submission metadata
 *                    example: {"timezone": "America/Los_Angeles", "offset": -420, "origin": "http://localhost:8082", "referrer": "", "browserName": "Netscape", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36", "pathName": "/app/form/submit", "onLine": true}
 *                  state:
 *                    type: string
 *                    description: state of the submission
 *                    example: submitted
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              CreateFormSubmissionEx:
 *                $ref: '#/components/examples/CreateFormSubmissionEx'
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: Submission ID
 *                    format: uuid
 *                    example: 095f15a1-7d85-4919-8f40-5a0a3477cd7f
 *                  formVersionId:
 *                    type: string
 *                    description: Form version ID
 *                    format: uuid
 *                    example: e766899b-a4f9-438b-8382-17af8f10bff5
 *                  confirmationId:
 *                    type: string
 *                    description: Submission confirmation ID
 *                    example: "095F15A1"
 *                  deleted:
 *                    type: boolean
 *                    description: If set to true, the submission will be regarded as deleted
 *                    example: true
 *                  draft:
 *                    type: boolean
 *                    description: If set to true, the submission will be regarded as a draft
 *                    example: true
 *                  submission:
 *                    type: number
 *                    description: Form version number
 *                  updatedBy:
 *                    type: string
 *                    description: The username of the user that last updated the form submission
 *                  updatedAt:
 *                    type: string
 *                    format: date-time
 *                    description: Date the form submission was last updated
 *                  createdBy:
 *                    type: string
 *                    description: The username of user that submitted the submissions
 *                  createdAt:
 *                    type: string
 *                    format: date-time
 *                    description: Date the form was initially submitted
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
 *    description: update form
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
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: Database generated Id
 *                    format: uuid
 *                    example: 793a3311-f8d2-4073-8460-1f418e953a35
 *                  formId:
 *                    type: string
 *                    description: Form ID
 *                    format: uuid
 *                    example: f572d35e-f60c-4fa2-823d-f2ca77d96683
 *                  formVersionId:
 *                    type: string
 *                    description: Form version Id
 *                  createdBy:
 *                    type: string
 *                    description: The username of user that created the draft
 *                  createdAt:
 *                    type: string
 *                    format: date-time
 *                    description: Date the draft was initially created
 *                  updatedBy:
 *                    type: string
 *                    description: The username of the user that last updated the draft
 *                  updatedAt:
 *                    type: string
 *                    format: date-time
 *                    description: Date the draft was last updated
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
 *    description: Create form draft
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              formVersionId:
 *                type: string
 *                description: Form version Id
 *                format: uuid
 *              schema:
 *                type: object
 *                description: Form schema created by Form Designer
 *                example: {}
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
 *            examples:
 *              FormDraftEx:
 *                $ref: '#/components/examples/FormDraftEx'
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  format: uuid
 *                  description: Database generated form Id
 *                formId:
 *                  type: string
 *                  description: Form ID
 *                  format: uuid
 *                formVersionId:
 *                  type: string
 *                  format: uuid
 *                  description: Form version Id
 *                createdBy:
 *                  type: string
 *                  description: The username of user that created the draft
 *                createdAt:
 *                  type: string
 *                  format: date-time
 *                  description: Date the draft was initially created
 *                updatedBy:
 *                  type: string
 *                  description: The username of the user that last updated the draft
 *                updatedAt:
 *                  type: string
 *                  format: date-time
 *                  description: Date the draft was last updated
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
 *    description: Get form draft
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
 *        description: Form draft ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              FormDraftEx:
 *                $ref: '#/components/examples/FormDraftEx'
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  format: uuid
 *                  description: Database generated form Id
 *                formId:
 *                  type: string
 *                  description: Form ID
 *                  format: uuid
 *                formVersionId:
 *                  type: string
 *                  format: uuid
 *                  description: Form version Id
 *                createdBy:
 *                  type: string
 *                  description: The username of user that created the draft
 *                createdAt:
 *                  type: string
 *                  format: date-time
 *                  description: Date the draft was initially created
 *                updatedBy:
 *                  type: string
 *                  description: The username of the user that last updated the draft
 *                updatedAt:
 *                  type: string
 *                  format: date-time
 *                  description: Date the draft was last updated
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
 *    description: Get form draft
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
 *        content:
 *          application/json:
 *            examples:
 *              FormDraftEx:
 *                $ref: '#/components/examples/FormDraftEx'
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  format: uuid
 *                  description: Database generated form Id
 *                formId:
 *                  type: string
 *                  description: Form ID
 *                  format: uuid
 *                formVersionId:
 *                  type: string
 *                  format: uuid
 *                  description: Form version Id
 *                createdBy:
 *                  type: string
 *                  description: The username of user that created the draft
 *                createdAt:
 *                  type: string
 *                  format: date-time
 *                  description: Date the draft was initially created
 *                updatedBy:
 *                  type: string
 *                  description: The username of the user that last updated the draft
 *                updatedAt:
 *                  type: string
 *                  format: date-time
 *                  description: Date the draft was last updated
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
 *    description: Delete the form draft
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
 *    description: Publish form draft
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
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *                format: uuid
 *                description: Database generated form Id
 *              formVersionId:
 *                type: string
 *                description: Form version Id
 *                format: uuid
 *              formId:
 *                type: string
 *                description: Form ID
 *                format: uuid
 *              schema:
 *                type: object
 *                description: Form schema created by Form Designer
 *                example: {}
 *              updatedBy:
 *                type: string
 *                description: The username of the user that published the form version draft
 *              updatedAt:
 *                type: string
 *                format: date-time
 *                description: Date the form version draft was published
 *              version:
 *                type: number
 *                description: Form draft version to be published
 *                example: 2
 *              publish:
 *                type: boolean
 *                description: If set to true will publish the form draft version
 *                example: true
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              FormDraftEx:
 *                $ref: '#/components/examples/FormDraftEx'
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                type: string
 *                format: uuid
 *                description: Database generated form Id
 *              formVersionId:
 *                type: string
 *                description: Form version Id
 *                format: uuid
 *              formId:
 *                type: string
 *                description: Form ID
 *                format: uuid
 *              schema:
 *                type: object
 *                description: Form schema created by Form Designer
 *                example: {}
 *              updatedBy:
 *                type: string
 *                description: The username of the user that published the form version draft
 *              updatedAt:
 *                type: string
 *                format: date-time
 *                description: Date the form version draft was published
 *              version:
 *                type: number
 *                description: Form draft version to be published
 *                example: 2
 *              publish:
 *                type: boolean
 *                description: If set to true will publish the form draft version
 *                example: true
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
 *    description: create Form API Key
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
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: Database generated Id
 *                    format: uuid
 *                    example: 793a3311-f8d2-4073-8460-1f418e953a35
 *                  formId:
 *                    type: string
 *                    description: Form ID
 *                    format: uuid
 *                    example: f572d35e-f60c-4fa2-823d-f2ca77d96683
 *                  code:
 *                    type: string
 *                    descript: Submission Status Code
 *                  createdBy:
 *                    type: string
 *                    example: "AIDOWU@idir"
 *                  createdAt:
 *                    type: string
 *                    format: date-time
 *                    example: 2023-06-16T21:55:13.138Z
 *                  updatedBy:
 *                    type: string
 *                    example: null
 *                  updatedAt:
 *                    type: string
 *                    format: date-time
 *                    example: "2023-06-16T21:55:13.055Z"
 *                  statusCode:
 *                    type: object
 *                    properties:
 *                      code:
 *                        type: string
 *                        example: "SUBMITTED"
 *                      display:
 *                        type: string
 *                        example: "Submitted"
 *                      nextCodes:
 *                        type: array
 *                        example: [ "ASSIGNED", "COMPLETED", "REVISING"]
 *                      createdBy:
 *                        type: string
 *                        example: "migration-012"
 *                      createdAt:
 *                        type: string
 *                        example: "2023-03-29T14:07:46.684Z"
 *                      updatedBy:
 *                        type: string
 *                        example: migration-024
 *                      updatedAt:
 *                        type: string
 *                        format: date-time
 *                        example: 2023-03-29T14:07:46.684Z
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
 *    description: Get Form API Key
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
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  format: uuid
 *                  description: ID of the form
 *                formId:
 *                  type: string
 *                  example: 306040aa-c045-46d9-8a5a-78bd6fc7c724
 *                  description: ID of the form
 *                createdBy:
 *                  type: string
 *                  description: The username of the user that created this form
 *                  example: 'ADOGE@idir'
 *                createdAt:
 *                  type: string
 *                  format: timestamp
 *                  description: The timestamp the form was created
 *                  example: 2023-06-04T02:46:50.983Z
 *                updatedBy:
 *                  type: string
 *                  description: The username of the latest user that updated the form,
 *                  example: 'ADOGE@idir'
 *                updatedAt:
 *                  type: string
 *                  format: timestamp
 *                  description: The timestamp the form was last updated
 *                  example: 2023-05-28T01:48:04.363Z
 *                secret:
 *                  type: string
 *                  format: uuid
 *                  description: API secret generated
 *                  example: cb55d586-39d8-4fbb-9f80-0244cb4cb5cf
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
 *    description: create Form API Key
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
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *                description: Database generated ID
 *                example: 1
 *                required: true
 *              formId:
 *                type: string
 *                example: 306040aa-c045-46d9-8a5a-78bd6fc7c724
 *                description: ID of the form
 *                required: true
 *              createdBy:
 *                type: string
 *                description: The username of the user that created this form
 *                example: 'ADOGE@idir'
 *                required: true
 *              createdAt:
 *                type: string
 *                format: timestamp
 *                description: The timestamp the form was created
 *                example: 2023-06-04T02:46:50.983Z
 *                required: true
 *              updatedBy:
 *                type: string
 *                description: The username of the latest user that updated the form,
 *                example: 'ADOGE@idir'
 *                required: true
 *              updatedAt:
 *                type: string
 *                format: timestamp
 *                description: The timestamp the form was last updated
 *                example: 2023-05-28T01:48:04.363Z
 *                required: true
 *              secret:
 *                type: string
 *                format: uuid
 *                description: API secret generated
 *                example: cb55d586-39d8-4fbb-9f80-0244cb4cb5cf
 *                required: true
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  description: Database generated ID
 *                  example: 1
 *                formId:
 *                  type: string
 *                  example: 306040aa-c045-46d9-8a5a-78bd6fc7c724
 *                  description: ID of the form
 *                createdBy:
 *                  type: string
 *                  description: The username of the user that created this form
 *                  example: 'ADOGE@idir'
 *                createdAt:
 *                  type: string
 *                  format: timestamp
 *                  description: The timestamp the form was created
 *                  example: 2023-06-04T02:46:50.983Z
 *                updatedBy:
 *                  type: string
 *                  description: The username of the latest user that updated the form,
 *                  example: 'ADOGE@idir'
 *                updatedAt:
 *                  type: string
 *                  format: timestamp
 *                  description: The timestamp the form was last updated
 *                  example: 2023-05-28T01:48:04.363Z
 *                secret:
 *                  type: string
 *                  format: uuid
 *                  description: API secret generated
 *                  example: cb55d586-39d8-4fbb-9f80-0244cb4cb5cf
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
 *    description: delete the Form API Key
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
 *   description: Get all Users added as members to this form and their roles/permissions on the form
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
 *            type: object
 *            properties:
 *              Basic Layout:
 *                type: array
 *                items:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                      format: uuid
 *                      description: Database generated Id of Form.io component
 *                      example: "3a7efb05-52d4-4538-aedf-53a2c3429c85"
 *                    componentName:
 *                      type: string
 *                      description: Name of Form.io component
 *                      example: File Upload
 *                    description:
 *                      type: string
 *                      description: Full details about the component
 *                      example: With the CHEFS form builder, you have access to the 'File Upload' component, which enables you to attach files or documents to the form while submitting it. The maximum file size that can be uploaded using this component is 25MB, and all the files submitted through the form are securely stored in a designated Object storage space.
 *                    externalLink:
 *                      type: string
 *                      description: Link to the external documentation for the component
 *                      example: https://help.form.io/userguide/form-building/layout-components#panel
 *                    groupName:
 *                      type: string
 *                      description: Name of the group
 *                      example: Basic Layout
 *                    imageName:
 *                      type: string
 *                      description: name of the image
 *                      example: FileUpload.jpg
 *                    isLinkEnabled:
 *                      type: boolean
 *                      description: This hides or shows external link
 *                      example: true
 *                    status:
 *                      type: boolean
 *                      description: This determines the publish status of the component.
 *                      example: true
 *              Advanced Data:
 *                type: array
 *                example: []
 *              Basic Fields:
 *                type: array
 *                example: []
 *              Advanced Layout:
 *                type: array
 *                example: []
 *              BC Government:
 *                type: array
 *                example: []
 *              Advanced Fields:
 *                type: array
 *                example: []
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 */
routes.get('/formcomponents/proactivehelp/list', async (req, res, next) => {
  await controller.listFormComponentsProactiveHelp(req, res, next);
});

routes.get('/:formId/csvexport/fields', middleware.publicRateLimiter, apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readFieldsForCSVExport(req, res, next);
});

/**
 * @openapi
 * /forms/formcomponents/proactivehelp/imageUrl/{componentId}:
 *  get:
 *   tags:
 *    - Forms
 *   description: Get all Users added as members to this form and their roles/permissions on the form
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
