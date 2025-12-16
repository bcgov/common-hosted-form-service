const uuid = require('uuid');
const { DocumentTemplate } = require('../../common/models');

const service = {
  /**
   * Creates a document template that can be used to generate a document from
   * a form's submission data.
   *
   * @param {uuid} formId the identifier for the form.
   * @param {object} data the data for the document template.
   * @param {string} currentUsername the currently logged in user's username.
   * @returns the created object.
   */
  documentTemplateCreate: async (formId, data, currentUsername) => {
    let trx;

    try {
      const documentTemplate = {
        id: uuid.v4(),
        formId: formId,
        filename: data.filename,
        template: data.template,
        createdBy: currentUsername,
      };

      trx = await DocumentTemplate.startTransaction();
      await DocumentTemplate.query(trx).insert(documentTemplate);
      await trx.commit();

      const result = await service.documentTemplateRead(documentTemplate.id);

      return result;
    } catch (error) {
      if (trx) {
        await trx.rollback();
      }

      throw error;
    }
  },

  /**
   * Deletes an active document template given its ID.
   *
   * @param {uuid} documentTemplateId the id of the document template.
   * @param {string} currentUsername the currently logged in user's username.
   * @throws an Error if the document template does not exist.
   */
  documentTemplateDelete: async (documentTemplateId, currentUsername) => {
    let trx;
    try {
      trx = await DocumentTemplate.startTransaction();
      await DocumentTemplate.query(trx).patchAndFetchById(documentTemplateId, {
        active: false,
        updatedBy: currentUsername,
      });
      await trx.commit();
    } catch (error) {
      if (trx) {
        await trx.rollback();
      }

      throw error;
    }
  },

  /**
   * Gets the active document templates for a form.
   *
   * @param {uuid} formId the identifier for the form.
   * @returns a Promise for the document templates belonging to a form.
   */
  documentTemplateList: (formId) => {
    return DocumentTemplate.query().modify('filterFormId', formId).modify('filterActive', true);
  },

  /**
   * Reads an active document template given its ID.
   *
   * @param {uuid} documentTemplateId the id of the document template.
   * @returns a Promise for the document template.
   * @throws an Error if the document template does not exist.
   */
  documentTemplateRead: (documentTemplateId) => {
    return DocumentTemplate.query().findById(documentTemplateId).modify('filterActive', true).throwIfNotFound();
  },
};

module.exports = service;
