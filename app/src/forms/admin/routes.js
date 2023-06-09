//const config = require('config');
const routes = require('express').Router();

//const currentUser = require('../auth/middleware/userAccess').currentUser;

const controller = require('./controller');
const userController = require('../user/controller');
//const keycloak = require('../../components/keycloak');

// Always have this applied to all routes here
//routes.use(keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`));
//routes.use(currentUser);

// Routes under the /admin pathing will fetch data without doing Form permission checks in the database
// As such, this should ALWAYS remain under the :admin role check and that KC role should not be given out
// other than to people who have permission to read all data

//
// Forms
//

routes.get('/forms', async (req, res, next) => {
  await controller.listForms(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}:
 *  get:
 *    tags:
 *      - Form
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
 *                  example: true,
 *                  description: ''
 *                submissionReceivedEmails: [],
 *                enableStatusUpdates:
 *                  type: boolean
 *                  example: true,
 *                  description: Enables or disables form reviewers from updating this form status (i.e. Submitted, Assigned, Completed)
 *                enableSubmitterDraft:
 *                  type: boolean
 *                  example: true,
 *                  description: Enables or disables form submitters from saving or editing this form draft
 *                schedule: {},
 *                reminder_enabled: false,
 *                enableCopyExistingSubmission: false,
 *                allowSubmitterToUploadFile: false,
 *                identityProviders: [],
                  versions:
                      - FormVersion
                          id: '33707cbd-7e69-4c66-bd2e-88596896a670',
                          formId: '306040aa-c045-46d9-8a5a-78bd6fc7c644',
                          version: 2,
                          published: true,
                          createdBy: 'AIDOWU@idir',
                          createdAt: '2023-05-18T20:11:41.329Z',
                          updatedBy: null,
                          updatedAt: '2023-05-18T20:11:41.241Z'
 */
routes.get('/forms/:formId', async (req, res, next) => {
  await controller.readForm(req, res, next);
});

routes.delete('/forms/:formId/apiKey', async (req, res, next) => {
  await controller.deleteApiKey(req, res, next);
});

routes.get('/forms/:formId/apiKey', async (req, res, next) => {
  await controller.readApiDetails(req, res, next);
});

routes.put('/forms/:formId/restore', async (req, res, next) => {
  await controller.restoreForm(req, res, next);
});

routes.get('/forms/:formId/versions/:formVersionId', async (req, res, next) => {
  await controller.readVersion(req, res, next);
});

routes.get('/forms/:formId/formUsers', async (req, res, next) => {
  await controller.getFormUserRoles(req, res, next);
});

routes.put('/forms/:formId/addUser', async (req, res, next) => {
  await controller.setFormUserRoles(req, res, next);
});

//
// Users
//
routes.get('/users', async (req, res, next) => {
  await controller.getUsers(req, res, next);
});

routes.get('/users/:userId', async (req, res, next) => {
  await userController.read(req, res, next);
});

//
//Form componets help info
//

routes.post('/formcomponents/proactivehelp/object', async (req, res, next) => {
  await controller.createFormComponentsProactiveHelp(req, res, next);
});

routes.put('/formcomponents/proactivehelp/:publishStatus/:componentId', async (req, res, next) => {
  await controller.updateFormComponentsProactiveHelp(req, res, next);
});

routes.get('/formcomponents/proactivehelp/imageUrl/:componentId', async (req, res, next) => {
  await controller.getFCProactiveHelpImageUrl(req, res, next);
});

routes.get('/formcomponents/proactivehelp/list', async (req, res, next) => {
  await controller.listFormComponentsProactiveHelp(req, res, next);
});

module.exports = routes;
