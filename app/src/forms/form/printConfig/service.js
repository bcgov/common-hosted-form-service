const Problem = require('api-problem');
const uuid = require('uuid');
const { PrintConfigTypes } = require('../../common/constants');
const { FormPrintConfig, FormPrintConfigTypeCode, DocumentTemplate } = require('../../common/models');

const service = {
  validatePrintConfig: async (data) => {
    if (!data) {
      throw new Problem(422, `'PrintConfig record' cannot be empty.`);
    }
    if (!data.code) {
      throw new Problem(422, `'code' is required.`);
    }

    // Check that code exists in code table
    const typeCode = await FormPrintConfigTypeCode.query().findById(data.code);
    if (!typeCode) {
      throw new Problem(422, `'code' must be a valid print config type code.`);
    }

    // If code is 'direct', validate required fields
    if (data.code === PrintConfigTypes.DIRECT) {
      if (!data.templateId) {
        throw new Problem(422, `'templateId' is required when code is 'direct'.`);
      }
      if (!data.outputFileType) {
        // Default to 'pdf' if not provided
        data.outputFileType = 'pdf';
      }
    } else if (data.code === PrintConfigTypes.DEFAULT) {
      // For default, clear templateId and outputFileType
      data.templateId = null;
      data.outputFileType = null;
    }
  },

  validateTemplate: async (formId, templateId) => {
    if (!templateId) {
      throw new Problem(422, `'templateId' is required.`);
    }

    const template = await DocumentTemplate.query()
      .modify('filterActive', true)
      .modify('filterFormId', formId)
      .findById(templateId)
      .catch(() => null);

    if (!template) {
      throw new Problem(422, `Template not found, inactive, or does not belong to the specified form.`);
    }

    return template;
  },

  readPrintConfig: async (formId) => {
    const result = await FormPrintConfig.query().modify('filterFormId', formId).first();
    return result || null;
  },

  upsert: async (formId, data, currentUser, transaction) => {
    await service.validatePrintConfig(data);

    const externalTrx = transaction != undefined;
    let trx;
    try {
      trx = externalTrx ? transaction : await FormPrintConfig.startTransaction();

      // If code is 'direct', validate template
      if (data.code === PrintConfigTypes.DIRECT) {
        await service.validateTemplate(formId, data.templateId);
      }

      const existing = await FormPrintConfig.query(trx).modify('filterFormId', formId).first();

      if (existing) {
        // Update existing config
        await FormPrintConfig.query(trx).findById(existing.id).patch({
          code: data.code,
          templateId: data.templateId,
          outputFileType: data.outputFileType,
          updatedBy: currentUser.usernameIdp,
        });
      } else {
        // Create new config
        data.id = uuid.v4();
        data.formId = formId;
        await FormPrintConfig.query(trx).insert({
          ...data,
          createdBy: currentUser.usernameIdp,
        });
      }

      if (!externalTrx) await trx.commit();

      // Return the updated/created config
      return await FormPrintConfig.query(externalTrx ? trx : undefined)
        .modify('filterFormId', formId)
        .first();
    } catch (err) {
      if (!externalTrx && trx) await trx.rollback();
      throw err;
    }
  },
};

module.exports = service;
