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
 *    description: This endpoint will fetch submission details for the submission ID.
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
 *              description: Form submission details for the formSubmissionId in the request parameter
 *              properties:
 *               form:
 *                type: object
 *                description: Form Details.
 *                example: {}
 *              submission:
 *                type: object
 *                description: Submission Details.
 *                example: {}
 *              version:
 *                type: object
 *                description: Version Details.
 *                example: {}
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/NotFound'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
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
 *    description: This endpoint will update the Form Submission details for the submission ID
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
 *             $ref: '#/components/requestBodies/FormReqCreatSubmission'
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
 *              description: Form submission details for the formSubmissionId in the request parameter
 *              properties:
 *                form:
 *                  type: object
 *                  description: Form Details.
 *                  example: {}
 *                submission:
 *                  type: object
 *                  description: Submission Details.
 *                  example: {}
 *                version:
 *                  type: object
 *                  description: Version Details.
 *                  example: {}
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/NotFound'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
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
 *    description: This endpoint will delete form submission details for the submission ID
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
 *              description: Form submission details for the formSubmissionId in the request parameter
 *              properties:
 *                $ref: '#/components/schemas/model/Submission'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/NotFound'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 */
routes.delete('/:formSubmissionId', hasSubmissionPermissions(P.SUBMISSION_DELETE), async (req, res, next) => {
  await controller.delete(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/{formId}/submissions/restore:
 *  put:
 *    tags:
 *      - Submissions
 *    description: This endpoint will multi-restore the deleted form submissions for all the submission IDs in the list.
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
 *              submissionIds:
 *                description: List of submission IDs to restore.
 *                type: array
 *                example:
 *                - 57f77c27-d8d1-434a-a2d3-5c08a6f7f09b
 *                - a2794923-5a4f-4945-be9c-9655dc2f09c8
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              RestoreMultiSubmissionEx:
 *                $ref: '#/components/examples/RestoreMultiSubmissionEx'
 *            schema:
 *              type: object
 *              description: form submission details for the formSubmissionId in the request parameter
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/NotFound'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/InvalidFormIdError'
 *                - $ref: '#/components/schemas/respError/SubmissnDelOrRestorePermissnError'
 *                - $ref: '#/components/schemas/respError/FormIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/RequiredSubmissionPermissionError'
 */
routes.put('/:formSubmissionId/:formId/submissions/restore', hasSubmissionPermissions(P.SUBMISSION_DELETE), filterMultipleSubmissions(), async (req, res, next) => {
  await controller.restoreMutipleSubmissions(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/restore:
 *  put:
 *    tags:
 *      - Submissions
 *    description: This endpoint will restore deleted form submission details for the submission ID
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
 *              SubmissionEx:
 *                $ref: '#/components/examples/SubmissionEx'
 *            schema:
 *              type: object
 *              description: form submission details for the formSubmissionId in the request parameter
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/NotFound'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 */
routes.put('/:formSubmissionId/restore', hasSubmissionPermissions(P.SUBMISSION_DELETE), async (req, res, next) => {
  await controller.restore(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/options:
 *  get:
 *    tags:
 *      - Submissions
 *    description: This endpoint fetch pre-flight details for a form submission.
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
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formSubmissionId/options', async (req, res, next) => {
  await controller.readOptions(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/notes:
 *  get:
 *    tags:
 *      - Status
 *    description: This endpoint will get form submission notes
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
 *              $ref: '#/components/responses/responseBody/SubmissionsNote'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *                - $ref: '#/components/responses/Error/NoFormAccess'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formSubmissionId/notes', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.getNotes(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/notes:
 *  post:
 *    tags:
 *      - Status
 *    description: This endpoint will add notes to form submission
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
 *              $ref: '#/components/responses/responseBody/SubmissionsNote'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *                - $ref: '#/components/responses/Error/NoFormAccess'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post('/:formSubmissionId/notes', hasSubmissionPermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.addNote(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/status:
 *  get:
 *    tags:
 *      - Status
 *    description: This endpoint will list of status history for a submission.
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
 *              $ref: '#/components/responses/responseBody/SubmissionsGetStatus'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formSubmissionId/status', apiAccess, hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.getStatus(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/status:
 *  post:
 *    tags:
 *      - Status
 *    description: This endpoint add a new status to a submission, and optionally provides email notification depending on the status being assigned.
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
 *              - $ref: '#/components/requestBodies/StatusReqAssignedSubmissionStatus'
 *              - $ref: '#/components/requestBodies/StatusReqCompletedSubmissionStatus'
 *              - $ref: '#/components/requestBodies/StatusReqRevisedSubmissionStatus'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/SubmissionsAddStatus'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/NotFound'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post('/:formSubmissionId/status', hasSubmissionPermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.addStatus(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/email:
 *  post:
 *    tags:
 *      - Submissions
 *    description: This endpoint will send email to the email.
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
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/NotFound'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post('/:formSubmissionId/email', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.email(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/edits:
 *  post:
 *    tags:
 *      - Submissions
 *    description: This endpoint will fetch an audit list of edits or changes made to the specified submission.
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
 *            schema:
 *              $ref: '#/components/responses/responseBody/SubmissionListEdits'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/NotFound'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formSubmissionId/edits', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.listEdits(req, res, next);
});

routes.post('/:formSubmissionId/template/render', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.templateUploadAndRender(req, res, next);
});

/**
 * @openapi
 * /submissions/{formSubmissionId}/{formId}/submissions:
 *  delete:
 *    tags:
 *      - Submissions
 *    description: This endpoint will soft delete form submission details for the submission IDs in the list.
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
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: d0ec4197-3616-4dd9-8a6e-c91d124dded9
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              submissionIds:
 *                description: List of submission IDs to delete.
 *                type: array
 *                example:
 *                - 57f77c27-d8d1-434a-a2d3-5c08a6f7f09b
 *                - a2794923-5a4f-4945-be9c-9655dc2f09c8
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              DeleteMultiSubmissionEx:
 *                $ref: '#/components/examples/DeleteMultiSubmissionEx'
 *            schema:
 *              type: object
 *              description: Form submission details for the formSubmissionId in the request parameter
 *              properties:
 *                form:
 *                  type: object
 *                  description: Form Details.
 *                  example: {}
 *                submission:
 *                  type: object
 *                  description: Submission Details.
 *                  example: {}
 *                version:
 *                  type: object
 *                  description: Version Details.
 *                  example: {}
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/NotFound'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/SubmissionIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/SubmissionAccessError'
 *                - $ref: '#/components/schemas/respError/FormIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/InvalidSubmissionIdError'
 *                - $ref: '#/components/schemas/respError/RequiredSubmissionPermissionError'
 *                - $ref: '#/components/schemas/respError/SubmissnDelOrRestorePermissnError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.delete('/:formSubmissionId/:formId/submissions', hasSubmissionPermissions(P.SUBMISSION_DELETE), filterMultipleSubmissions(), async (req, res, next) => {
  await controller.deleteMutipleSubmissions(req, res, next);
});

// Implement this when we want to fetch a specific audit row including the whole old submission record
// routes.get('/:formSubmissionId/edits/:auditId', hasSubmissionPermissions(P.SUBMISSION_READ), async (req, res, next) => {
//   await controller.listEdits(req, res, next);
// });

module.exports = routes;
