const Problem = require('api-problem');
const { ref } = require('objection');
const { v4: uuidv4 } = require('uuid');
const { EmailTypes } = require('../common/constants');
const eventService = require('../event/eventService');
const moment = require('moment');
const {
  DocumentTemplate,
  FileStorage,
  Form,
  FormApiKey,
  FormEmailTemplate,
  FormIdentityProvider,
  FormRoleUser,
  FormVersion,
  FormVersionDraft,
  FormStatusCode,
  FormSubmission,
  FormSubmissionStatus,
  FormSubmissionUser,
  IdentityProvider,
  SubmissionMetadata,
  FormComponentsProactiveHelp,
  FormSubscription,
} = require('../common/models');
const { falsey, queryUtils, checkIsFormExpired, validateScheduleObject, typeUtils } = require('../common/utils');
const { Permissions, Roles, Statuses } = require('../common/constants');
const formMetadataService = require('./formMetadata/service');
const Rolenames = [Roles.OWNER, Roles.TEAM_MANAGER, Roles.FORM_DESIGNER, Roles.SUBMISSION_REVIEWER, Roles.FORM_SUBMITTER, Roles.SUBMISSION_APPROVER];

const service = {
  _findFileIds: (schema, data) => {
    const findFiles = (currentData) => {
      let fileIds = [];
      // Check if the current level is an array or an object
      if (Array.isArray(currentData)) {
        currentData.forEach((item) => {
          fileIds = fileIds.concat(findFiles(item));
        });
      } else if (typeof currentData === 'object' && currentData !== null) {
        Object.keys(currentData).forEach((key) => {
          if (key === 'data' && currentData[key] && currentData[key].id) {
            // Add the file ID if it exists
            fileIds.push(currentData[key].id);
          } else {
            // Recurse into nested objects
            fileIds = fileIds.concat(findFiles(currentData[key]));
          }
        });
      }
      return fileIds;
    };

    // Start the search from the top-level submission data
    return findFiles(data.submission.data);
  },

  listForms: async (params) => {
    params = queryUtils.defaultActiveOnly(params);
    return Form.query()
      .modify('filterActive', params.active)
      .allowGraph('[identityProviders,versions]')
      .withGraphFetched('identityProviders(orderDefault)')
      .withGraphFetched('versions(selectWithoutSchema, orderVersionDescending)')
      .modify('orderNameAscending');
  },

  createForm: async (data, currentUser) => {
    let trx;
    const scheduleData = validateScheduleObject(data.schedule);
    if (scheduleData.status !== 'success') {
      throw new Problem(422, `${scheduleData.message}`);
    }

    try {
      trx = await Form.startTransaction();
      const obj = {};
      obj.id = uuidv4();
      obj.name = data.name;
      obj.description = data.description;
      obj.active = true;
      obj.labels = data.labels;
      obj.showSubmissionConfirmation = data.showSubmissionConfirmation;
      obj.sendSubmissionReceivedEmail = data.sendSubmissionReceivedEmail;
      obj.submissionReceivedEmails = data.submissionReceivedEmails;
      obj.enableStatusUpdates = data.enableStatusUpdates;
      obj.enableSubmitterDraft = data.enableSubmitterDraft;
      obj.createdBy = currentUser.usernameIdp;
      obj.allowSubmitterToUploadFile = data.allowSubmitterToUploadFile;
      obj.schedule = data.schedule;
      obj.subscribe = data.subscribe;
      obj.reminder_enabled = data.reminder_enabled;
      obj.enableCopyExistingSubmission = data.enableCopyExistingSubmission;
      obj.wideFormLayout = data.wideFormLayout;
      obj.deploymentLevel = data.deploymentLevel;
      obj.ministry = data.ministry;
      obj.apiIntegration = data.apiIntegration;
      obj.useCase = data.useCase;

      await Form.query(trx).insert(obj);
      if (data.identityProviders && Array.isArray(data.identityProviders) && data.identityProviders.length) {
        const fips = [];
        for (const p of data.identityProviders) {
          const exists = await IdentityProvider.query(trx).where('code', p.code).where('active', true).first();
          if (!exists) {
            throw new Problem(422, `${p.code} is not a valid Identity Provider code`);
          }
          fips.push({ id: uuidv4(), formId: obj.id, code: p.code, createdBy: currentUser.usernameIdp });
        }
        await FormIdentityProvider.query(trx).insert(fips);
      }
      // make this user have ALL the roles...
      const userRoles = Rolenames.map((r) => {
        return { id: uuidv4(), createdBy: currentUser.usernameIdp, userId: currentUser.id, formId: obj.id, role: r };
      });
      await FormRoleUser.query(trx).insert(userRoles);

      // create a unpublished draft
      const draft = {
        id: uuidv4(),
        formId: obj.id,
        createdBy: currentUser.usernameIdp,
        schema: data.schema,
      };
      await FormVersionDraft.query(trx).insert(draft);

      // Map all status codes to the form - hardcoded to include all states
      // TODO: Could make this more dynamic and settable by the user if that feature is required
      const defaultStatuses = Object.values(Statuses).map((status) => ({
        id: uuidv4(),
        formId: obj.id,
        code: status,
        createdBy: currentUser.usernameIdp,
      }));
      await FormStatusCode.query(trx).insert(defaultStatuses);

      await formMetadataService.upsert(obj.id, data.formMetadata, currentUser, trx);

      await trx.commit();
      const result = await service.readForm(obj.id);
      result.draft = draft;
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  updateForm: async (formId, data, currentUser) => {
    let trx;
    try {
      const obj = await service.readForm(formId);
      trx = await Form.startTransaction();
      // do not update the active flag, that should be done via DELETE
      const scheduleData = validateScheduleObject(data.schedule);
      if (scheduleData.status !== 'success') {
        throw new Problem(422, `${scheduleData.message}`);
      }
      const upd = {
        name: data.name,
        description: data.description,
        labels: data.labels ? data.labels : [],
        showSubmissionConfirmation: data.showSubmissionConfirmation,
        sendSubmissionReceivedEmail: data.sendSubmissionReceivedEmail,
        submissionReceivedEmails: data.submissionReceivedEmails ? data.submissionReceivedEmails : [],
        enableStatusUpdates: data.enableStatusUpdates,
        enableSubmitterDraft: data.enableSubmitterDraft,
        updatedBy: currentUser.usernameIdp,
        allowSubmitterToUploadFile: data.allowSubmitterToUploadFile,
        schedule: data.schedule,
        subscribe: data.subscribe,
        reminder_enabled: data.reminder_enabled,
        enableCopyExistingSubmission: data.enableCopyExistingSubmission,
        deploymentLevel: data.deploymentLevel,
        wideFormLayout: data.wideFormLayout,
        ministry: data.ministry,
        apiIntegration: data.apiIntegration,
        useCase: data.useCase,
      };

      await Form.query(trx).patchAndFetchById(formId, upd);

      // remove any existing links to identity providers, and the updated ones
      await FormIdentityProvider.query(trx).delete().where('formId', obj.id);

      // insert any new identity providers
      const fIdps = data.identityProviders.map((p) => ({
        id: uuidv4(),
        formId: obj.id,
        code: p.code,
        createdBy: currentUser.usernameIdp,
      }));
      if (fIdps && fIdps.length) await FormIdentityProvider.query(trx).insert(fIdps);

      await formMetadataService.upsert(obj.id, data.formMetadata, currentUser, trx);

      await trx.commit();
      const result = await service.readForm(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  deleteForm: async (formId, params, currentUser) => {
    let trx;
    try {
      const obj = await service.readForm(formId);
      trx = await Form.startTransaction();
      // for now, only handle a soft delete, we could pass in a param to do a hard delete later
      await Form.query(trx).patchAndFetchById(formId, { active: false, updatedBy: currentUser.usernameIdp });

      // If there's a current API key, hard delete that
      if (await service.readApiKey(formId)) {
        await service.deleteApiKey(formId);
      }

      await trx.commit();
      return await service.readForm(obj.id, { active: false });
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readForm: (formId, params = {}) => {
    params = queryUtils.defaultActiveOnly(params);
    return Form.query()
      .findById(formId)
      .modify('filterActive', params.active)
      .allowGraph('[formMetadata,identityProviders,versions]')
      .withGraphFetched('formMetadata')
      .withGraphFetched('identityProviders(orderDefault)')
      .withGraphFetched('versions(selectWithoutSchema, orderVersionDescending)')
      .throwIfNotFound();
  },

  readFormOptions: (formId, params = {}) => {
    params = queryUtils.defaultActiveOnly(params);
    return Form.query()
      .findById(formId)
      .modify('filterActive', params.active)
      .select(['id', 'name', 'description'])
      .allowGraph('[idpHints]')
      .withGraphFetched('idpHints')
      .throwIfNotFound()
      .then((form) => {
        form.idpHints = form.idpHints.map((idp) => idp.idp);
        return form;
      });
  },

  readPublishedForm: (formId, params = {}) => {
    params = queryUtils.defaultActiveOnly(params);
    return Form.query()
      .findById(formId)
      .modify('filterActive', params.active)
      .allowGraph('[identityProviders,versions]')
      .withGraphFetched('identityProviders(orderDefault)')
      .withGraphFetched('versions(onlyPublished)')
      .throwIfNotFound()
      .then((form) => {
        // there are some configs that we don't want returned here...
        delete form.submissionReceivedEmails;
        //Lets Replace the original schedule Object as it should not expose schedule data to FE users.
        form.schedule = checkIsFormExpired(form.schedule);
        return form;
      });
  },

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
        id: uuidv4(),
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

  listFormSubmissions: async (formId, params) => {
    const query = SubmissionMetadata.query()
      .where('formId', formId)
      .modify('filterSubmissionId', params.submissionId)
      .modify('filterConfirmationId', params.confirmationId)
      .modify('filterDraft', params.draft)
      .modify('filterDeleted', params.deleted)
      .modify('filterCreatedBy', params.createdBy)
      .modify('filterFormVersionId', params.formVersionId)
      .modify('filterVersion', params.version)
      .modify('filterformSubmissionStatusCode', params.filterformSubmissionStatusCode)
      .modify('orderDefault', params.sortBy && params.page ? true : false, params);

    if (params.createdAt && Array.isArray(params.createdAt) && params.createdAt.length === 2) {
      query.modify('filterCreatedAt', params.createdAt[0], params.createdAt[1]);
    }

    const selection = ['confirmationId', 'createdAt', 'formId', 'formSubmissionStatusCode', 'submissionId', 'deleted', 'createdBy', 'formVersionId'];

    let fields = [];
    if (params.fields && params.fields.length) {
      if (typeof params.fields !== 'string' && params.fields.includes('updatedAt')) {
        selection.push('updatedAt');
      }
      if (typeof params.fields !== 'string' && params.fields.includes('updatedBy')) {
        selection.push('updatedBy');
      }
      if (Array.isArray(params.fields)) {
        fields = params.fields.flatMap((f) => f.split(',').map((s) => s.trim()));
      } else {
        fields = params.fields.split(',').map((s) => s.trim());
      }

      // Remove updatedAt and updatedBy so they won't be pulled from submission
      // columns. Also remove empty values to handle the case of trailing commas
      // and other malformed data too.
      fields = fields.filter((f) => f !== 'updatedAt' && f !== 'updatedBy' && f.trim() !== '');
    }

    fields.push('lateEntry');

    if (params.sortBy?.column && !selection.includes(params.sortBy.column) && !fields.includes(params.sortBy.column)) {
      throw new Problem(400, {
        details: `orderBy column '${params.sortBy.column}' not in selected columns`,
      });
    }

    query.select(
      selection,
      fields.map((f) => ref(`submission:data.${f}`).as(f.split('.').slice(-1)))
    );

    if (params.paginationEnabled) {
      return await service.processPaginationData(query, parseInt(params.page), parseInt(params.itemsPerPage), params.totalSubmissions, params.search, params.searchEnabled);
    }

    return query;
  },

  async processPaginationData(query, page, itemsPerPage, totalSubmissions, search, searchEnabled) {
    let isSearchAble = typeUtils.isBoolean(searchEnabled) ? searchEnabled : searchEnabled !== undefined ? JSON.parse(searchEnabled) : false;
    if (isSearchAble) {
      let submissionsData = await query;
      let result = {
        results: [],
        total: 0,
      };
      let searchedData = submissionsData.filter((data) => {
        return Object.keys(data).some((key) => {
          if (key !== 'submissionId' && key !== 'formVersionId' && key !== 'formId') {
            if (!Array.isArray(data[key]) && !typeUtils.isObject(data[key])) {
              if (
                !typeUtils.isBoolean(data[key]) &&
                !typeUtils.isNil(data[key]) &&
                typeUtils.isDate(data[key]) &&
                moment(new Date(data[key])).format('YYYY-MM-DD hh:mm:ss a').toString().includes(search)
              ) {
                result.total = result.total + 1;
                return true;
              }
              if (typeUtils.isString(data[key]) && data[key].toLowerCase().includes(search.toLowerCase())) {
                result.total = result.total + 1;
                return true;
              } else if (
                (typeUtils.isNil(data[key]) || typeUtils.isBoolean(data[key]) || (typeUtils.isNumeric(data[key]) && typeUtils.isNumeric(search))) &&
                parseFloat(data[key]) === parseFloat(search)
              ) {
                result.total = result.total + 1;
                return true;
              }
            }
            return false;
          }
          return false;
        });
      });
      let start = page * itemsPerPage;
      let end = page * itemsPerPage + itemsPerPage;
      result.results = searchedData.slice(start, end);
      return result;
    } else {
      if (itemsPerPage && parseInt(itemsPerPage) === -1) {
        return await query.page(parseInt(page), parseInt(totalSubmissions || 0));
      } else if (itemsPerPage && parseInt(page) >= 0) {
        return await query.page(parseInt(page), parseInt(itemsPerPage));
      }
    }
  },

  publishVersion: async (formId, formVersionId, params = {}, currentUser) => {
    let trx;
    try {
      // allow an unpublish if they pass in unpublish parameter with an affirmative
      const publish = params.unpublish ? falsey(params.unpublish) : true;
      const form = await service.readForm(formId);
      trx = await FormVersion.startTransaction();

      await FormVersion.query(trx)
        .patch({
          published: false,
          updatedBy: currentUser.usernameIdp,
        })
        .where('formId', form.id)
        .where('published', publish);

      await FormVersion.query(trx).findById(formVersionId).patch({
        published: publish,
        updatedBy: currentUser.usernameIdp,
      });

      await trx.commit();
      eventService.publishFormEvent(formId, formVersionId, publish);

      // return the published form/version...
      return await service.readPublishedForm(formId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readVersion: (formVersionId) => {
    return FormVersion.query().findById(formVersionId).throwIfNotFound();
  },

  readVersionFields: async (formVersionId) => {
    // Recursively find all field key names
    // TODO: Consider if this should be a form utils function instead?
    const findFields = (obj) => {
      const fields = [];
      if (!obj.hidden) {
        // Only add key if it is an input and visible
        if (obj.input) {
          fields.push(obj.key);
        } else if (Array.isArray(obj) && obj.length) {
          // Handle table layouts, where it's an array without keys.
          fields.push(obj.flatMap((o) => findFields(o)));
        } else {
          // Recursively check all children attributes that are arrays
          Object.keys(obj).forEach((key) => {
            if (Array.isArray(obj[key]) && obj[key].length) {
              fields.push(obj[key].flatMap((o) => findFields(o)));
            }
          });
        }
      }
      return fields.flat();
    };

    const { schema } = await service.readVersion(formVersionId);
    return schema.components.flatMap((c) => findFields(c));
  },
  listSubmissions: async (formVersionId, params) => {
    return FormSubmission.query().where('formVersionId', formVersionId).modify('filterCreatedBy', params.createdBy).modify('orderDescending');
  },
  createSubmission: async (formVersionId, data, currentUser) => {
    let trx;
    try {
      const formVersion = await service.readVersion(formVersionId);
      const { identityProviders } = await service.readForm(formVersion.formId);

      trx = await FormSubmission.startTransaction();

      // Ensure we only record the user if the form is not public facing
      const isPublicForm = identityProviders.some((idp) => idp.code === 'public');
      const createdBy = isPublicForm ? 'public' : currentUser.usernameIdp;

      const submissionId = uuidv4();
      const obj = Object.assign(
        {
          id: submissionId,
          formVersionId: formVersion.id,
          confirmationId: submissionId.substring(0, 8).toUpperCase(),
          createdBy: createdBy,
        },
        data
      );

      await FormSubmission.query(trx).insert(obj);

      if (!isPublicForm && !currentUser.public) {
        // Provide the submission creator appropriate CRUD permissions if this is a non-public form
        // we decided that submitter cannot delete or update their own submission unless it's a draft
        // We know this is the submission creator when we see the SUBMISSION_CREATE permission
        // These are adjusted at the update point if going from draft to submitted, or when adding
        // team submitters to a draft
        const perms = [Permissions.SUBMISSION_CREATE, Permissions.SUBMISSION_READ];
        if (data.draft) {
          perms.push(Permissions.SUBMISSION_DELETE, Permissions.SUBMISSION_UPDATE);
        }

        const itemsToInsert = perms.map((perm) => ({
          id: uuidv4(),
          userId: currentUser.id,
          formSubmissionId: submissionId,
          permission: perm,
          createdBy: createdBy,
        }));

        await FormSubmissionUser.query(trx).insert(itemsToInsert);
      }

      if (!data.draft) {
        // Add a SUBMITTED status if it's not a draft
        const stObj = {
          id: uuidv4(),
          submissionId: submissionId,
          code: Statuses.SUBMITTED,
          createdBy: createdBy,
        };

        await FormSubmissionStatus.query(trx).insert(stObj);
      }

      eventService.formSubmissionEventReceived(formVersion.formId, formVersion.id, submissionId, data);

      // does this submission contain any file uploads?
      // if so, we need to update the file storage records.
      // use the schema to determine if there are uploads, fetch the ids from the submission data...
      const fileIds = service._findFileIds(formVersion.schema, data);
      for (const fileId of fileIds) {
        await FileStorage.query(trx).patchAndFetchById(fileId, { formSubmissionId: obj.id, updatedBy: currentUser.usernameIdp });
      }

      await trx.commit();
      const result = await service.readSubmission(obj.id);

      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  createMultiSubmission: async (formVersionId, data, currentUser) => {
    let trx;
    try {
      const formVersion = await service.readVersion(formVersionId);

      const { identityProviders, enableSubmitterDraft, allowSubmitterToUploadFile } = await service.readForm(formVersion.formId);

      if (!enableSubmitterDraft) throw new Problem(401, `This form is not allowed to save draft.`);

      if (!allowSubmitterToUploadFile) throw new Problem(401, `This form is not allowed for multi draft upload.`);
      // Ensure we only record the user if the form is not public facing
      const isPublicForm = identityProviders.some((idp) => idp.code === 'public');

      if (!isPublicForm && !currentUser.public) {
        // Provide the submission creator appropriate CRUD permissions if this is a non-public form
        // we decided that subitter cannot delete or update their own submission unless it's a draft
        // We know this is the submission creator when we see the SUBMISSION_CREATE permission
        // These are adjusted at the update point if going from draft to submitted, or when adding
        // team submitters to a draft
        trx = await FormSubmission.startTransaction();
        const createdBy = currentUser.usernameIdp;
        const submissionDataArray = data.submission.data;
        const recordWithoutData = data;
        delete recordWithoutData.submission.data;
        let recordsToInsert = [];
        let submissionId;
        // let's create multiple submissions with same metadata
        service.popFormLevelInfo(submissionDataArray).map((singleData) => {
          submissionId = uuidv4();
          recordsToInsert.push({
            ...recordWithoutData,
            id: submissionId,
            formVersionId: formVersion.id,
            confirmationId: submissionId.substring(0, 8).toUpperCase(),
            createdBy: createdBy,
            submission: {
              ...recordWithoutData.submission,
              data: singleData,
            },
          });
        });
        const result = await FormSubmission.query(trx).insert(recordsToInsert);
        const perms = [Permissions.SUBMISSION_CREATE, Permissions.SUBMISSION_READ];
        if (data.draft) {
          perms.push(Permissions.SUBMISSION_DELETE, Permissions.SUBMISSION_UPDATE);
        }
        let itemsToInsert = [];
        result.map((singleSubmission) => {
          itemsToInsert.push(
            ...perms.map((perm) => ({
              id: uuidv4(),
              userId: currentUser.id,
              formSubmissionId: singleSubmission.id,
              permission: perm,
              createdBy: createdBy,
            }))
          );
        });
        await FormSubmissionUser.query(trx).insert(itemsToInsert);
        await trx.commit();
        return result;
      } else {
        throw new Problem(401, `This operation is not allowed to public.`);
      }
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  listSubmissionFields: (formVersionId, fields) => {
    return FormSubmission.query()
      .select(
        'id',
        fields.map((f) => ref(`submission:data.${f}`).as(f.split('.').slice(-1)))
      )
      .where('formVersionId', formVersionId)
      .modify('orderDescending');
  },

  readSubmission: (id) => {
    return FormSubmission.query().findById(id).throwIfNotFound();
  },

  listDrafts: async (formId, params) => {
    await service.readForm(formId, queryUtils.defaultActiveOnly(params));
    return FormVersionDraft.query()
      .select('id', 'formId', 'formVersionId', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt')
      .where('formId', formId)
      .modify('filterFormVersionId', params.formVersionId)
      .modify('orderDescending');
  },
  createDraft: async (formId, data, currentUser) => {
    let trx;
    try {
      const form = await service.readForm(formId);
      trx = await FormVersionDraft.startTransaction();

      // data.schema, maybe data.formVersionId
      const obj = Object.assign({}, data);
      obj.id = uuidv4();
      obj.formId = form.id;
      obj.createdBy = currentUser.usernameIdp;

      await FormVersionDraft.query(trx).insert(obj);
      await trx.commit();
      const result = await service.readDraft(obj.id);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  updateDraft: async (formVersionDraftId, data, currentUser) => {
    let trx;
    try {
      const obj = await service.readDraft(formVersionDraftId);
      trx = await FormVersionDraft.startTransaction();
      await FormVersionDraft.query(trx).patchAndFetchById(formVersionDraftId, {
        schema: data.schema,
        formVersionId: data.formVersionId,
        updatedBy: currentUser.usernameIdp,
      });
      await trx.commit();
      return await service.readDraft(obj.id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  readDraft: async (formVersionDraftId) => {
    return FormVersionDraft.query().findById(formVersionDraftId).throwIfNotFound();
  },
  deleteDraft: async (formVersionDraftId) => {
    return FormVersionDraft.query().deleteById(formVersionDraftId).throwIfNotFound();
  },
  publishDraft: async (formId, formVersionDraftId, currentUser) => {
    let trx;
    try {
      const form = await service.readForm(formId);
      const draft = await service.readDraft(formVersionDraftId);
      trx = await FormVersionDraft.startTransaction();

      const version = {
        id: uuidv4(),
        formId: form.id,
        version: form.versions.length ? form.versions[0].version + 1 : 1,
        createdBy: currentUser.usernameIdp,
        schema: draft.schema,
        published: true,
      };

      // this is where we create change the version data.
      // mark all published as not published.
      await FormVersion.query(trx).patch({ published: false }).where('formId', form.id);

      // add a record using this schema, mark as published and increment the version number
      await FormVersion.query(trx).insert(version);

      // delete the draft...
      await FormVersionDraft.query().deleteById(formVersionDraftId);
      await trx.commit();

      eventService.publishFormEvent(formId, version.id, version.published);

      // return the published version...
      return await service.readVersion(version.id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },
  getStatusCodes: async (formId) => {
    return FormStatusCode.query().withGraphFetched('statusCode').where('formId', formId);
  },

  // -----------------------------------------------------------------------------
  // API Key
  // -----------------------------------------------------------------------------
  // Modification actions are audited in form_api_key_audit via a trigger

  // Get the current key for a form
  readApiKey: (formId) => {
    return FormApiKey.query().modify('filterFormId', formId).first();
  },

  // Add an API key to the form, delete any existing key
  createOrReplaceApiKey: async (formId, currentUser) => {
    let trx;
    try {
      const currentKey = await service.readApiKey(formId);
      trx = await FormApiKey.startTransaction();

      if (currentKey) {
        // Replace API key for the form
        await FormApiKey.query(trx).modify('filterFormId', formId).update({
          formId: formId,
          secret: uuidv4(),
          updatedBy: currentUser.usernameIdp,
          filesApiAccess: false,
        });
      } else {
        // Add new API key for the form
        await FormApiKey.query(trx).insert({
          formId: formId,
          secret: uuidv4(),
          createdBy: currentUser.usernameIdp,
          filesApiAccess: false,
        });
      }

      await trx.commit();
      return service.readApiKey(formId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  // Set the filesApiAccess boolean for the api key
  filesApiKeyAccess: async (formId, filesApiAccess) => {
    let trx;
    try {
      if (typeof filesApiAccess !== 'boolean') {
        throw new Problem(400, `filesApiAccess must be a boolean`);
      }
      const currentKey = await service.readApiKey(formId);
      trx = await FormApiKey.startTransaction();

      if (currentKey) {
        await FormApiKey.query(trx).modify('filterFormId', formId).update({
          formId: formId,
          filesApiAccess: filesApiAccess,
        });
      } else {
        throw new Problem(404, `No API key found for form ${formId}`);
      }

      await trx.commit();
      return service.readApiKey(formId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  // Hard delete the current key for a form
  deleteApiKey: async (formId) => {
    const currentKey = await service.readApiKey(formId);
    return FormApiKey.query().deleteById(currentKey.id).throwIfNotFound();
  },

  /**
   * @function getFCProactiveHelpImageUrl
   * get form component proactive help image
   * @param {Object} param consist of publishStatus and componentId.
   * @returns {Promise} An objection query promise
   */
  getFCProactiveHelpImageUrl: async (componentId) => {
    let result = [];
    result = await FormComponentsProactiveHelp.query().modify('findByComponentId', componentId);
    let item = result.length > 0 ? result[0] : null;
    let imageUrl = item !== null ? 'data:' + item.imageType + ';' + 'base64' + ',' + item.image : '';
    return { url: imageUrl };
  },

  /**
   * @function listFormComponentsProactiveHelp
   * Search for all form components help information
   * @returns {Promise} An objection query promise
   */
  listFormComponentsProactiveHelp: async () => {
    let result = [];
    result = await FormComponentsProactiveHelp.query().modify('selectWithoutImages');
    if (result.length > 0) {
      let filterResult = result.map((item) => {
        return {
          id: item.id,
          status: item.publishStatus,
          componentName: item.componentName,
          externalLink: item.externalLink,
          version: item.version,
          groupName: item.groupName,
          description: item.description,
          isLinkEnabled: item.isLinkEnabled,
          imageName: item.componentImageName,
        };
      });
      return await filterResult.reduce(function (r, a) {
        r[a.groupName] = r[a.groupName] || [];
        r[a.groupName].push(a);
        return r;
      }, Object.create(null));
    }
    return {};
  },
  // Get the current subscription settings for a form
  readFormSubscriptionDetails: (formId) => {
    return FormSubscription.query().modify('filterFormId', formId).first();
  },
  // Update subscription settings for a form
  createOrUpdateSubscriptionDetails: async (formId, subscriptionData, currentUser) => {
    let trx;
    try {
      const subscriptionDetails = await service.readFormSubscriptionDetails(formId);
      trx = await FormSubscription.startTransaction();

      if (subscriptionDetails) {
        // Update new subscription settings for a form
        await FormSubscription.query(trx)
          .modify('filterFormId', formId)
          .update({
            ...subscriptionData,
            updatedBy: currentUser.usernameIdp,
          });
      } else {
        // Add new subscription settings for the form
        await FormSubscription.query(trx).insert({
          id: uuidv4(),
          ...subscriptionData,
          createdBy: currentUser.usernameIdp,
        });
      }

      await trx.commit();
      return service.readFormSubscriptionDetails(formId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  popFormLevelInfo: (jsonPayload = []) => {
    /** This function is purely made to remove un-necessery information
     * from the json payload of submissions. It will also help to remove crucial data
     * to be removed from the payload that should not be going to DB like confirmationId,
     * formName,version,createdAt,fullName,username,email,status,assignee,assigneeEmail and
     * lateEntry
     * Example: Sometime end user use the export json file as a bulk
     * upload payload that contains formId, confirmationId and User
     * details as well so we need to remove those details from the payload.
     *
     */
    if (jsonPayload.length) {
      jsonPayload.forEach(function (submission) {
        delete submission.submit;
        delete submission.lateEntry;
        if (Object.prototype.hasOwnProperty.call(submission, 'form')) {
          const propsToRemove = ['confirmationId', 'formName', 'version', 'createdAt', 'fullName', 'username', 'email', 'status', 'assignee', 'assigneeEmail'];

          propsToRemove.forEach((key) => delete submission.form[key]);
        }
      });
    }
    return jsonPayload;
  },

  // -----------------------------------------------------------------------------
  // Email Templates
  // -----------------------------------------------------------------------------

  _getDefaultEmailTemplate: (formId, type) => {
    let template;

    switch (type) {
      case EmailTypes.SUBMISSION_CONFIRMATION:
        template = {
          body: 'Thank you for your {{ form.name }} submission. You can view your submission details by visiting the following links:',
          formId: formId,
          subject: '{{ form.name }} Accepted',
          title: '{{ form.name }} Accepted',
          type: type,
        };
        break;
    }

    return template;
  },

  // Get a specific email template for a form.
  readEmailTemplate: async (formId, type) => {
    let result = await FormEmailTemplate.query().modify('filterFormId', formId).modify('filterType', type).first();

    if (result === undefined) {
      result = service._getDefaultEmailTemplate(formId, type);
    }

    return result;
  },

  // Get all the email templates for a form
  readEmailTemplates: async (formId) => {
    const hasEmailTemplate = (emailTemplates, type) => {
      return emailTemplates.find((t) => t.type === type) !== undefined;
    };

    let result = await FormEmailTemplate.query().modify('filterFormId', formId);

    // In the case that there is no email template in the database, use the
    // default values.
    if (!hasEmailTemplate(result, EmailTypes.SUBMISSION_CONFIRMATION)) {
      result.push(service._getDefaultEmailTemplate(formId, EmailTypes.SUBMISSION_CONFIRMATION));
    }

    return result;
  },

  createOrUpdateEmailTemplate: async (formId, data, currentUser) => {
    let transaction;
    try {
      const emailTemplate = await service.readEmailTemplate(formId, data.type);
      transaction = await FormEmailTemplate.startTransaction();

      if (emailTemplate.id) {
        // Update new email template settings for a form
        await FormEmailTemplate.query(transaction)
          .modify('filterId', emailTemplate.id)
          .update({
            ...data,
            updatedBy: currentUser.usernameIdp,
          });
      } else {
        // Add new email template settings for the form
        await FormEmailTemplate.query(transaction).insert({
          id: uuidv4(),
          ...data,
          createdBy: currentUser.usernameIdp,
        });
      }

      await transaction.commit();

      return service.readEmailTemplates(formId);
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }

      throw error;
    }
  },
};

module.exports = service;
