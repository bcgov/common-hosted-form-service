// Responses for the web component endpoints carry only what a component release reads

/**
 * Builds the { form, schema } response for a web component from a published form.
 * The form keeps its name and description (also passed to the host in formio:loadSchema),
 * the settings that shape drafts and what follows a submit, and its identity provider codes.
 * The schema is the published version's, without the names of who created or changed it.
 *
 * @param {Object} publishedForm - Published form from formService.readPublishedForm
 * @returns {Object} { form, schema }
 */
function formSchemaResponse(publishedForm) {
  const source = publishedForm.versions?.[0]?.schema || publishedForm.schema;
  const schema = source && typeof source === 'object' ? { ...source } : source;
  if (schema && typeof schema === 'object') {
    delete schema.createdBy;
    delete schema.updatedBy;
  }
  return {
    form: {
      name: publishedForm.name,
      description: publishedForm.description,
      showSubmissionConfirmation: publishedForm.showSubmissionConfirmation,
      hideSubmissionContentOnSuccess: publishedForm.hideSubmissionContentOnSuccess,
      enableSubmitterDraft: publishedForm.enableSubmitterDraft,
      identityProviders: (publishedForm.identityProviders || []).map(({ code }) => ({ code })),
    },
    schema,
  };
}

/**
 * Builds the read-submission response for a web component. The component only prefills
 * the submitted data, so that is all it gets, in the shape every release reads.
 *
 * @param {Object} read - { submission, version, form } from submissionService.read
 * @returns {Object} { submission: { submission: { data } } }
 */
function submissionResponse(read) {
  return { submission: { submission: { data: read?.submission?.submission?.data ?? {} } } };
}

/**
 * Builds the submit response for a web component. The component needs the id to reload
 * a keyed submission and passes the confirmation id and time to the host.
 *
 * @param {Object} submission - The saved submission from formService.createSubmission
 * @returns {Object} { id, confirmationId, createdAt, draft }
 */
function submitResponse(submission) {
  return {
    id: submission.id,
    confirmationId: submission.confirmationId,
    createdAt: submission.createdAt,
    draft: submission.draft === true,
  };
}

module.exports = { formSchemaResponse, submissionResponse, submitResponse };
