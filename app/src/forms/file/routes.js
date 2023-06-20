const routes = require('express').Router();
const controller = require('./controller');

const P = require('../common/constants').Permissions;
const { currentFileRecord, hasFileCreate, hasFilePermissions } = require('./middleware/filePermissions');
const middleware = require('../common/middleware');
const fileUpload = require('./middleware/upload').fileUpload;
const { currentUser } = require('../auth/middleware/userAccess');

routes.use(currentUser);

/**
 * @openapi
 * files/:
 *  post:
 *    tags:
 *      - Files
 *    description: Get User details and activities in CHEFS
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
 *              name:
 *                type: string
 *                description: The desired file name
 *                example: hiring_approval_request_form_schema.json
 *              files:
 *                type: string
 *                format: binary
 *                description: Form ID
 *                example: e37705ee-1c01-44eb-ae8a-e7d96002ae67
 *    responses:
 *      '200':
 *        description: Returns User details and all user activities in CHEFS
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  createdAt:
 *                    type: string
 *                    format: date-time
 *                    example: 2020-06-04T18:49:20.672Z
 *                  createdBy:
 *                    type: string
 *                    example: "jsmith@idir"
 *                  id:
 *                    type: string
 *                    format: uuid
 *                    example: aeb3b705-1de5-4f4e-a4e6-0716b7671034
 *                  originalName:
 *                    type: string
 *                    description: Original name of the file
 *                    example: hiring_approval_request_form_schema.json
 *                  size:
 *                    type: integer
 *                    description: File size
 *                    example: 27462
 */
routes.post('/', middleware.publicRateLimiter, hasFileCreate, fileUpload.upload, async (req, res, next) => {
  await controller.create(req, res, next);
});

/**
 * @openapi
 * files/:
 *  get:
 *    tags:
 *      - Files
 *    description: Get User details and activities in CHEFS
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: fileId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the file.
 *        required: true
 *        example: 3cb9acc7-cfd8-4491-b091-1277bc0ec303
 *    responses:
 *      '200':
 *        description: Returns User details and all user activities in CHEFS
 *        content:
 *          application/octet-stream:
 *            schema:
 *              type: string
 *              format: binary
 */
routes.get('/:id', currentFileRecord, hasFilePermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.read(req, res, next);
});

/**
 * @openapi
 * files/:
 *  delete:
 *    tags:
 *      - Files
 *    description: Get User details and activities in CHEFS
 *    security:
 *      - bearerAuth: []
 *      - basicAuth: []
 *      - openId: []
 *    parameters:
 *      - in: path
 *        name: fileId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the file.
 *        required: true
 *        example: 3cb9acc7-cfd8-4491-b091-1277bc0ec303
 *    responses:
 *      '200':
 *        description: Sucess
 */
routes.delete('/:id', currentFileRecord, hasFilePermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.delete(req, res, next);
});

module.exports = routes;
