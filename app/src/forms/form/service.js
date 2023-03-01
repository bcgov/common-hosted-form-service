const Problem = require('api-problem');
const { ref } = require('objection');
const { v4: uuidv4 } = require('uuid');

const {
  FileStorage,
  Form,
  FormApiKey,
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
  FormComponentsProactiveHelp
} = require('../common/models');
const { falsey, queryUtils, checkIsFormExpired } = require('../common/utils');
const { Permissions, Roles, Statuses } = require('../common/constants');
const Rolenames = [Roles.OWNER, Roles.TEAM_MANAGER, Roles.FORM_DESIGNER, Roles.SUBMISSION_REVIEWER, Roles.FORM_SUBMITTER];

const service = {

  // Get the list of file IDs from the submission
  _findFileIds: (schema, data) => {
    return schema.components
      // Get the file controls
      .filter(x => x.type === 'simplefile')
      // for the file controls, get their respective data element (skip if it's not in data)
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap#for_adding_and_removing_items_during_a_map
      .flatMap(x => data.submission.data[x.key] ? data.submission.data[x.key] : [])
      // get the id from the data
      .map(x => x.data.id);
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
    try {
      trx = await Form.startTransaction();
      const obj = {};
      obj.id = uuidv4();
      obj.name = data.name;
      obj.description = data.description;
      obj.active = true;
      obj.labels = data.labels;
      obj.showSubmissionConfirmation = data.showSubmissionConfirmation;
      obj.submissionReceivedEmails = data.submissionReceivedEmails;
      obj.enableStatusUpdates = data.enableStatusUpdates;
      obj.enableSubmitterDraft = data.enableSubmitterDraft;
      obj.createdBy = currentUser.usernameIdp;
      obj.schedule = data.schedule;
      obj.reminder = data.reminder;

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
      const userRoles = Rolenames.map(r => {
        return { id: uuidv4(), createdBy: currentUser.usernameIdp, userId: currentUser.id, formId: obj.id, role: r };
      });
      await FormRoleUser.query(trx).insert(userRoles);

      // create a unpublished draft
      const draft = {
        id: uuidv4(),
        formId: obj.id,
        createdBy: currentUser.usernameIdp,
        schema: data.schema
      };
      await FormVersionDraft.query(trx).insert(draft);

      // Map all status codes to the form - hardcoded to include all states
      // TODO: Could make this more dynamic and settable by the user if that feature is required
      const defaultStatuses = Object.values(Statuses).map((status) => ({
        id: uuidv4(),
        formId: obj.id,
        code: status,
        createdBy: currentUser.usernameIdp
      }));
      await FormStatusCode.query(trx).insert(defaultStatuses);

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
      const upd = {
        name: data.name,
        description: data.description,
        labels: data.labels ? data.labels : [],
        showSubmissionConfirmation: data.showSubmissionConfirmation,
        submissionReceivedEmails: data.submissionReceivedEmails ? data.submissionReceivedEmails : [],
        enableStatusUpdates: data.enableStatusUpdates,
        enableSubmitterDraft: data.enableSubmitterDraft,
        updatedBy: currentUser.usernameIdp,
        schedule: data.schedule,
        reminder: data.reminder
      };

      await Form.query(trx).patchAndFetchById(formId, upd);

      // remove any existing links to identity providers, and the updated ones
      await FormIdentityProvider.query(trx).delete().where('formId', obj.id);

      // insert any new identity providers
      const fIdps = data.identityProviders.map(p => ({
        id: uuidv4(),
        formId: obj.id,
        code: p.code,
        createdBy: currentUser.usernameIdp
      }));
      if (fIdps && fIdps.length) await FormIdentityProvider.query(trx).insert(fIdps);

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
      .allowGraph('[identityProviders,versions]')
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
      .then(form => {
        form.idpHints = form.idpHints.map(idp => idp.code);
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
      .then(form => {
        // there are some configs that we don't want returned here...
        delete form.submissionReceivedEmails;
        //Lets Replace the original schedule Object as it should not expose schedule data to FE users.
        form.schedule = checkIsFormExpired(form.schedule);
        return form;
      });
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
      .modify('filterCreatedAt', params.createdAt[0], params.createdAt[1])
      .modify('orderDefault');
    const selection = ['confirmationId', 'createdAt', 'formId', 'formSubmissionStatusCode', 'submissionId', 'deleted', 'createdBy', 'formVersionId'];
    if (params.fields && params.fields.length) {
      let fields = [];
      if (Array.isArray(params.fields)) {
        fields = params.fields.flatMap(f => f.split(',').map(s => s.trim()));
      } else {
        fields = params.fields.split(',').map(s => s.trim());
      }
      fields.push('lateEntry');
      query.select(selection, fields.map(f => ref(`submission:data.${f}`).as(f.split('.').slice(-1))));
    } else {
      query.select(selection, ['lateEntry'].map(f => ref(`submission:data.${f}`).as(f.split('.').slice(-1))));
    }
    return query;
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
          updatedBy: currentUser.usernameIdp
        })
        .where('formId', form.id)
        .where('published', publish);

      await FormVersion.query(trx)
        .findById(formVersionId)
        .patch({
          published: publish,
          updatedBy: currentUser.usernameIdp
        });

      await trx.commit();

      // return the published form/version...
      return await service.readPublishedForm(formId);

    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readVersion: (formVersionId) => {
    return FormVersion.query()
      .findById(formVersionId)
      .throwIfNotFound();
  },

  readVersionFields: async (formVersionId) => {
    // Recursively find all field key names
    // TODO: Consider if this should be a form utils function instead?
    const findFields = (obj) => {
      const fields = [];
      if (!obj.hidden) {
        // Only add key if it is an input and visible
        if (obj.input) fields.push(obj.key);
        // Recursively check all children attributes that are arrays
        else {
          Object.keys(obj).forEach(key => {
            if (Array.isArray(obj[key]) && obj[key].length) {
              fields.push(obj[key].flatMap(o => findFields(o)));
            }
          });
        }
      }
      return fields.flat();
    };

    const { schema } = await service.readVersion(formVersionId);
    return schema.components.flatMap(c => findFields(c));
  },

  listSubmissions: async (formVersionId, params) => {
    return FormSubmission.query()
      .where('formVersionId', formVersionId)
      .modify('filterCreatedBy', params.createdBy)
      .modify('orderDescending');
  },

  createSubmission: async (formVersionId, data, currentUser) => {
    let trx;
    try {
      const formVersion = await service.readVersion(formVersionId);
      const { identityProviders } = await service.readForm(formVersion.formId);

      trx = await FormSubmission.startTransaction();

      // Ensure we only record the user if the form is not public facing
      const isPublicForm = identityProviders.some(idp => idp.code === 'public');
      const createdBy = isPublicForm ? 'public' : currentUser.usernameIdp;

      const submissionId = uuidv4();
      const obj = Object.assign({
        id: submissionId,
        formVersionId: formVersion.id,
        confirmationId: submissionId.substring(0, 8).toUpperCase(),
        createdBy: createdBy
      }, data);

      await FormSubmission.query(trx).insert(obj);

      if (!isPublicForm && !currentUser.public) {
        // Provide the submission creator appropriate CRUD permissions if this is a non-public form
        // we decided that subitter cannot delete or update their own submission unless it's a draft
        // We know this is the submission creator when we see the SUBMISSION_CREATE permission
        // These are adjusted at the update point if going from draft to submitted, or when adding
        // team submitters to a draft
        const perms = [
          Permissions.SUBMISSION_CREATE,
          Permissions.SUBMISSION_READ
        ];
        if (data.draft) {
          perms.push(Permissions.SUBMISSION_DELETE, Permissions.SUBMISSION_UPDATE);
        }

        const itemsToInsert = perms.map(perm => ({
          id: uuidv4(),
          userId: currentUser.id,
          formSubmissionId: submissionId,
          permission: perm,
          createdBy: createdBy
        }));

        await FormSubmissionUser.query(trx).insert(itemsToInsert);
      }

      if (!data.draft) {
        // Add a SUBMITTED status if it's not a draft
        const stObj = {
          id: uuidv4(),
          submissionId: submissionId,
          code: Statuses.SUBMITTED,
          createdBy: createdBy
        };

        await FormSubmissionStatus.query(trx).insert(stObj);
      }

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

  listSubmissionFields: (formVersionId, fields) => {
    return FormSubmission.query()
      .select('id', fields.map(f => ref(`submission:data.${f}`).as(f.split('.').slice(-1))))
      .where('formVersionId', formVersionId)
      .modify('orderDescending');
  },

  readSubmission: (id) => {
    return FormSubmission.query()
      .findById(id)
      .throwIfNotFound();
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
        updatedBy: currentUser.usernameIdp
      });
      await trx.commit();
      return await service.readDraft(obj.id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readDraft: async (formVersionDraftId) => {
    return FormVersionDraft.query()
      .findById(formVersionDraftId)
      .throwIfNotFound();
  },

  deleteDraft: async (formVersionDraftId) => {
    return FormVersionDraft.query()
      .deleteById(formVersionDraftId)
      .throwIfNotFound();
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
        published: true
      };

      // this is where we create change the version data.
      // mark all published as not published.
      await FormVersion.query(trx)
        .patch({ published: false })
        .where('formId', form.id);

      // add a record using this schema, mark as published and increment the version number
      await FormVersion.query(trx).insert(version);

      // delete the draft...
      await FormVersionDraft.query().deleteById(formVersionDraftId);
      await trx.commit();

      // return the published version...
      return await service.readVersion(version.id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  getStatusCodes: async (formId) => {
    return FormStatusCode.query()
      .withGraphFetched('statusCode')
      .where('formId', formId);
  },

  // -----------------------------------------------------------------------------
  // API Key
  // -----------------------------------------------------------------------------
  // Modification actions are audited in form_api_key_audit via a trigger

  // Get the current key for a form
  readApiKey: (formId) => {
    return FormApiKey.query()
      .modify('filterFormId', formId)
      .first();
  },

  // Add an API key to the form, delete any existing key
  createOrReplaceApiKey: async (formId, currentUser) => {
    let trx;
    try {
      const currentKey = await service.readApiKey(formId);
      trx = await FormApiKey.startTransaction();

      if (currentKey) {
        // Replace API key for the form
        await FormApiKey.query(trx)
          .modify('filterFormId', formId)
          .update({
            formId: formId,
            secret: uuidv4(),
            updatedBy: currentUser.usernameIdp
          });
      } else {
        // Add new API key for the form
        await FormApiKey.query(trx).insert({
          formId: formId,
          secret: uuidv4(),
          createdBy: currentUser.usernameIdp
        });
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
    return FormApiKey.query()
      .deleteById(currentKey.id)
      .throwIfNotFound();
  },

  /**
  * @function getFCProactiveHelpImageUrl
  * get form component proactive help image
  * @param {Object} param consist of publishStatus and componentId.
  * @returns {Promise} An objection query promise
  */
  getFCProactiveHelpImageUrl: async(componentId) =>{

    let result=[];
    result = await FormComponentsProactiveHelp.query()
      .modify('findByComponentId',componentId);
    let item = result.length>0?result[0]:null;
    let imageUrl = item!==null?'data:' + item.imageType + ';' + 'base64' + ',' + item.image:'';
    return {url: imageUrl} ;
  },

  /**
   * @function listFormComponentsProactiveHelp
   * Search for all form components help information
   * @returns {Promise} An objection query promise
  */
  listFormComponentsProactiveHelp: async () => {
    let result=[];
    result = await FormComponentsProactiveHelp.query()
      .modify('selectWithoutImages');
    if(result.length>0) {
      let filterResult= result.map(item=> {
        return ({id:item.id,status:item.publishStatus,componentName:item.componentName,externalLink:item.externalLink,
          version:item.version,groupName:item.groupName,description:item.description, isLinkEnabled:item.isLinkEnabled,
          imageName:item.componentImageName });
      });
      return await filterResult.reduce(function (r, a) {
        r[a.groupName] = r[a.groupName] || [];
        r[a.groupName].push(a);
        return r;
      }, Object.create(null));

    }
    return {};
  },

};

module.exports = service;
