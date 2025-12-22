const service = require('./service');

module.exports = {
  /**
   * Creates a document template that can be used to generate a document from
   * a form's submission data.
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  documentTemplateCreate: async (req, res, next) => {
    try {
      const response = await service.documentTemplateCreate(req.params.formId, req.body, req.currentUser.usernameIdp);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deletes an active document template given its ID.
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  documentTemplateDelete: async (req, res, next) => {
    try {
      await service.documentTemplateDelete(req.params.formId, req.params.documentTemplateId, req.currentUser.usernameIdp);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Gets the active document templates for a form.
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  documentTemplateList: async (req, res, next) => {
    try {
      const response = await service.documentTemplateList(req.params.formId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reads an active document template given its ID.
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  documentTemplateRead: async (req, res, next) => {
    try {
      const response = await service.documentTemplateRead(req.params.documentTemplateId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
