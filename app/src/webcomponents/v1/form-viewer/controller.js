const { validate } = require('uuid');
const fs = require('node:fs');
const path = require('node:path');

const service = require('../../../forms/form/service');
const { formSchemaResponse, submissionResponse, submitResponse } = require('../../common/responses');
const { releaseDir } = require('../../common/releases');

// Frozen v1 custom components and styles
const formViewerDir = path.join(releaseDir('v1'), 'form-viewer');

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

      // runtime-auth has loaded the active published form from the path
      res.status(200).json(formSchemaResponse(req.securityContext.resource.form));
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

      // runtime-auth has loaded the active published form from the path
      const { form } = req.securityContext.resource;
      const versionId = form.versions?.[0]?.id;

      if (!versionId) {
        res.status(400).json({ detail: 'No published version found for this form.' });
        return;
      }

      // A draft needs a form that allows drafts. A Public form never does: there is no account to return to it.
      const isPublicForm = form.identityProviders?.some((idp) => idp.code === 'public');
      if (req.body?.draft && (!form.enableSubmitterDraft || isPublicForm)) {
        res.status(403).json({ detail: 'This form does not allow saving drafts.' });
        return;
      }

      // Create the submission
      const response = await service.createSubmission(versionId, req.body, req.currentUser);

      res.status(201).json(submitResponse(response));
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
      // runtime-auth has read the submission and checked it belongs to the form in the path
      res.status(200).json(submissionResponse({ submission: req.securityContext.resource.submission }));
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
      const componentsPath = path.join(formViewerDir, 'bcgov-formio-components.use.min.js');
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
      const stylesPath = path.join(formViewerDir, 'chefs-form-viewer.css');
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
      const themePath = path.join(formViewerDir, 'bcgov-theme.css');
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
