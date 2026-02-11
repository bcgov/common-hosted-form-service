const Problem = require('api-problem');
const uuid = require('uuid');
const { PrintConfigTypes } = require('../../common/constants');
const { FormPrintConfig, FormPrintConfigTypeCode, DocumentTemplate } = require('../../common/models');

// Query helpers - extracted for easier mocking in tests
const queryHelpers = {
  findTypeCodeById: async (code) => {
    return await FormPrintConfigTypeCode.query().findById(code);
  },

  findTemplateById: async (formId, templateId) => {
    return await DocumentTemplate.query()
      .modify('filterActive', true)
      .modify('filterFormId', formId)
      .findById(templateId)
      .catch(() => null);
  },

  findPrintConfigByFormId: async (formId, trx) => {
    return await FormPrintConfig.query(trx).modify('filterFormId', formId).first();
  },

  startTransaction: async () => {
    return await FormPrintConfig.startTransaction();
  },

  updatePrintConfig: async (id, data, trx) => {
    return await FormPrintConfig.query(trx).findById(id).patch(data);
  },

  createPrintConfig: async (data, trx) => {
    return await FormPrintConfig.query(trx).insert(data);
  },
};

const service = {
  validatePrintConfig: async (data) => {
    if (!data) {
      throw new Problem(422, `'PrintConfig record' cannot be empty.`);
    }
    if (!data.code) {
      throw new Problem(422, `'code' is required.`);
    }

    // Check that code exists in code table
    const typeCode = await queryHelpers.findTypeCodeById(data.code);
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

    const template = await queryHelpers.findTemplateById(formId, templateId);

    if (!template) {
      throw new Problem(422, `Template not found, inactive, or does not belong to the specified form.`);
    }

    return template;
  },

  readPrintConfig: async (formId) => {
    const result = await queryHelpers.findPrintConfigByFormId(formId);
    return result || null;
  },

  upsert: async (formId, data, currentUser, transaction) => {
    await service.validatePrintConfig(data);

    const externalTrx = transaction != undefined;
    let trx;
    try {
      trx = externalTrx ? transaction : await queryHelpers.startTransaction();

      // If code is 'direct', validate template
      if (data.code === PrintConfigTypes.DIRECT) {
        await service.validateTemplate(formId, data.templateId);
      }

      const existing = await queryHelpers.findPrintConfigByFormId(formId, trx);

      if (existing) {
        // Update existing config
        await queryHelpers.updatePrintConfig(
          existing.id,
          {
            code: data.code,
            templateId: data.templateId,
            outputFileType: data.outputFileType,
            reportName: data.reportName || null,
            reportNameOption: data.reportNameOption || null,
            updatedBy: currentUser.usernameIdp,
          },
          trx
        );
      } else {
        // Create new config
        data.id = uuid.v4();
        data.formId = formId;
        await queryHelpers.createPrintConfig(
          {
            ...data,
            createdBy: currentUser.usernameIdp,
          },
          trx
        );
      }

      if (!externalTrx) await trx.commit();

      // Return the updated/created config
      return await queryHelpers.findPrintConfigByFormId(formId, externalTrx ? trx : undefined);
    } catch (err) {
      if (!externalTrx && trx) await trx.rollback();
      throw err;
    }
  },
};

// Export query helpers for testing
service._queryHelpers = queryHelpers;

module.exports = service;
