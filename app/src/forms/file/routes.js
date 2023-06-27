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
 * /files/:
 *  post:
 *    tags:
 *      - Files
 *    description: This endpoint will store the uploaded file or files in the CHEFS object storage facility.
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
 *                description: The desired file name.
 *                example: hiring_approval_request_form_schema.json
 *              files:
 *                type: string
 *                format: binary
 *                description: The actual files to upload.
 *    responses:
 *      '200':
 *        description: Returns the file or files uploaded details.
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
 *                    example: 551ddc09-27cc-483c-8439-a277d4bfbfbb
 *                    description: ID of the file
 *                  createdBy:
 *                    type: string
 *                    example: "jsmith@idir"
 *                  createdAt:
 *                    type: string
 *                    format: uuid
 *                    example: 2023-06-21T14:22:19.979Z
 *                  originalName:
 *                    type: string
 *                    description: Original name of the file
 *                    example: hiring_approval_request_form_schema.json
 *                  size:
 *                    type: integer
 *                    description: File size
 *                    example: 27462
 *      '401':
 *        $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post('/', middleware.publicRateLimiter, hasFileCreate, fileUpload.upload, async (req, res, next) => {
  await controller.create(req, res, next);
});

/**
 * @openapi
 * /files/:
 *  get:
 *    tags:
 *      - Files
 *    description: This endpoint will fetch a file from the CHEFS object storage facility.
 *    security:
 *      - bearerAuth: []
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
 *        description: Returns file binary data.
 *        content:
 *          application/octet-stream:
 *            schema:
 *              type: string
 *              format: binary
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:id', currentFileRecord, hasFilePermissions(P.SUBMISSION_READ), async (req, res, next) => {
  await controller.read(req, res, next);
});

/**
 * @openapi
 * /files/:
 *  delete:
 *    tags:
 *      - Files
 *    description: This endpoint will delete a file from the CHEFS object storage facility.
 *    security:
 *      - bearerAuth: []
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
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.delete('/:id', currentFileRecord, hasFilePermissions(P.SUBMISSION_UPDATE), async (req, res, next) => {
  await controller.delete(req, res, next);
});

module.exports = routes;
