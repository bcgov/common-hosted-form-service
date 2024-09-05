import { appAxios } from '~/services/interceptors';
import { ApiRoutes } from '~/utils/constants';

export default {
  //
  // Form calls
  //

  /**
   * @function readForm
   * Get the baseline form metadata
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  readForm(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}`);
  },

  /**
   * @function createForm
   * Create a new Form
   * @param {Object} formData An object containing the form details
   * @returns {Promise} An axios response
   */
  createForm(formData) {
    return appAxios().post(`${ApiRoutes.FORMS}`, formData);
  },

  /**
   * @function updateForm
   * Update a Form
   * @param {string} formId The form uuid
   * @param {Object} formData An object containing the form details
   * @returns {Promise} An axios response
   */
  updateForm(formId, formData) {
    return appAxios().put(`${ApiRoutes.FORMS}/${formId}`, formData);
  },

  /**
   * @function deleteForm
   * Soft delete a Form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  deleteForm(formId) {
    return appAxios().delete(`${ApiRoutes.FORMS}/${formId}`);
  },

  /**
   * @function readFormOptions
   * Get pre-flight details for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  readFormOptions(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/options`);
  },

  /**
   * @function getStatusCodes
   * Get the statuses that are available to a form
   * @param {string} formId The form identifier
   * @returns {Promise} An axios response
   */
  getStatusCodes(formId) {
    return appAxios().get(`/forms/${formId}/statusCodes`);
  },

  //
  // Form draft calls
  //

  /**
   * @function createDraft
   * Create a new Form draft
   * @param {string} formId The form uuid
   * @param {Object} data An object containing an updated schema object attribute
   * @returns {Promise} An axios response
   */
  createDraft(formId, data) {
    return appAxios().post(`${ApiRoutes.FORMS}/${formId}/drafts`, data);
  },

  /**
   * @function deleteDraft
   * Delete a Form draft
   * @param {string} formId The form uuid
   * @param {string} formVersionDraftId The form version draft uuid
   * @returns {Promise} An axios response
   */
  deleteDraft(formId, formVersionDraftId) {
    return appAxios().delete(
      `${ApiRoutes.FORMS}/${formId}/drafts/${formVersionDraftId}`
    );
  },

  /**
   * @function listDrafts
   * Get any drafts for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  listDrafts(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/drafts`);
  },

  /**
   * @function publishDraft
   * Publishes a specific form draft
   * @param {string} formId The form uuid
   * @param {string} formVersionDraftId The form version draft uuid
   * @returns {Promise} An axios response
   */
  publishDraft(formId, formVersionDraftId) {
    return appAxios().post(
      `${ApiRoutes.FORMS}/${formId}/drafts/${formVersionDraftId}/publish`
    );
  },

  /**
   * @function readDraft
   * Get a specific draft for a form
   * @param {string} formId The form uuid
   * @param {string} formVersionDraftId The draft uuid
   * @returns {Promise} An axios response
   */
  readDraft(formId, formVersionDraftId) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}/drafts/${formVersionDraftId}`
    );
  },

  /**
   * @function updateDraft
   * Update a draft with a new schema
   * @param {string} formId The form uuid
   * @param {string} formVersionDraftId The draft uuid
   * @param {Object} data The request body
   * @returns {Promise} An axios response
   */
  updateDraft(formId, formVersionDraftId, data) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${formId}/drafts/${formVersionDraftId}`,
      data
    );
  },

  //
  // Form email template calls
  //

  /**
   * @function listEmailTemplates
   * Get all the email templates for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  listEmailTemplates(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/emailTemplates`);
  },

  /**
   * @function updateEmailTemplate
   * Update a form's email template
   * @param {Object} data The request body (containing formId)
   * @returns {Promise} An axios response
   */
  updateEmailTemplate(data) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${data.formId}/emailTemplate`,
      data
    );
  },

  //
  // Form version calls
  //

  /**
   * @function readPublished
   * Get the most recently published form version schema
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  readPublished(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/version`);
  },

  /**
   * @function readVersion
   * Get a specific form version schema
   * @param {string} formId The form uuid
   * @param {string} formVersionId The form version uuid
   * @returns {Promise} An axios response
   */
  readVersion(formId, formVersionId) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}/versions/${formVersionId}`
    );
  },

  /**
   * @function readVersionFields
   * Get a list of valid form fields in this form version
   * @param {string} formId The form uuid
   * @param {string} formVersionId The form version uuid
   * @returns {Promise} An axios response
   */
  readVersionFields(formId, formVersionId) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}/versions/${formVersionId}/fields`
    );
  },

  /**
   * @function publishVersion
   * Publish or unpublish a specific form version. Publishing a verison will unpublish all others.
   * @param {string} formId The form uuid
   * @param {string} formVersionId The form version uuid
   * @param {Boolean} publish True to publish, false to unpublish
   * @returns {Promise} An axios response
   */
  publishVersion(formId, formVersionId, publish) {
    return appAxios().post(
      `${ApiRoutes.FORMS}/${formId}/versions/${formVersionId}/publish`,
      null,
      {
        params: {
          unpublish: !publish,
        },
      }
    );
  },

  /**
   * @function updateVersion
   * Updates a specific form version schema
   * @param {string} formId The form uuid
   * @param {string} formVersionId The form version uuid
   * @param {Object} data An object containing an updated schema object attribute
   * @returns {Promise} An axios response
   */
  updateVersion(formId, formVersionId, data) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${formId}/versions/${formVersionId}`,
      data
    );
  },

  //
  // Form submission calls
  //

  /**
   * @function createSubmission
   * Submit the form data
   * @param {string} formId The form uuid
   * @param {string} versionId The form uuid
   * @param {Object} requestBody The form data for the submission
   * @returns {Promise} An axios response
   */
  createSubmission(formId, versionId, requestBody) {
    return appAxios().post(
      `${ApiRoutes.FORMS}/${formId}/versions/${versionId}/submissions`,
      requestBody
    );
  },

  /**
   * @function createBulkSubmission
   * Submit the form data
   * @param {string} formId The form uuid
   * @param {string} versionId The form uuid
   * @param {Object} requestBody The files data for multi submission
   * @returns {Promise} An axios response
   */
  createMultiSubmission(formId, versionId, requestBody) {
    return appAxios().post(
      `${ApiRoutes.FORMS}/${formId}/versions/${versionId}/multiSubmission`,
      requestBody
    );
  },

  /**
   * @function deleteSubmission
   * Soft delete a specific submission
   * @param {string} submissionId The form submission identifier
   * @returns {Promise} An axios response
   */
  deleteSubmission(submissionId) {
    return appAxios().delete(`${ApiRoutes.SUBMISSION}/${submissionId}`);
  },

  /**
   * @function deleteMultipleSubmissions
   * Soft delete a specific submission
   * @param {array} submissionIds The form submission identifier
   * @returns {Promise} An axios response
   */
  deleteMultipleSubmissions(submissionId, formId, requestBody) {
    return appAxios().delete(
      `${ApiRoutes.SUBMISSION}/${submissionId}/${formId}/submissions`,
      requestBody
    );
  },

  /**
   * @function restoreSubmission
   * Restores an existing submission
   * @param {string} submissionId The form uuid
   * @param {Object} requestBody The form data for the submission
   * @returns {Promise} An axios response
   */
  restoreSubmission(submissionId, requestBody) {
    return appAxios().put(
      `${ApiRoutes.SUBMISSION}/${submissionId}/restore`,
      requestBody
    );
  },

  /**
   * @function restoreMultipleSubmissions
   * Restores an existing submission
   * @param {string} submissionId The form uuid
   * @returns {Promise} An axios response
   */
  restoreMultipleSubmissions(submissionId, formId, requestBody) {
    return appAxios().put(
      `${ApiRoutes.SUBMISSION}/${submissionId}/${formId}/submissions/restore`,
      requestBody
    );
  },

  /**
   * @function updateSubmission
   * Update an existing submission
   * @param {string} submissionId The form uuid
   * @param {Object} requestBody The form data for the submission
   * @returns {Promise} An axios response
   */
  updateSubmission(submissionId, requestBody) {
    return appAxios().put(
      `${ApiRoutes.SUBMISSION}/${submissionId}`,
      requestBody
    );
  },

  /**
   * @function getSubmission
   * Get the form data + version + submission data
   * @param {string} submissionId The form submission identifier
   * @returns {Promise} An axios response
   */
  getSubmission(submissionId) {
    return appAxios().get(`${ApiRoutes.SUBMISSION}/${submissionId}`);
  },

  /**
   * @function getSubmissionOptions
   * Get pre-flight details for a form submission
   * @param {string} submissionId The form submission identifier
   * @returns {Promise} An axios response
   */
  getSubmissionOptions(submissionId) {
    return appAxios().get(`${ApiRoutes.SUBMISSION}/${submissionId}/options`);
  },

  /**
   * @function listSubmissions
   * Get the submissions for a form
   * @param {string} formId The form uuid
   * @param {Object} params the query parameters
   * @returns {Promise} An axios response
   */
  listSubmissions(formId, params = {}) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/submissions`, {
      params,
    });
  },

  /**
   * @function listSubmissionEdits
   * Get the audit history for edits of a submission
   * @param {string} submissionId The submission uuid
   * @returns {Promise} An axios response
   */
  listSubmissionEdits(submissionId) {
    return appAxios().get(`${ApiRoutes.SUBMISSION}/${submissionId}/edits`);
  },

  /**
   * @function readCSVExportFields
   * Get a list of valid form fields in this form version
   * @param {string} formId The form uuid
   * @param {string} type The export type and it is defaulted to submissions
   * @param {string} draft The default value is false
   * @param {string} deleted The default value is false
   * @param {string} version The form version
   * @returns {Promise} An axios response
   */
  readCSVExportFields(formId, type, draft, deleted, version, singleRow) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/csvexport/fields`, {
      params: {
        type: type,
        draft: draft,
        deleted: deleted,
        version: version,
        singleRow: singleRow,
      },
    });
  },

  /**
   * @function exportSubmissions
   * Get the export file for a range of form submittions
   * @param {string} formId The form uuid
   * @param {Array} preference selected fields by the user
   * @param {string} format The export file format csv or json
   * @param {object} options options for the export (eg: minDate, maxDate, deleted, drafts)
   * @returns {Promise} An axios response
   */
  exportSubmissions(
    formId,
    format,
    template,
    versionSelected,
    preference,
    fields,
    emailExport = false,
    options = {}
  ) {
    return appAxios().post(
      `${ApiRoutes.FORMS}/${formId}/export/fields`,
      {
        format: format,
        template: template,
        version: versionSelected,
        type: 'submissions',
        preference: preference,
        fields: fields,
        emailExport,
        ...options,
      },
      {
        responseType: 'blob',
      }
    );
  },

  //
  // Notes and Status
  //

  /**
   * @function getSubmissionNotes
   * Get the notes associated with the submission
   * @param {string} submissionId The form submission identifier
   * @returns {Promise} An axios response
   */
  getSubmissionNotes(submissionId) {
    return appAxios().get(`${ApiRoutes.SUBMISSION}/${submissionId}/notes`);
  },

  /**
   * @function addNote
   * Add a new notes to the submission
   * @param {string} submissionId The form submission identifier
   * @param {Object} data The request body
   * @returns {Promise} An axios response
   */
  addNote(submissionId, data) {
    return appAxios().post(
      `${ApiRoutes.SUBMISSION}/${submissionId}/notes`,
      data
    );
  },

  /**
   * @function getSubmissionStatuses
   * Get the current status history associated with the submission
   * @param {string} submissionId The form submission identifier
   * @returns {Promise} An axios response
   */
  getSubmissionStatuses(submissionId) {
    return appAxios().get(`${ApiRoutes.SUBMISSION}/${submissionId}/status`);
  },

  /**
   * @function docGen
   * Upload a template to generate PDF from CDOGS API
   * @param {string} submissionId The form submission identifier
   * @param {Object} body The request body
   * @returns {Promise} An axios response
   */
  docGen(submissionId, body) {
    return appAxios().post(
      `${ApiRoutes.SUBMISSION}/${submissionId}/template/render`,
      body,
      {
        responseType: 'arraybuffer', // Needed for binaries unless you want pain
        timeout: 30000, // Override default timeout as this call could take a while
      }
    );
  },

  /**
   * @function updateSubmissionStatus
   * Add a new status entry to the submission
   * @param {string} submissionId The form submission identifier
   * @param {Object} data The request body
   * @returns {Promise} An axios response
   */
  updateSubmissionStatus(submissionId, data) {
    return appAxios().post(
      `${ApiRoutes.SUBMISSION}/${submissionId}/status`,
      data
    );
  },

  /**
   * @function getEmailRecipients
   * Get the email recipients for the submission
   * @param {string} submissionId The form submission identifier
   * @returns {Promise} An axios response
   */
  getEmailRecipients(submissionId) {
    return appAxios().get(
      `${ApiRoutes.SUBMISSION}/${submissionId}/emailRecipients`
    );
  },

  /**
   * @function addEmailRecipients
   * Add a new email recipients to the submission
   * @param {string} submissionId The form submission identifier
   * @param {Object} data The request body
   * @returns {Promise} An axios response
   */
  addEmailRecipients(submissionId, data) {
    return appAxios().post(
      `${ApiRoutes.SUBMISSION}/${submissionId}/emailRecipients`,
      data
    );
  },

  //
  // Email
  //

  /**
   * @function requestReceiptEmail
   * Send a receipt email
   * @param {string} submissionId The submission uuid
   * @param {Object} requestBody The body for the api call: { priority, to }
   * @returns {Promise} An axios response
   */
  requestReceiptEmail(submissionId, requestBody) {
    return appAxios().post(
      `${ApiRoutes.SUBMISSION}/${submissionId}/email`,
      requestBody
    );
  },

  /**
   * listFormComponentsProactiveHelp
   * @function listFCProactiveHelp
   * Reads all form components help information
   * @returns {Promise} An axios response
   */
  async listFCProactiveHelp() {
    return await appAxios().get(
      `${ApiRoutes.FORMS}/formcomponents/proactivehelp/list`
    );
  },

  /**
   * @function getPresignedUrl
   * get signed image upload url
   * @param {Object} imageName component name and component image encoded into base64
   * @returns {Promise} An axios response
   */
  async getFCProactiveHelpImageUrl(componentId) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/formcomponents/proactivehelp/imageUrl/${componentId}`
    );
  },

  /**
   * @function readFormSubscriptionData
   * Get the current subscription for the form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  readFormSubscriptionData(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/subscriptions`);
  },

  /**
   * @function updateSubscription
   * Update a subscription settings of a Form
   * @param {string} formId The form uuid
   * @param {Object} subscriptionData An object containing the form subscription details
   * @returns {Promise} An axios response
   */
  updateSubscription(formId, subscriptionData) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${formId}/subscriptions`,
      subscriptionData
    );
  },

  //
  // Document Template (CDOGS)
  //

  /**
   * @function documentTemplateCreate
   * Post a new document template for a form
   * @param {string} formId The form uuid
   * @param {Object} data An object containing the document template details
   * @returns {Promise} An axios response
   */
  documentTemplateCreate(formId, data) {
    return appAxios().post(
      `${ApiRoutes.FORMS}/${formId}/documentTemplates`,
      data
    );
  },

  /**
   * @function documentTemplateDelete
   * Delete a document template for a form
   * @param {string} formId The form uuid
   * @param {string} documentTemplateId The document template uuid
   * @returns {Promise} An axios response
   */
  documentTemplateDelete(formId, documentTemplateId) {
    return appAxios().delete(
      `${ApiRoutes.FORMS}/${formId}/documentTemplates/${documentTemplateId}`
    );
  },

  /**
   * @function documentTemplateRead
   * Read a document template for a form
   * @param {string} formId The form uuid
   * @param {string} documentTemplateId The document template uuid
   * @returns {Promise} An axios response
   */
  documentTemplateRead(formId, documentTemplateId) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}/documentTemplates/${documentTemplateId}`
    );
  },

  /**
   * @function documentTemplateList
   * List all document templates for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  documentTemplateList(formId) {
    return appAxios().get(`${ApiRoutes.FORMS}/${formId}/documentTemplates`);
  },

  /**
   * @function getProxyHeaders
   * Get encrypted header for calling CHEFS proxy.
   * @param {Object} data An object containing formId, versionId, submissionId
   * @returns {Promise} An axios response
   */
  getProxyHeaders(data) {
    return appAxios().post(`${ApiRoutes.PROXY}/headers`, data);
  },

  /**
   * @function externalAPIList
   * List all external API configurations for a form
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  externalAPIList(formId) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.EXTERNAL_APIS}`
    );
  },

  /**
   * @function externalAPICreate
   * Create a new External API record
   * @param {string} formId The form uuid
   * @param {Object} data An object containing an External API record
   * @returns {Promise} An axios response
   */
  externalAPICreate(formId, data) {
    return appAxios().post(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.EXTERNAL_APIS}`,
      data
    );
  },

  /**
   * @function externalAPIUpdate
   * Update an External API record
   * @param {string} formId The form uuid
   * @param {string} id The external API uuid
   * @param {Object} data An object containing an External API record
   * @returns {Promise} An axios response
   */
  externalAPIUpdate(formId, id, data) {
    return appAxios().put(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.EXTERNAL_APIS}/${id}`,
      data
    );
  },

  /**
   * @function externalAPIDelete
   * Delete a document template for a form
   * @param {string} formId The form uuid
   * @param {string} id The external API uuid
   * @returns {Promise} An axios response
   */
  externalAPIDelete(formId, id) {
    return appAxios().delete(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.EXTERNAL_APIS}/${id}`
    );
  },
  /**
   * @function externalAPIAlgorithmList
   * List all external API configurations
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  externalAPIAlgorithmList(formId) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.EXTERNAL_APIS}/algorithms`
    );
  },
  /**
   * @function externalAPIStatusCodes
   * List all external API status codes
   * @param {string} formId The form uuid
   * @returns {Promise} An axios response
   */
  externalAPIStatusCodes(formId) {
    return appAxios().get(
      `${ApiRoutes.FORMS}/${formId}${ApiRoutes.EXTERNAL_APIS}/statusCodes`
    );
  },
};
