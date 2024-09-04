const { v4: uuidv4 } = require('uuid');

const log = require('../../components/log')(module.filename);

const { Statuses } = require('../common/constants');
const { FileStorage, Form, FormVersion, FormSubmission, FormSubmissionStatus, Note, SubmissionAudit, SubmissionMetadata } = require('../common/models');
const emailService = require('../email/emailService');
const eventService = require('../event/eventService');
const fileService = require('../file/service');
const formService = require('../form/service');
const permissionService = require('../permission/service');

const service = {
  // -------------------------------------------------------------------------------------------------------
  // Submissions
  // -------------------------------------------------------------------------------------------------------
  _fetchSubmissionData: async (formSubmissionId) => {
    const meta = await SubmissionMetadata.query().where('submissionId', formSubmissionId).first().throwIfNotFound();

    return await Promise.all([
      FormSubmission.query().findById(meta.submissionId).throwIfNotFound(),
      FormVersion.query().findById(meta.formVersionId).throwIfNotFound(),
      Form.query().findById(meta.formId).allowGraph('identityProviders').withGraphFetched('identityProviders(orderDefault)').throwIfNotFound(),
    ]).then((data) => {
      return {
        submission: data[0],
        version: data[1],
        form: data[2],
      };
    });
  },

  // -------------------------------------------------------------------------------------------------------
  // Submissions
  // -------------------------------------------------------------------------------------------------------
  _fetchSpecificSubmissionData: async (formSubmissionIds) => {
    const meta = await SubmissionMetadata.query().whereIn('submissionId', formSubmissionIds);

    if (meta.length > 0) {
      let submissionIds = meta.map((SubmissionMetadata) => SubmissionMetadata.submissionId);
      let formVersionId = [...new Set(meta.map((SubmissionMetadata) => SubmissionMetadata.formVersionId))].at(0);
      let formId = [...new Set(meta.map((SubmissionMetadata) => SubmissionMetadata.formId))].at(0);
      return await Promise.all([
        FormSubmission.query().findByIds(submissionIds).throwIfNotFound(),
        FormVersion.query().findByIds(formVersionId).throwIfNotFound(),
        Form.query().findByIds(formId).allowGraph('identityProviders').withGraphFetched('identityProviders(orderDefault)').throwIfNotFound(),
      ]).then((data) => {
        return {
          submission: data[0],
          version: data[1],
          form: data[2],
        };
      });
    }
    return [];
  },

  /**
   * Given the data for a submission, find the file uploads.
   *
   * @param {object} data the data for a submission.
   * @returns an array of file UUIDs.
   */
  _findFileIds: (data) => {
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

  read: (formSubmissionId) => service._fetchSubmissionData(formSubmissionId),

  readSubmissionData: (formSubmissionIds) => service._fetchSpecificSubmissionData(formSubmissionIds),

  update: async (formSubmissionId, data, currentUser, referrer, etrx = undefined) => {
    let trx;
    try {
      trx = etrx ? etrx : await FormSubmission.startTransaction();

      // If we're restoring a submission
      if (data['deleted'] !== undefined && typeof data.deleted == 'boolean') {
        await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, { deleted: data.deleted, updatedBy: currentUser.usernameIdp });
      } else {
        const statuses = await FormSubmissionStatus.query().modify('filterSubmissionId', formSubmissionId).modify('orderDescending');
        if (!data.draft) {
          // Write a SUBMITTED status only if this is in REVISING state OR is a brand new submission
          if (!statuses || !statuses.length || statuses[0].code === Statuses.REVISING) {
            await service.changeStatusState(formSubmissionId, { code: Statuses.SUBMITTED }, currentUser, trx);
            // If finalizing submission, send the submission email (quiet fail if anything goes wrong)
            const submissionMetaData = await SubmissionMetadata.query().where('submissionId', formSubmissionId).first();
            emailService.submissionReceived(submissionMetaData.formId, formSubmissionId, data, referrer).catch(() => {});
            eventService.formSubmissionEventReceived(submissionMetaData.formId, submissionMetaData.formVersionId, formSubmissionId, data);
          }
        } else {
          if (statuses && statuses.length > 0 && (statuses[0].code === Statuses.SUBMITTED || statuses[0].code === Statuses.COMPLETED)) {
            return false;
          }
        }

        // Patch the submission record with the updated changes
        await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, {
          draft: data.draft,
          submission: data.submission,
          updatedBy: currentUser.usernameIdp,
        });

        // Update new file uploads with the submission ID.
        const fileIds = service._findFileIds(data);
        for (const fileId of fileIds) {
          const fileStorage = await fileService.read(fileId);
          if (!fileStorage.formSubmissionId) {
            await FileStorage.query(trx).patchAndFetchById(fileId, { formSubmissionId: formSubmissionId, updatedBy: currentUser.usernameIdp });
            fileService.moveSubmissionFile(formSubmissionId, fileStorage, currentUser.usernameIdp).catch((error) => {
              // Log it, but since storage can't be part of the transaction then
              // deal with the state it's in when the error is investigated.
              log.error('Error moving file', error);
            });
          }
        }
      }

      if (!etrx) await trx.commit();

      return service.read(formSubmissionId);
    } catch (err) {
      if (!etrx && trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function setDraftState
   * Changes the draft state of this submission
   * @param {string} submissionId The submission id
   * @param {boolean} draft Mark submission id as a draft or not
   * @param {object} currentUser The currently logged in user metadata
   * @param {object} [etrx=undefined] An optional Objection Transaction object
   * @returns The new form submission object
   * @throws The error encountered upon db transaction failure
   */
  setDraftState: async (submissionId, draft, currentUser, etrx = undefined) => {
    let trx;
    try {
      trx = etrx ? etrx : await FormSubmission.startTransaction();

      const result = await FormSubmission.query(trx).patchAndFetchById(submissionId, {
        draft: draft,
        updatedBy: currentUser.usernameIdp,
      });

      if (!etrx) await trx.commit();
      return result;
    } catch (err) {
      if (!etrx && trx) await trx.rollback();
      throw err;
    }
  },

  delete: async (formSubmissionId, currentUser) => {
    let trx;
    try {
      trx = await FormSubmission.startTransaction();
      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, {
        deleted: true,
        updatedBy: currentUser.usernameIdp,
      });
      await trx.commit();
      return await service.read(formSubmissionId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  deleteMultipleSubmissions: async (submissionIds, currentUser) => {
    let trx;
    try {
      trx = await FormSubmission.startTransaction();
      await FormSubmission.query(trx).patch({ deleted: true, updatedBy: currentUser.usernameIdp }).whereIn('id', submissionIds);
      await trx.commit();
      return await service.readSubmissionData(submissionIds);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  restoreMultipleSubmissions: async (submissionIds, currentUser) => {
    let trx;
    try {
      trx = await FormSubmission.startTransaction();
      await FormSubmission.query(trx)
        .patch({
          deleted: false,
          updatedBy: currentUser.usernameIdp,
        })
        .whereIn('id', submissionIds);
      await trx.commit();
      return await service.readSubmissionData(submissionIds);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  restore: async (formSubmissionId, data, currentUser) => {
    let trx;
    try {
      trx = await FormSubmission.startTransaction();
      await FormSubmission.query(trx).patchAndFetchById(formSubmissionId, {
        deleted: data.deleted,
        updatedBy: currentUser.usernameIdp,
      });
      await trx.commit();
      return await service.read(formSubmissionId);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  readOptions: async (formSubmissionId) => {
    const meta = await SubmissionMetadata.query().where('submissionId', formSubmissionId).first().throwIfNotFound();

    const form = await formService.readFormOptions(meta.formId);

    return {
      submission: {
        id: meta.submissionId,
        formVersionId: meta.formId,
      },
      version: {
        id: meta.formVersionId,
        formId: meta.formId,
      },
      form: form,
    };
  },

  /** get the audit history metadata (nothing that edited a draft for now) */
  listEdits: (submissionId) => {
    return SubmissionAudit.query()
      .select('id', 'updatedByUsername', 'actionTimestamp', 'action')
      .modify('filterSubmissionId', submissionId)
      .modify('filterDraft', false)
      .modify('orderDefault');
  },
  // --------------------------------------------------------------------------------------------/Submissions

  // -------------------------------------------------------------------------------------------------------
  // Notes
  // -------------------------------------------------------------------------------------------------------
  _createNote: async (submissionId, data, currentUser) => {
    let trx;
    try {
      trx = await Note.startTransaction();
      const result = await Note.query(trx).insertAndFetch({
        id: uuidv4(),
        submissionId: submissionId,
        submissionStatusId: data.submissionStatusId,
        note: data.note,
        userId: data.userId,
        createdBy: currentUser.usernameIdp,
      });
      await trx.commit();

      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  /** Add a note for a specific submission */
  addNote: (formSubmissionId, data, currentUser) => {
    return service._createNote(formSubmissionId, data, currentUser);
  },

  /** Get notes for a specific submission */
  getNotes: (formSubmissionId) => {
    return Note.query().modify('filterSubmissionId', formSubmissionId).modify('orderDefault');
  },

  /** Get a specific note */
  getNote: (noteId) => {
    return Note.query().modify('filterId', noteId);
  },
  // -------------------------------------------------------------------------------------------------/Notes

  // -------------------------------------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------------------------------------
  /**
   * @function getStatus
   * Get status history for a specific submission
   * @param {string} The submission id
   * @returns The current status object
   */
  getStatus: (formSubmissionId) => {
    return FormSubmissionStatus.query().modify('filterSubmissionId', formSubmissionId).withGraphFetched('user').modify('orderDescending');
  },

  /**
   * @function changeStatusState
   * Changes the status state of this submission. This method serves as the 'state machine' for submission permissions.
   * @param {string} submissionId The submission id
   * @param {object} data The data to persist
   * @param {object} currentUser The currently logged in user metadata
   * @param {object} [etrx=undefined] An optional Objection Transaction object
   * @returns The new current status object
   * @throws The error encountered upon db transaction failure
   */
  changeStatusState: async (submissionId, data, currentUser, etrx = undefined) => {
    let trx;
    try {
      trx = etrx ? etrx : await FormSubmissionStatus.startTransaction();

      // Create a new status entry
      await service.createStatus(submissionId, data, currentUser, trx);

      // Determine draft flag state on submission - true if revising, false otherwise
      const draft = data.code === Statuses.REVISING;
      const formSubmission = await FormSubmission.query(trx).findById(submissionId);

      // Only change draft state and permissions if draft state is getting toggled
      if (formSubmission.draft !== draft) {
        await service.setDraftState(submissionId, draft, currentUser, trx);

        if (draft) {
          // Allow submitter users to edit the draft again if Revising status
          await permissionService.setUserEditable(submissionId, currentUser, trx);
        } else {
          // Prevent submitter users from editing the submission
          await permissionService.setUserReadOnly(submissionId, trx);
        }
      }

      if (!etrx) await trx.commit();
      return service.getStatus(submissionId);
    } catch (err) {
      if (!etrx && trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function createStatus
   * Adds a status history for a specific submission
   * @param {string} submissionId The submission id
   * @param {object} data The data to persist
   * @param {object} currentUser The currently logged in user metadata
   * @param {object} [etrx=undefined] An optional Objection Transaction object
   * @returns The current status object
   * @throws The error encountered upon db transaction failure
   */
  createStatus: async (submissionId, data, currentUser, etrx = undefined) => {
    let trx;
    try {
      trx = etrx ? etrx : await FormSubmissionStatus.startTransaction();

      await FormSubmissionStatus.query(trx).insert({
        id: uuidv4(),
        submissionId: submissionId,
        code: data.code,
        assignedToUserId: data.assignedToUserId,
        actionDate: data.actionDate,
        createdBy: currentUser.usernameIdp,
      });

      if (!etrx) await trx.commit();
      return service.getStatus(submissionId);
    } catch (err) {
      if (!etrx && trx) await trx.rollback();
      throw err;
    }
  },

  /**
   * @function getEmailRecipients
   * Get email recipients that were selected when the status was set to REVISING
   * @param {string} submissionId The submission id
   * @returns The email recipients
   */
  getEmailRecipients: (submissionId) => {
    return FormSubmissionStatus.query().modify('filterSubmissionId', submissionId).where('code', Statuses.REVISING).modify('orderDescending').first().select('emailRecipients');
  },

  /**
   * @function addEmailRecipients
   * Add email recipients of the REVISING status to the database
   * @param {string} submissionId The submission id
   * @param {string[]} emailRecipients The email recipients
   * @returns confirmation of the email recipients being added
   */
  addEmailRecipients: async (submissionId, emailRecipients) => {
    // Convert the JavaScript array to a PostgreSQL array literal
    const pgArray = `{${emailRecipients.map((email) => `"${email}"`).join(',')}}`;

    await FormSubmissionStatus.query()
      .modify('filterSubmissionId', submissionId)
      .where('code', Statuses.REVISING)
      .modify('orderDescending')
      .first()
      .patch({
        emailRecipients: FormSubmissionStatus.raw('?::text[]', [pgArray]),
      });
    return service.getEmailRecipients(submissionId);
  },

  // -------------------------------------------------------------------------------------------------/Notes
};

module.exports = service;
