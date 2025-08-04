const { validate } = require('uuid');
const fs = require('fs');
const path = require('path');

const service = require('../../../forms/form/service');

module.exports = {
  /**
   * Public endpoint to retrieve form schema for web component
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  readFormSchema: async (req, res, next) => {
    try {
      const formId = req.params.formId;
      if (!validate(formId)) {
        res.status(400).json({ detail: `Bad formId "${formId}".` });
        return;
      }

      // Get the published form data
      const response = await service.readPublishedForm(formId, req.query);

      // Return the form schema in the format expected by the web component
      res.status(200).json({
        form: response,
        schema: response.versions?.[0]?.schema || response.schema,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Public endpoint to submit form data from web component
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  createSubmission: async (req, res, next) => {
    try {
      const formId = req.params.formId;
      if (!validate(formId)) {
        res.status(400).json({ detail: `Bad formId "${formId}".` });
        return;
      }

      // Get the published form to get the version ID
      const form = await service.readPublishedForm(formId);
      const versionId = form.versions?.[0]?.id;

      if (!versionId) {
        res.status(400).json({ detail: 'No published version found for this form.' });
        return;
      }

      // Create a mock user for external submissions
      const externalUser = {
        id: 'external-user',
        usernameIdp: 'external',
        username: 'external-user',
      };

      // Create the submission
      const response = await service.createSubmission(versionId, req.body, externalUser);

      // we need to do other stuff, emails, notification, etc.

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Public endpoint to serve custom Form.io components
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  getCustomComponents: async (req, res, next) => {
    try {
      // Serve the built custom components bundle
      const componentsPath = path.join(__dirname, '../../../../../components/dist/bcgov-formio-components.js');

      if (fs.existsSync(componentsPath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        const components = fs.readFileSync(componentsPath, 'utf8');
        res.send(components);
      } else {
        res.status(404).json({ detail: 'Custom components not found' });
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Public endpoint to serve BC Gov styling
   *
   * @param {Object} req the Express object representing the HTTP request
   * @param {Object} res the Express object representing the HTTP response
   * @param {Object} next the Express chaining function
   */
  getBcGovStyles: async (req, res, next) => {
    try {
      // Serve the BC Gov styling bundle
      const stylesPath = path.join(__dirname, '../../../../../components/dist/bcgov-webcomponent-styles.css');

      if (fs.existsSync(stylesPath)) {
        res.setHeader('Content-Type', 'text/css');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        const styles = fs.readFileSync(stylesPath, 'utf8');
        res.send(styles);
      } else {
        res.status(404).json({ detail: 'BC Gov styles not found' });
      }
    } catch (error) {
      next(error);
    }
  },
};
