const routes = require('express').Router();

/**
 * @swagger
 * /books:
 *   get:
 *     description: Get all books
 *     responses:
 *       200:
 *         description: Success
 *
 */
routes.get('/forms', async (req, res) => {
  //res.send({});
  //await controller.listForms(req, res, next);
});

module.exports = routes;
