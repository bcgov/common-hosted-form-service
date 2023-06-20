const apiAccess = require('../auth/middleware/apiAccess');
const routes = require('express').Router();

const controller = require('./controller');
const P = require('../common/constants').Permissions;
const { currentUser, hasSubmissionPermissions, filterMultipleSubmissions } = require('../auth/middleware/userAccess');

routes.use(currentUser);

/**
 * @openapi
 * /submissions/{formSubmissionId}:
 *  get:
 *    tags:
 *      - Submissions
 *    description: Get Form Submission details for the submission ID
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form submission.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              SubmissionEx:
 *                $ref: '#/components/examples/SubmissionEx'
 *            schema:
 *              type: object
 *              description: form submission details for the formSubmissionId in the request parameter
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/NotFound'
 */
routes.get('/:formSubmissionId', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.read(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}:
 *  put:
 *    tags:
 *      - Submissions
 *    description: update Form Submission details for the submission ID
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form submission.
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
 *                description: draft status of the form submission
 *                required: true
 *              submission:
 *                type: object
 *                description: User form submission entry.
 *                required: true
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              SubmissionEx:
 *                $ref: '#/components/examples/SubmissionEx'
 *            schema:
 *              type: object
 *              description: form submission details for the formSubmissionId in the request parameter
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/NotFound'
 */
routes.put('/:formSubmissionId', hasSubmissionPermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.update(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}:
 *  delete:
 *    tags:
 *      - Submissions
 *    description: delete Form Submission details for the submission ID
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form submission.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              DeletedSubmissionEx:
 *                $ref: '#/components/examples/DeletedSubmissionEx'
 *            schema:
 *              type: object
 *              description: form submission details for the formSubmissionId in the request parameter
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/NotFound'
 */
routes.delete('/:formSubmissionId', hasSubmissionPermissions(P.SUBMISSION_DELETE), async (req, res, next) => {
  await controller.delete(req, res, next);
});

routes.put('/:formSubmissionId/:formId/submissions/restore', hasSubmissionPermissions(P.SUBMISSION_DELETE), filterMultipleSubmissions(), async (req, res, next) => {
  await controller.restoreMutipleSubmissions(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/restore:
 *  put:
 *    tags:
 *      - Submissions
 *    description: restore deleted Form Submission details for the submission ID
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form submission.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              deleted:
 *                type: boolean
 *                description: set deleted status to true to restore the submission
 *                required: true
 *                example: false
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              DeletedSubmissionEx:
 *                $ref: '#/components/examples/DeletedSubmissionEx'
 *            schema:
 *              type: object
 *              description: form submission details for the formSubmissionId in the request parameter
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/NotFound'
 */
routes.put('/:formSubmissionId/restore', hasSubmissionPermissions(P.SUBMISSION_DELETE), async (req, res, next) => {
  await controller.restore(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/options:
 *  put:
 *    tags:
 *      - Submissions
 *    description: restore deleted Form Submission details for the submission ID
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form submission.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              DeletedSubmissionEx:
 *                $ref: '#/components/examples/DeletedSubmissionEx'
 *            schema:
 *              type: object
 *              properties:
 *                submission:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                      description: Database generated form submission ID
 *                      format: uuid
 *                      example: 676efa64-7038-442f-ac0f-2e6ed3fa5e50
 *                    formVersionId:
 *                      type: string
 *                      description: Database generated form version ID
 *                      format: uuid
 *                      example: 1e33c4dd-04bf-4c5b-a7d2-3cc3a5d498b7
 *                version:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                      description: Database generated form version ID
 *                      format: uuid
 *                      example: 676efa64-7038-442f-ac0f-2e6ed3fa5e50
 *                    formId:
 *                      type: string
 *                      description: Database generated form ID
 *                      format: uuid
 *                      example: 1e33c4dd-04bf-4c5b-a7d2-3cc3a5d498b7
 *                form:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                      description: Database generated form ID
 *                      format: uuid
 *                      example: 676efa64-7038-442f-ac0f-2e6ed3fa5e50
 *                    name:
 *                      type: string
 *                      description: Name of the form
 *                      example: multiple_submission_file_download
 *                    description:
 *                      type: string
 *                      description: Details about the form
 *                      example: Test Form
 *                    idpHints:
 *                      type: array
 *                      description: Form access options. Options are "public", "bceid-basic", and "bceid-business"
 *                      example: ["public"]
 *                    snake:
 *                      type: string
 *                      example: multiple_submission_file_download
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/ResourceNotFoundError'
 */
routes.get('/:formSubmissionId/options', async (req, res, next) => {
  await controller.readOptions(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/notes:
 *  get:
 *    tags:
 *      - Submissions
 *    description: get form submission notes
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form submission.
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
 *                    format: uuid
 *                    description: Database generated Note Id
 *                    example: 67cb6740-2db7-44b1-a763-c5f65ca8db1b
 *                  submissionId:
 *                    type: string
 *                    format: uuid
 *                    description: ID  of the submission
 *                    example: 70531344-c77f-47bb-83d6-74c22223abe0
 *                  submissionStatusId:
 *                    type: string
 *                    description: ID  of the submission status
 *                    example: null
 *                  note:
 *                    type: string
 *                    description: Submission Note (This is note that comes status update)
 *                    example: "Email to ayobamii.idowu@gov.bc.ca: nffg"
 *                  userId:
 *                    type: string
 *                    description: ID of the User
 *                    format: uuid
 *                    example: 2a4770b7-6f0e-4629-a359-bf820295f23a
 *                  createdBy:
 *                    type: string
 *                    description: The user that initially added the note to the submission
 *                    example: "AIDOWU@idir"
 *                  createdAt:
 *                    type: string
 *                    description: Date the note was initially added to the submission
 *                    example: 2023-06-15T19:44:36.320Z
 *                  updatedBy:
 *                    type: string
 *                    description: The user that last updated the submission note
 *                    example: null
 *                  updatedAt:
 *                    type: string
 *                    description: Date the submission note was last updated
 *                    example: 2023-06-15T19:44:36.320Z
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 *    '422':
 *      $ref: '#/components/responses/ResourceNotFoundError'
 */
routes.get('/:formSubmissionId/notes', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.getNotes(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/notes:
 *  post:
 *    tags:
 *      - Submissions
 *    description: add notes to form submission
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
 *              note:
 *                type: string
 *                description: set deleted status to true to restore the submission
 *                required: true
 *                example: vbjhbjk
 *              userId:
 *                type: string
 *                format: uuid
 *                description: set deleted status to true to restore the submission
 *                required: true
 *                example: 2a4770b7-6f0e-4629-a359-bf820295f23a
 *    parameters:
 *      - in: path
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form submission.
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
 *                    format: uuid
 *                    description: Database generated Note Id
 *                    example: 67cb6740-2db7-44b1-a763-c5f65ca8db1b
 *                  submissionId:
 *                    type: string
 *                    format: uuid
 *                    description: ID  of the submission
 *                    example: 70531344-c77f-47bb-83d6-74c22223abe0
 *                  submissionStatusId:
 *                    type: string
 *                    description: ID  of the submission status
 *                    example: null
 *                  note:
 *                    type: string
 *                    description: Submission Note (This is note that comes status update)
 *                    example: "Email to ayobamii.idowu@gov.bc.ca: nffg"
 *                  userId:
 *                    type: string
 *                    description: ID of the User
 *                    format: uuid
 *                    example: 2a4770b7-6f0e-4629-a359-bf820295f23a
 *                  createdBy:
 *                    type: string
 *                    description: The user that initially added the note to the submission
 *                    example: "AIDOWU@idir"
 *                  createdAt:
 *                    type: string
 *                    description: Date the note was initially added to the submission
 *                    example: 2023-06-15T19:44:36.320Z
 *                  updatedBy:
 *                    type: string
 *                    description: The user that last updated the submission note
 *                    example: null
 *                  updatedAt:
 *                    type: string
 *                    description: Date the submission note was last updated
 *                    example: 2023-06-15T19:44:36.320Z
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 *    '422':
 *      $ref: '#/components/responses/ResourceNotFoundError'
 */
routes.post('/:formSubmissionId/notes', hasSubmissionPermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.addNote(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/status:
 *  get:
 *    tags:
 *      - Submissions
 *    description: Get form submission status
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form submission.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              SubmissionStatusEx:
 *                $ref: '#/components/examples/SubmissionStatusEx'
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: Database generated form submission status ID
 *                    format: uuid
 *                  submissionId:
 *                    type: string
 *                    description: Database generated form submission status ID
 *                    format: uuid
 *                  code:
 *                    type: string
 *                    description: Form submission status
 *                  assignedToUserId:
 *                    type: string
 *                    describe: user ID that the form submission has been assigned
 *                  actionDate:
 *                    type: string
 *                  createdBy:
 *                    type: string
 *                    description: The username of the user that initially submitted the form submission
 *                  createdAt:
 *                    type: string
 *                    format: timestamp
 *                    description: The timestamp the form submission was initially submitted
 *                  updatedBy:
 *                    type: string
 *                    description: The username of the latest user that updated the form submission
 *                  updatedAt:
 *                    type: string
 *                    format: timestamp
 *                    description: The timestamp the form submission was last updated
 *                  user:
 *                    type: object
 *                    description: Details of the user that the form submission was assigned
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/ResourceNotFoundError'
 */
routes.get('/:formSubmissionId/status', apiAccess, hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.getStatus(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/status:
 *  post:
 *    tags:
 *      - Submissions
 *    description: update form submission status
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form submission.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            oneOf:
 *              - $ref: '#/components/schemas/AssignedSubmissionStatus'
 *              - $ref: '#/components/schemas/CompletedSubmissionStatus'
 *              - $ref: '#/components/schemas/RevisedSubmissionStatus'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              SubmissionStatusEx:
 *                $ref: '#/components/examples/SubmissionStatusEx'
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: Database generated form submission status ID
 *                    format: uuid
 *                  submissionId:
 *                    type: string
 *                    description: Database generated form submission status ID
 *                    format: uuid
 *                  code:
 *                    type: string
 *                    description: Form submission status
 *                  assignedToUserId:
 *                    type: string
 *                    describe: user ID that the form submission has been assigned
 *                  actionDate:
 *                    type: string
 *                  createdBy:
 *                    type: string
 *                    description: The username of the user that initially submitted the form submission
 *                  createdAt:
 *                    type: string
 *                    format: timestamp
 *                    description: The timestamp the form submission was initially submitted
 *                  updatedBy:
 *                    type: string
 *                    description: The username of the latest user that updated the form submission
 *                  updatedAt:
 *                    type: string
 *                    format: timestamp
 *                    description: The timestamp the form submission was last updated
 *                  user:
 *                    type: object
 *                    description: Details of the user that the form submission was assigned
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/ResourceNotFoundError'
 */
routes.post('/:formSubmissionId/status', hasSubmissionPermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.addStatus(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/status:
 *  post:
 *    tags:
 *      - Submissions
 *    description: update form submission status
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: to
 *        schema:
 *          type: string
 *          format: email
 *        description: email to send the receipt to.
 *        required: true
 *        example: receipt@gov.bc.ca
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              SubmissionStatusEx:
 *                $ref: '#/components/examples/SubmissionStatusEx'
 *            schema:
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/ResourceNotFoundError'
 */
routes.post('/:formSubmissionId/email', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.email(req, res, next);
});

routes.get('/:formSubmissionId/edits', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.listEdits(req, res, next);
});

routes.post('/:formSubmissionId/template/render', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.templateUploadAndRender(req, res, next);
});

routes.delete('/:formSubmissionId/:formId/submissions', hasSubmissionPermissions(P.SUBMISSION_DELETE), filterMultipleSubmissions(), async (req, res, next) => {
  await controller.deleteMutipleSubmissions(req, res, next);
});

// Implement this when we want to fetch a specific audit row including the whole old submission record
// routes.get('/:formSubmissionId/edits/:auditId', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
//   await controller.listEdits(req, res, next);
// });

module.exports = routes;
