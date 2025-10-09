const { validate } = require('uuid');
const fs = require('node:fs');
const path = require('node:path');

const service = require('../../../forms/form/service');
const submissionService = require('../../../forms/submission/service');

module.exports = {
  /**
   * Public endpoint to retrieve form schema for web component
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

      // Placeholder for notifications/integrations
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Public endpoint to read a submission for web component
   */
  readSubmission: async (req, res, next) => {
    try {
      const formId = req.params.formId;
      const submissionId = req.params.formSubmissionId;
      if (!validate(formId)) {
        res.status(400).json({ detail: `Bad formId "${formId}".` });
        return;
      }
      if (!validate(submissionId)) {
        res.status(400).json({ detail: `Bad submissionId "${submissionId}".` });
        return;
      }
      // Read the submission using the service
      // Replicate /api/v1/submission/<id> call.
      const submission = await submissionService.read(submissionId);
      if (!submission) {
        res.status(404).json({ detail: 'Submission not found' });
        return;
      }
      res.status(200).json(submission);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Public endpoint to serve custom Form.io components
   */
  getCustomComponents: async (req, res, next) => {
    try {
      // Serve the built custom components bundle (chefs-form-viewer only)
      const componentsPath = path.join(__dirname, '../../../../../components/dist/bcgov-formio-components.use.min.js');
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
   */
  getBcGovStyles: async (_req, res, next) => {
    try {
      // Serve the base chefs-form-viewer CSS
      const stylesPath = path.join(__dirname, '../../../../../components/dist/chefs-form-viewer.css');
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

  getBcGovTheme: async (_req, res, next) => {
    try {
      // Serve the BCGov theme CSS for chefs-form-viewer
      const themePath = path.join(__dirname, '../../../../../components/dist/bcgov-theme.css');
      if (fs.existsSync(themePath)) {
        res.setHeader('Content-Type', 'text/css');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        const css = fs.readFileSync(themePath, 'utf8');
        res.send(css);
      } else {
        res.status(404).json({ detail: 'BC Gov theme not found' });
      }
    } catch (error) {
      next(error);
    }
  },
};
