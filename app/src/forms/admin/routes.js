const config = require('config');
const routes = require('express').Router();

const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
const userController = require('../user/controller');
const keycloak = require('../../components/keycloak');

// Always have this applied to all routes here
routes.use(keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`));
routes.use(currentUser);

// Routes under the /admin pathing will fetch data without doing Form permission checks in the database
// As such, this should ALWAYS remain under the :admin role check and that KC role should not be given out
// other than to people who have permission to read all data

//
// Forms
//

/**
 * @openapi
 * /admin/forms:
 *  get:
 *    tags:
 *      - Admin
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
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 *      '404':
 *        $ref: '#/components/responses/ResourceNotFound'
 */
routes.get('/forms', async (req, res, next) => {
  await controller.listForms(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}:
 *  get:
 *    tags:
 *      - Admin
 *    description: Get details of a form (and metadata for versions)
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
 *                active:
 *                  type: boolean
 *                  example: true,
 *                  description: This is used to determine if the form is deleted. A value of false means the form is deleted
 *                label:
 *                  type: string
 *                  example: ''
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
 *                showSubmissionConfirmation:
 *                  type: boolean
 *                  example: true
 *                  description: ''
 *                submissionReceivedEmails:
 *                  type: array
 *                  example: []
 *                enableStatusUpdates:
 *                  type: boolean
 *                  example: true
 *                  description: Enables or disables form reviewers from updating this form status (i.e. Submitted, Assigned, Completed)
 *                enableSubmitterDraft:
 *                  type: boolean
 *                  example: true
 *                  description: Enables or disables form submitters from saving or editing this form draft
 *                schedule:
 *                  type: object
 *                  example: {}
 *                reminder_enabled:
 *                  type: boolean
 *                  example: true
 *                  description: Enables or disables form submission reminder
 *                enableCopyExistingSubmission:
 *                  type: boolean
 *                  example: true
 *                  description: Enables or disables form copying of existing submission
 *                allowSubmitterToUploadFile:
 *                  type: boolean
 *                  example: true
 *                  description: If enabled, submitters can upload files with their submissions
 *                identityProviders:
 *                  type: array
 *                  example: ['idir', 'Bceid']
 *                  description: List of identity providers that can be used to login to the form
 *                versions:
 *                  type: array
 *                  example: [id: '33707cbd-7e69-4c66-bd2e-88596896a670', formId: '306040aa-c045-46d9-8a5a-78bd6fc7c644', version: 2, published: true, createdBy: 'AIDOWU@idir', createdAt: '2023-05-18T20:11:41.329Z', updatedBy: null, updatedAt: '2023-05-18T20:11:41.241Z']
 *                  description: List of form versions
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/forms/:formId', async (req, res, next) => {
  await controller.readForm(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}/apiKey:
 *  delete:
 *    tags:
 *      - Admin
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
routes.delete('/forms/:formId/apiKey', async (req, res, next) => {
  await controller.deleteApiKey(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}/apiKey:
 *  get:
 *    tags:
 *      - Admin
 *    description: Get API the Form API Key
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
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.get('/forms/:formId/apiKey', async (req, res, next) => {
  await controller.readApiDetails(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}/restore:
 *  put:
 *    tags:
 *      - Admin
 *    description: Restore Deleted Form
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
 *                active:
 *                  type: boolean
 *                  example: true,
 *                  description: This is used to determine if the form is deleted. A value of false means the form is deleted
 *                label:
 *                  type: string
 *                  example: ''
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
 *                showSubmissionConfirmation:
 *                  type: boolean
 *                  example: true
 *                  description: ''
 *                submissionReceivedEmails:
 *                  type: array
 *                  example: []
 *                enableStatusUpdates:
 *                  type: boolean
 *                  example: true
 *                  description: Enables or disables form reviewers from updating this form status (i.e. Submitted, Assigned, Completed)
 *                enableSubmitterDraft:
 *                  type: boolean
 *                  example: true
 *                  description: Enables or disables form submitters from saving or editing this form draft
 *                schedule:
 *                  type: object
 *                  example: {}
 *                reminder_enabled:
 *                  type: boolean
 *                  example: true
 *                  description: Enables or disables form submission reminder
 *                enableCopyExistingSubmission:
 *                  type: boolean
 *                  example: true
 *                  description: Enables or disables form copying of existing submission
 *                allowSubmitterToUploadFile:
 *                  type: boolean
 *                  example: true
 *                  description: If enabled, submitters can upload files with their submissions
 *                identityProviders:
 *                  type: array
 *                  example: ['idir', 'Bceid']
 *                  description: List of identity providers that can be used to login to the form
 *                versions:
 *                  type: array
 *                  example: [id: '33707cbd-7e69-4c66-bd2e-88596896a670', formId: '306040aa-c045-46d9-8a5a-78bd6fc7c644', version: 2, published: true, createdBy: 'AIDOWU@idir', createdAt: '2023-05-18T20:11:41.329Z', updatedBy: null, updatedAt: '2023-05-18T20:11:41.241Z']
 *                  description: List of form versions
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 */
routes.put('/forms/:formId/restore', async (req, res, next) => {
  await controller.restoreForm(req, res, next);
});

routes.get('/forms/:formId/versions/:formVersionId', async (req, res, next) => {
  await controller.readVersion(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}/formUsers:
 *  get:
 *    tags:
 *      - Admin
 *    description: Get all Users added as members to this form and their roles/permissions on the form
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
 *                  userId:
 *                    type: string
 *                    format: uuid
 *                    example: 7cc11a0f-a7c9-4cbe-bd92-a3a22781bc8d
 *                    description: ID of the User. This Id is from the User table in database
 *                  idpUserId:
 *                    type: string
 *                    example: 084F23D7201D4C1B88BB26971264E1F2
 *                    description: IDP id of the user. This is SSO team generated Id
 *                  username:
 *                    type: string
 *                    example: AODOWI
 *                    description: User login username(can be either IDIR username, Basic BCeID (User Id), or Business BCeID (User Id))
 *                  email:
 *                    type: string
 *                    example: test@gov.bc.ca,
 *                    description: User registered email on IDP login details (IDIR, Basic BCeID, or Business BCeID)
 *                  roles:
 *                    type: array
 *                    example: ['form_designer', 'form_submitter', 'owner', 'submission_reviewer', 'team_manager']
 *                    description: List of assigned roles
 *      '403':
 *        $ref: '#/components/responses/Forbidden'
 *      '401':
 *        $ref: '#/components/responses/NoFormAccess'
 * */
routes.get('/forms/:formId/formUsers', async (req, res, next) => {
  await controller.getFormUserRoles(req, res, next);
});

/**
 * @openapi
 * /admin/forms/{formId}/addUser:
 *  put:
 *   tags:
 *    - Admin
 *   description: Get all Users added as members to this form and their roles/permissions on the form
 *   security:
 *    - bearerAuth: []
 *    - basicAuth: []
 *    - openId: []
 *   parameters:
 *    - in: path
 *      name: formId
 *      schema:
 *       type: string
 *       format: uuid
 *      description: ID of the form.
 *      required: true
 *      example: c6455376-382c-439d-a811-0381a012d696
 *    - in: query
 *      name: formId
 *      schema:
 *       type: string
 *       format: uuid
 *      description: ID of the form.
 *      required: true
 *      example: c6455376-382c-439d-a811-0381a012d696
 *    - in: query
 *      name: userId
 *      schema:
 *       type: string
 *       format: uuid
 *      description: ID of the User. This Id is from the User table in database.
 *      required: true
 *      example: 7cc11a0f-a7c9-4cbe-bd92-a2a22781ad9f
 *   requestBody:
 *    required: true
 *    content:
 *      application/json:
 *        schema:
 *          type: object
 *          properties:
 *            formId:
 *              type: string
 *              description: ID of the form
 *              format: uuid
 *              example: c6455376-382c-439d-a811-0381a012d696
 *            userId:
 *              type: string
 *              format: uuid
 *              description: ID of the User. This Id is from the User table in database.
 *              required: true
 *              example: 7cc11a0f-a7c9-4cbe-bd92-a2a22781ad9f
 *            role:
 *              type: string
 *              description: Value must be 'owner'
 *              default: owner
 *              required: true
 *              example: owner
 *   responses:
 *    '200':
 *      description: Success
 *      content:
 *        application/json:
 *          schema:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                userId:
 *                  type: string
 *                  format: uuid
 *                  description: ID of the User. This Id is from the User table in database.
 *                  required: true
 *                  example: 7cc11a0f-a7c9-4cbe-bd92-a2a22781ad9f
 *                idpUserId:
 *                    type: string
 *                    example: 084F23D7201D4C1B88BB26971264E1F2
 *                    description: IDP id of the user. This is SSO team generated Id
 *                username:
 *                  type: string
 *                  example: AODOWI
 *                  description: User login username(can be either IDIR username, Basic BCeID (User Id), or Business BCeID (User Id))
 *                fullName:
 *                  type: string
 *                  example: George Banner,
 *                  description: User registered fullname.
 *                lastName:
 *                  type: string
 *                  example: Banner,
 *                  description: User registered lastname.
 *                email:
 *                  type: string
 *                  example: test@gov.bc.ca,
 *                  description: User registered email on IDP login details (IDIR, Basic BCeID, or Business BCeID)
 *                formId:
 *                  type: string
 *                  description: ID of the form
 *                  format: uuid
 *                  example: c6455376-382c-439d-a811-0381a012d696
 *                formName:
 *                  type: string
 *                  example: BC Gov Form,
 *                  description: Name of the form
 *                label:
 *                  type: string
 *                  example: ''
 *                identityProviders:
 *                  type: array
 *                  example: []
 *                  description: list of identity providers
 *                idps:
 *                  type: array
 *                  example: []
 *                  description: List of idps
 *                active:
 *                  type: boolean
 *                  example: true,
 *                  description: This is used to determine if the form is deleted. A value of false means the form is deleted
 *                formVerisonId:
 *                  type: string
 *                  example: 33707cbd-7e69-4c66-bd2e-88596896a670
 *                  description: Id of the form version
 *                version:
 *                  type: integer
 *                  example: 2
 *                  description: Published version of the form
 *                roles:
 *                  type: array
 *                  example: ['owner']
 *                  description: List of  form assigned roles to user
 *                permissions:
 *                  type: array
 *                  example: ["design_create", "design_delete", "design_read", "design_update", "form_api_create", "form_api_delete", "form_api_read", "form_api_update", "form_delete", "form_read", "form_update", "submission_create", "submission_delete", "submission_read", "submission_update", "team_read", "team_update"]
 *                  description: List of  form assigned permissions to user
 *                published:
 *                  type: boolean
 *                  example: true
 *                  description: This is used to determine if the form is published.
 *                versionUpdatedAt:
 *                  type: string
 *                  format: timestamp
 *                  description: The timestamp the form version was last updated
 *                  example: 2023-06-04T02:46:50.983Z
 *                formDescription:
 *                  type: string
 *                  example: 'This is a form description'
 *                  description: A summary of the form
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 *    '401':
 *      $ref: '#/components/responses/NoFormAccess'
 *    '422':
 *      description: 'Unprocessable Entity'
 *      content:
 *        application/json:
 *          schema:
 *            oneOf:
 *              - $ref: '#/components/schemas/UnprocessableEntityDBError'
 *              - $ref: '#/components/schemas/RoleRequiredValidationError'
 *              - $ref: '#/components/schemas/UserAndFormIdequiredError'
 */
routes.put('/forms/:formId/addUser', async (req, res, next) => {
  await controller.setFormUserRoles(req, res, next);
});

//
// Users
//

/**
 * @openapi
 * /admin/users:
 *  get:
 *   tags:
 *    - Admin
 *   description: Get all Users
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
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  format: uuid
 *                  description: ID of the User. This Id is from the User table in database.
 *                  example: 7cc11a0f-a7c9-4cbe-bd92-a2a22781ad9f
 *                keycloakId:
 *                  type: string
 *                  example: 084F23D7201D4C1B88BB26971264E1F2
 *                  description: Id from the keycloak
 *                idpUserId:
 *                  type: string
 *                  example: 084F23D7201D4C1B88BB26971264E1F2
 *                  description: IDP id of the user. This is SSO team generated Id
 *                firstName:
 *                  type: string
 *                  example: George,
 *                  description: User registered firstname.
 *                username:
 *                  type: string
 *                  example: AODOWI
 *                  description: User login username(can be either IDIR username, Basic BCeID (User Id), or Business BCeID (User Id))
 *                fullName:
 *                  type: string
 *                  example: George Banner,
 *                  description: User registered fullname.
 *                lastName:
 *                  type: string
 *                  example: Banner,
 *                  description: User registered lastname.
 *                email:
 *                  type: string
 *                  example: test@gov.bc.ca,
 *                  description: User registered email on IDP login details (IDIR, Basic BCeID, or Business BCeID)
 *                idpCode:
 *                  type: array
 *                  example: []
 *                  description: List of idps
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
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 */
routes.get('/users', async (req, res, next) => {
  await controller.getUsers(req, res, next);
});

/**
 * @openapi
 * /admin/users/{userId}:
 *  get:
 *    tags:
 *      - Admin
 *    description: Get all Users
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
 *                    format: uuid
 *                    description: ID of the User. This Id is from the User table in database.
 *                    example: 7cc11a0f-a7c9-4cbe-bd92-a2a22781ad9f
 *                  keycloakId:
 *                    type: string
 *                    example: 084F23D7201D4C1B88BB26971264E1F2
 *                    description: Id from the keycloak
 *                  idpUserId:
 *                    type: string
 *                    example: 084F23D7201D4C1B88BB26971264E1F2
 *                    description: IDP id of the user. This is SSO team generated Id
 *                  idpCode:
 *                    type: string
 *                    example: idir
 *                    description: List of idps
 *    '403':
 *      $ref: '#/components/responses/Forbidden'
 *    '404':
 *      $ref: '#/components/responses/ResourceNotFound'
 */
routes.get('/users/:userId', async (req, res, next) => {
  await userController.read(req, res, next);
});

//
//Form componets help info
//

/**
 * @openapi
 * /admin/formcomponents/proactivehelp/object:
 *  post:
 *   tags:
 *    - Admin
 *   description: Create or update proactive help details form.io component
 *   security:
 *    - bearerAuth: []
 *    - basicAuth: []
 *    - openId: []
 *   requestBody:
 *    required: true
 *    content:
 *      application/json:
 *        schema:
 *          type: object
 *          properties:
 *            componentName:
 *              type: string
 *              description: Name of Form.io component
 *              example: File Upload
 *            description:
 *              type: string
 *              description: Full details about the component
 *              example: With the CHEFS form builder, you have access to the 'File Upload' component, which enables you to attach files or documents to the form while submitting it. The maximum file size that can be uploaded using this component is 25MB, and all the files submitted through the form are securely stored in a designated Object storage space.
 *            externalLink:
 *              type: string
 *              description: Link to the external documentation for the component
 *              example: https://help.form.io/userguide/form-building/layout-components#panel
 *            groupName:
 *              type: string
 *              description: Name of the group
 *              example: Basic Layout
 *            image:
 *              type: binary
 *              description: binary image of the component
 *              example: ''
 *            imageName:
 *              type: string
 *              description: name of the image
 *              example: FileUpload.jpg
 *            isLinkEnabled:
 *              type: boolean
 *              description: This hides or shows external link
 *              example: true
 *            status:
 *              type: boolean
 *              description: This determines the publish status of the component.
 *              example: true
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
 *    '422':
 *      $ref: '#/components/responses/UnprocessableEntityDB'
 */
routes.post('/formcomponents/proactivehelp/object', async (req, res, next) => {
  await controller.createFormComponentsProactiveHelp(req, res, next);
});

/**
 * @openapi
 * /admin/formcomponents/proactivehelp/{publishStatus}/{componentId}:
 *  put:
 *   tags:
 *    - Admin
 *   description: Update the selected form.io component proactive help publish status
 *   security:
 *    - bearerAuth: []
 *    - basicAuth: []
 *    - openId: []
 *   parameters:
 *      - in: path
 *        name: publishStatus
 *        schema:
 *          type: boolean
 *        description: publish status of the Firm.io component.
 *        required: true
 *        example: true
 *      - in: path
 *        name: componentId
 *        schema:
 *          type: string
 *        description: Id of the Form.io component. This is a database generated Id.
 *        required: true
 *        example: true
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
 *    '422':
 *      $ref: '#/components/responses/UnprocessableEntityDB'
 */
routes.put('/formcomponents/proactivehelp/:publishStatus/:componentId', async (req, res, next) => {
  await controller.updateFormComponentsProactiveHelp(req, res, next);
});

/**
 * @openapi
 * /admin/formcomponents/proactivehelp/imageUrl/{componentId}:
 *  get:
 *   tags:
 *    - Admin
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

/**
 * @openapi
 * /admin/formcomponents/proactivehelp/list:
 *  get:
 *   tags:
 *    - Admin
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

module.exports = routes;
